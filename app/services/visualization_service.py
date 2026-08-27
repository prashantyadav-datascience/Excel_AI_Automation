# =========================================================
# EXCEL AI AUTOMATION
# VISUALIZATION SERVICE
# =========================================================

from pathlib import Path

import pandas as pd
import numpy as np


# =========================================================
# LOAD DATASET
# =========================================================

def load_dataset(filepath: str):

    path = Path(filepath)

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {filepath}"
        )

    suffix = path.suffix.lower()

    if suffix == ".csv":
        return pd.read_csv(path)

    if suffix in [".xlsx", ".xls"]:
        return pd.read_excel(path)

    raise ValueError(
        "Unsupported dataset format. "
        "Only CSV and Excel files are supported."
    )


# =========================================================
# SAFE VALUE CONVERSION
# =========================================================

def safe_value(value):

    if pd.isna(value):
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        return float(value)

    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()

    return value


# =========================================================
# NUMERIC COLUMNS
# =========================================================

def get_numeric_columns(df):

    return df.select_dtypes(
        include=["number"]
    ).columns.tolist()


# =========================================================
# CATEGORICAL COLUMNS
# =========================================================

def get_categorical_columns(df):

    return df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()


# =========================================================
# BAR CHART
# =========================================================

def create_bar_chart(df, categorical_columns, numeric_columns):

    if not categorical_columns or not numeric_columns:
        return None

    category = categorical_columns[0]
    value = numeric_columns[0]

    grouped = (
        df.groupby(category, dropna=False)[value]
        .sum()
        .sort_values(ascending=False)
        .head(10)
    )

    labels = [
        str(x)
        for x in grouped.index.tolist()
    ]

    values = [
        safe_value(x)
        for x in grouped.values.tolist()
    ]

    return {
        "type": "bar",
        "title": f"{value} by {category}",
        "x_axis": category,
        "y_axis": value,
        "labels": labels,
        "values": values
    }


# =========================================================
# LINE CHART
# =========================================================

def create_line_chart(df, numeric_columns):

    if not numeric_columns:
        return None

    column = numeric_columns[0]

    series = (
        pd.to_numeric(
            df[column],
            errors="coerce"
        )
        .dropna()
        .head(50)
    )

    if series.empty:
        return None

    return {
        "type": "line",
        "title": f"{column} Trend",
        "x_axis": "Record",
        "y_axis": column,
        "labels": [
            str(i + 1)
            for i in range(len(series))
        ],
        "values": [
            safe_value(x)
            for x in series.tolist()
        ]
    }


# =========================================================
# PIE / DONUT CHART
# =========================================================

def create_pie_chart(df, categorical_columns):

    if not categorical_columns:
        return None

    column = categorical_columns[0]

    counts = (
        df[column]
        .fillna("Missing")
        .astype(str)
        .value_counts()
        .head(8)
    )

    return {
        "type": "doughnut",
        "title": f"{column} Distribution",
        "labels": counts.index.tolist(),
        "values": [
            int(x)
            for x in counts.values.tolist()
        ]
    }


# =========================================================
# CORRELATION HEATMAP
# =========================================================

def create_correlation_chart(df, numeric_columns):

    if len(numeric_columns) < 2:
        return None

    correlation = (
        df[numeric_columns]
        .corr()
        .fillna(0)
    )

    labels = correlation.columns.tolist()

    values = []

    for row in labels:

        row_values = []

        for col in labels:

            value = correlation.loc[row, col]

            row_values.append(
                round(float(value), 3)
            )

        values.append(row_values)

    return {
        "type": "correlation",
        "title": "Correlation Matrix",
        "labels": labels,
        "values": values
    }


# =========================================================
# DISTRIBUTION
# =========================================================

def create_distribution_chart(df, numeric_columns):

    if not numeric_columns:
        return None

    column = numeric_columns[0]

    series = (
        pd.to_numeric(
            df[column],
            errors="coerce"
        )
        .dropna()
    )

    if series.empty:
        return None

    histogram, bins = np.histogram(
        series,
        bins=min(10, max(3, series.nunique()))
    )

    labels = []

    for i in range(len(bins) - 1):

        labels.append(
            f"{bins[i]:.2f} - {bins[i + 1]:.2f}"
        )

    return {
        "type": "distribution",
        "title": f"{column} Distribution",
        "column": column,
        "labels": labels,
        "values": [
            int(x)
            for x in histogram.tolist()
        ]
    }


# =========================================================
# MAIN VISUALIZATION GENERATOR
# =========================================================

def generate_visualizations(filepath: str):

    df = load_dataset(filepath)

    if df.empty:

        return {
            "success": True,
            "rows": 0,
            "columns": 0,
            "numeric_columns": [],
            "categorical_columns": [],
            "charts": []
        }

    numeric_columns = get_numeric_columns(df)

    categorical_columns = get_categorical_columns(df)

    charts = []


    # -----------------------------------------------------
    # BAR
    # -----------------------------------------------------

    bar_chart = create_bar_chart(
        df,
        categorical_columns,
        numeric_columns
    )

    if bar_chart:
        charts.append(bar_chart)


    # -----------------------------------------------------
    # LINE
    # -----------------------------------------------------

    line_chart = create_line_chart(
        df,
        numeric_columns
    )

    if line_chart:
        charts.append(line_chart)


    # -----------------------------------------------------
    # PIE / DONUT
    # -----------------------------------------------------

    pie_chart = create_pie_chart(
        df,
        categorical_columns
    )

    if pie_chart:
        charts.append(pie_chart)


    # -----------------------------------------------------
    # CORRELATION
    # -----------------------------------------------------

    correlation_chart = create_correlation_chart(
        df,
        numeric_columns
    )

    if correlation_chart:
        charts.append(correlation_chart)


    # -----------------------------------------------------
    # DISTRIBUTION
    # -----------------------------------------------------

    distribution_chart = create_distribution_chart(
        df,
        numeric_columns
    )

    if distribution_chart:
        charts.append(distribution_chart)


    # -----------------------------------------------------
    # RESULT
    # -----------------------------------------------------

    return {
        "success": True,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "charts": charts
    }