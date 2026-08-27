import os
from typing import Optional

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# Basic Dataset Information
# ---------------------------------------------------------

def get_cleaning_summary(df: pd.DataFrame) -> dict:
    """
    Return basic data-quality information.
    """

    missing_by_column = (
        df.isna()
        .sum()
        .to_dict()
    )

    missing_percentage = (
        (df.isna().sum() / len(df) * 100)
        .round(2)
        .to_dict()
        if len(df) > 0
        else {}
    )

    duplicate_count = int(
        df.duplicated().sum()
    )

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "missing_values": int(
            df.isna().sum().sum()
        ),
        "missing_by_column": {
            str(k): int(v)
            for k, v in missing_by_column.items()
        },
        "missing_percentage": {
            str(k): float(v)
            for k, v in missing_percentage.items()
        },
        "duplicate_rows": duplicate_count,
        "duplicate_percentage": (
            round(
                duplicate_count / len(df) * 100,
                2
            )
            if len(df) > 0
            else 0
        )
    }


# ---------------------------------------------------------
# Missing Value Suggestions
# ---------------------------------------------------------

def suggest_missing_value_method(
    df: pd.DataFrame
) -> dict:
    """
    Suggest the most appropriate missing-value
    treatment for each column.
    """

    suggestions = {}

    for column in df.columns:

        missing_count = int(
            df[column].isna().sum()
        )

        if missing_count == 0:
            suggestions[column] = {
                "missing_count": 0,
                "method": "No action required"
            }

            continue

        series = df[column]

        if pd.api.types.is_numeric_dtype(series):

            # Median is safer than mean when outliers exist.
            suggestions[column] = {
                "missing_count": missing_count,
                "method": "median",
                "reason": (
                    "Numeric column. Median is robust "
                    "against extreme values."
                )
            }

        elif pd.api.types.is_datetime64_any_dtype(series):

            suggestions[column] = {
                "missing_count": missing_count,
                "method": "forward_fill",
                "reason": (
                    "Date column. Forward fill preserves "
                    "the existing time sequence."
                )
            }

        else:

            mode_values = series.mode()

            if not mode_values.empty:

                suggestions[column] = {
                    "missing_count": missing_count,
                    "method": "mode",
                    "reason": (
                        "Categorical/text column. "
                        "Mode preserves the most common category."
                    )
                }

            else:

                suggestions[column] = {
                    "missing_count": missing_count,
                    "method": "remove_rows",
                    "reason": (
                        "No reliable replacement value was found."
                    )
                }

    return suggestions


# ---------------------------------------------------------
# Fill Missing Values
# ---------------------------------------------------------

def fill_missing_values(
    df: pd.DataFrame,
    method: str = "auto"
) -> pd.DataFrame:
    """
    Fill missing values using automatic or selected strategy.

    Supported methods:
    auto
    mean
    median
    mode
    forward_fill
    backward_fill
    """

    cleaned = df.copy()

    for column in cleaned.columns:

        if not cleaned[column].isna().any():
            continue

        series = cleaned[column]

        selected_method = method

        if method == "auto":

            if pd.api.types.is_numeric_dtype(series):

                selected_method = "median"

            elif pd.api.types.is_datetime64_any_dtype(series):

                selected_method = "forward_fill"

            else:

                selected_method = "mode"

        try:

            if selected_method == "mean":

                if pd.api.types.is_numeric_dtype(series):

                    value = series.mean()

                    if pd.notna(value):
                        cleaned[column] = (
                            series.fillna(value)
                        )

            elif selected_method == "median":

                if pd.api.types.is_numeric_dtype(series):

                    value = series.median()

                    if pd.notna(value):
                        cleaned[column] = (
                            series.fillna(value)
                        )

            elif selected_method == "mode":

                mode_values = series.mode()

                if not mode_values.empty:

                    cleaned[column] = (
                        series.fillna(
                            mode_values.iloc[0]
                        )
                    )

            elif selected_method == "forward_fill":

                cleaned[column] = (
                    series.ffill()
                )

            elif selected_method == "backward_fill":

                cleaned[column] = (
                    series.bfill()
                )

        except Exception:
            # Keep the original data if a particular
            # replacement cannot safely be applied.
            continue

    return cleaned


# ---------------------------------------------------------
# Duplicate Detection
# ---------------------------------------------------------

def detect_duplicates(
    df: pd.DataFrame
) -> dict:
    """
    Detect duplicate rows.
    """

    duplicate_mask = df.duplicated(
        keep="first"
    )

    duplicate_rows = df[
        duplicate_mask
    ].copy()

    count = int(
        duplicate_mask.sum()
    )

    return {
        "count": count,
        "percentage": (
            round(
                count / len(df) * 100,
                2
            )
            if len(df) > 0
            else 0
        ),
        "rows": duplicate_rows
    }


def remove_duplicates(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Remove duplicate rows while keeping
    the first occurrence.
    """

    return (
        df.drop_duplicates(
            keep="first"
        )
        .reset_index(drop=True)
    )


# ---------------------------------------------------------
# IQR Outlier Detection
# ---------------------------------------------------------

def detect_iqr_outliers(
    df: pd.DataFrame
) -> dict:
    """
    Detect numeric outliers using IQR.
    """

    results = {}

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if len(series) < 4:

            results[column] = {
                "outlier_count": 0,
                "lower_bound": None,
                "upper_bound": None
            }

            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        mask = (
            (df[column] < lower_bound)
            |
            (df[column] > upper_bound)
        )

        count = int(
            mask.fillna(False).sum()
        )

        results[column] = {
            "outlier_count": count,
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound)
        }

    return results


# ---------------------------------------------------------
# Z-Score Outlier Detection
# ---------------------------------------------------------

def detect_zscore_outliers(
    df: pd.DataFrame,
    threshold: float = 3.0
) -> dict:
    """
    Detect numeric outliers using Z-score.
    """

    results = {}

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        valid = series.dropna()

        if len(valid) < 2:

            results[column] = {
                "outlier_count": 0,
                "threshold": threshold
            }

            continue

        mean = valid.mean()
        std = valid.std()

        if std == 0 or pd.isna(std):

            results[column] = {
                "outlier_count": 0,
                "threshold": threshold
            }

            continue

        z_scores = (
            (series - mean) / std
        ).abs()

        count = int(
            (z_scores > threshold)
            .fillna(False)
            .sum()
        )

        results[column] = {
            "outlier_count": count,
            "threshold": threshold
        }

    return results


# ---------------------------------------------------------
# Cap Outliers
# ---------------------------------------------------------

def cap_iqr_outliers(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Cap IQR outliers to lower and upper IQR bounds.
    """

    cleaned = df.copy()

    numeric_columns = cleaned.select_dtypes(
        include=np.number
    ).columns

    for column in numeric_columns:

        series = cleaned[column]

        valid = series.dropna()

        if len(valid) < 4:
            continue

        q1 = valid.quantile(0.25)
        q3 = valid.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        cleaned[column] = (
            series.clip(
                lower=lower_bound,
                upper=upper_bound
            )
        )

    return cleaned


# ---------------------------------------------------------
# Data Type Detection
# ---------------------------------------------------------

def detect_data_types(
    df: pd.DataFrame
) -> dict:
    """
    Detect useful semantic data types.
    """

    result = {}

    for column in df.columns:

        series = df[column]

        if pd.api.types.is_bool_dtype(series):

            detected_type = "Boolean"

        elif pd.api.types.is_integer_dtype(series):

            detected_type = "Integer"

        elif pd.api.types.is_float_dtype(series):

            detected_type = "Float"

        elif pd.api.types.is_datetime64_any_dtype(series):

            detected_type = "Date"

        else:

            detected_type = "String"

            # Try detecting dates inside object columns.
            if series.dropna().shape[0] > 0:

                try:

                    converted = pd.to_datetime(
                        series,
                        errors="coerce"
                    )

                    valid_ratio = (
                        converted.notna().mean()
                    )

                    if valid_ratio >= 0.8:

                        detected_type = "Date"

                except Exception:
                    pass

        result[column] = detected_type

    return result


# ---------------------------------------------------------
# Empty Column Detection
# ---------------------------------------------------------

def detect_empty_columns(
    df: pd.DataFrame
) -> list:

    empty_columns = []

    for column in df.columns:

        if df[column].isna().all():

            empty_columns.append(
                str(column)
            )

    return empty_columns


def remove_empty_columns(
    df: pd.DataFrame
) -> pd.DataFrame:

    cleaned = df.copy()

    empty_columns = [
        column
        for column in cleaned.columns
        if cleaned[column].isna().all()
    ]

    if empty_columns:

        cleaned = cleaned.drop(
            columns=empty_columns
        )

    return cleaned


# ---------------------------------------------------------
# Complete Auto Cleaning
# ---------------------------------------------------------

def auto_clean_dataset(
    df: pd.DataFrame,
    remove_duplicate_rows: bool = True,
    handle_missing: bool = True,
    handle_outliers: bool = False,
    outlier_method: str = "cap"
) -> tuple[pd.DataFrame, dict]:
    """
    Perform a safe automatic cleaning process.

    Default behavior:
    - Remove completely empty columns
    - Remove duplicate rows
    - Fill missing values
    - Do NOT modify outliers unless explicitly enabled
    """

    original_rows = len(df)
    original_columns = len(df.columns)

    cleaned = df.copy()

    cleaning_actions = []

    # -----------------------------------------------------
    # Empty columns
    # -----------------------------------------------------

    empty_columns = detect_empty_columns(
        cleaned
    )

    if empty_columns:

        cleaned = remove_empty_columns(
            cleaned
        )

        cleaning_actions.append({
            "action": "remove_empty_columns",
            "count": len(empty_columns),
            "columns": empty_columns
        })

    # -----------------------------------------------------
    # Duplicates
    # -----------------------------------------------------

    duplicate_count = int(
        cleaned.duplicated().sum()
    )

    if (
        remove_duplicate_rows
        and duplicate_count > 0
    ):

        cleaned = remove_duplicates(
            cleaned
        )

        cleaning_actions.append({
            "action": "remove_duplicates",
            "count": duplicate_count
        })

    # -----------------------------------------------------
    # Missing values
    # -----------------------------------------------------

    missing_before = int(
        cleaned.isna().sum().sum()
    )

    if handle_missing and missing_before > 0:

        cleaned = fill_missing_values(
            cleaned,
            method="auto"
        )

        missing_after = int(
            cleaned.isna().sum().sum()
        )

        cleaning_actions.append({
            "action": "handle_missing_values",
            "before": missing_before,
            "after": missing_after
        })

    # -----------------------------------------------------
    # Outliers
    # -----------------------------------------------------

    outlier_summary = detect_iqr_outliers(
        cleaned
    )

    total_outliers = sum(
        item["outlier_count"]
        for item in outlier_summary.values()
    )

    if handle_outliers and total_outliers > 0:

        if outlier_method == "cap":

            cleaned = cap_iqr_outliers(
                cleaned
            )

            cleaning_actions.append({
                "action": "cap_outliers",
                "method": "IQR"
            })

    # -----------------------------------------------------
    # Final summary
    # -----------------------------------------------------

    final_missing = int(
        cleaned.isna().sum().sum()
    )

    final_duplicates = int(
        cleaned.duplicated().sum()
    )

    summary = {
        "original_rows": original_rows,
        "original_columns": original_columns,
        "final_rows": int(cleaned.shape[0]),
        "final_columns": int(cleaned.shape[1]),
        "missing_before": missing_before,
        "missing_after": final_missing,
        "duplicates_before": duplicate_count,
        "duplicates_after": final_duplicates,
        "total_iqr_outliers": int(
            total_outliers
        ),
        "actions": cleaning_actions
    }

    return cleaned, summary