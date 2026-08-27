# ============================================================
# EXCEL AI AUTOMATION
# VISUALIZATION API
# ============================================================

from pathlib import Path

import numpy as np
import pandas as pd

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import UploadedFile


router = APIRouter(
    prefix="/api/visualization",
    tags=["Visualization"]
)


# ============================================================
# Helper: Find uploaded file
# ============================================================

def get_uploaded_file(
    db: Session,
    file_id: int
):
    return (
        db.query(UploadedFile)
        .filter(
            UploadedFile.id == file_id
        )
        .first()
    )


# ============================================================
# Helper: Read Dataset
# ============================================================

def read_dataset(
    file_path: str
):

    path = Path(file_path)

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded dataset file not found."
        )

    try:

        if path.suffix.lower() == ".csv":

            return pd.read_csv(
                file_path
            )

        if path.suffix.lower() in [
            ".xlsx",
            ".xls"
        ]:

            return pd.read_excel(
                file_path
            )

        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to read dataset: "
                f"{str(e)}"
            )
        )


# ============================================================
# Helper: Detect datetime columns
# ============================================================

def detect_datetime_columns(
    df: pd.DataFrame
):

    datetime_columns = []

    if df.empty:
        return datetime_columns

    for column in df.columns:

        try:

            # Avoid treating pure numeric columns such as
            # Sales / Quantity / IDs as dates.
            if pd.api.types.is_numeric_dtype(
                df[column]
            ):
                continue

            converted = pd.to_datetime(
                df[column],
                errors="coerce"
            )

            valid_ratio = (
                converted.notna().sum()
                / len(df)
            )

            if valid_ratio >= 0.60:

                datetime_columns.append(
                    column
                )

        except Exception:
            continue

    return datetime_columns


# ============================================================
# Helper: Select useful numeric column
# ============================================================

def select_numeric_column(
    numeric_columns
):

    if not numeric_columns:
        return None

    preferred = []

    for column in numeric_columns:

        name = str(
            column
        ).lower().strip()

        # Avoid obvious identifier columns
        if (
            name.endswith("id")
            or name == "id"
            or "identifier" in name
        ):
            continue

        preferred.append(
            column
        )

    if preferred:
        return preferred[0]

    return numeric_columns[0]


# ============================================================
# Helper: Select useful categorical column
# ============================================================

def select_categorical_column(
    df: pd.DataFrame,
    categorical_columns
):

    if not categorical_columns:
        return None

    candidates = []

    for column in categorical_columns:

        try:

            unique_count = (
                df[column]
                .nunique(
                    dropna=True
                )
            )

            if 2 <= unique_count <= 30:

                candidates.append(
                    (
                        column,
                        unique_count
                    )
                )

        except Exception:
            continue

    if candidates:

        # Prefer moderate cardinality
        candidates.sort(
            key=lambda x:
                abs(x[1] - 10)
        )

        return candidates[0][0]

    return categorical_columns[0]


# ============================================================
# Chart Recommendations
# ============================================================

def generate_chart_recommendations(
    df: pd.DataFrame
):

    charts = []

    numeric_columns = (
        df.select_dtypes(
            include="number"
        )
        .columns
        .tolist()
    )

    categorical_columns = (
        df.select_dtypes(
            include=[
                "object",
                "category"
            ]
        )
        .columns
        .tolist()
    )

    datetime_columns = (
        detect_datetime_columns(
            df
        )
    )

    numeric_column = (
        select_numeric_column(
            numeric_columns
        )
    )

    categorical_column = (
        select_categorical_column(
            df,
            categorical_columns
        )
    )

    # --------------------------------------------------------
    # Bar Chart
    # --------------------------------------------------------

    if (
        categorical_column
        and numeric_column
    ):

        charts.append({

            "type": "bar",

            "title": (
                f"{numeric_column} by "
                f"{categorical_column}"
            ),

            "x_column":
                categorical_column,

            "y_column":
                numeric_column
        })

    # --------------------------------------------------------
    # Pie / Donut Chart
    # --------------------------------------------------------

    if categorical_column:

        charts.append({

            "type": "pie",

            "title": (
                "Distribution of "
                f"{categorical_column}"
            ),

            "column":
                categorical_column
        })

    # --------------------------------------------------------
    # Line Chart
    # --------------------------------------------------------

    if (
        datetime_columns
        and numeric_column
    ):

        charts.append({

            "type": "line",

            "title": (
                f"{numeric_column} Trend"
            ),

            "x_column":
                datetime_columns[0],

            "y_column":
                numeric_column
        })

    elif numeric_column:

        charts.append({

            "type": "line",

            "title": (
                f"{numeric_column} Trend"
            ),

            "x_column":
                None,

            "y_column":
                numeric_column
        })

    # --------------------------------------------------------
    # Distribution
    # --------------------------------------------------------

    if numeric_column:

        charts.append({

            "type": "distribution",

            "title": (
                "Distribution of "
                f"{numeric_column}"
            ),

            "column":
                numeric_column
        })

    # --------------------------------------------------------
    # Correlation
    # --------------------------------------------------------

    if len(numeric_columns) >= 2:

        charts.append({

            "type": "correlation",

            "title":
                "Numeric Feature Correlation",

            "columns":
                [
                    str(column)
                    for column
                    in numeric_columns
                ]
        })

    return charts


# ============================================================
# Generate Bar Chart Data
# ============================================================

def generate_bar_chart_data(
    df: pd.DataFrame,
    category_column,
    numeric_column
):

    if (
        not category_column
        or not numeric_column
    ):
        return []

    try:

        temp = df[
            [
                category_column,
                numeric_column
            ]
        ].copy()

        temp[numeric_column] = (
            pd.to_numeric(
                temp[numeric_column],
                errors="coerce"
            )
        )

        temp = temp.dropna(
            subset=[
                category_column,
                numeric_column
            ]
        )

        if temp.empty:
            return []

        grouped = (
            temp.groupby(
                category_column,
                as_index=False
            )[numeric_column]
            .sum()
            .sort_values(
                numeric_column,
                ascending=False
            )
            .head(10)
        )

        result = []

        for _, row in grouped.iterrows():

            result.append({

                "label":
                    str(
                        row[
                            category_column
                        ]
                    ),

                "value":
                    float(
                        row[
                            numeric_column
                        ]
                    )
            })

        return result

    except Exception:
        return []


# ============================================================
# Generate Donut Chart Data
# ============================================================

def generate_donut_chart_data(
    df: pd.DataFrame,
    category_column
):

    if not category_column:
        return []

    try:

        counts = (
            df[category_column]
            .fillna("Unknown")
            .astype(str)
            .value_counts()
            .head(10)
        )

        result = []

        for label, value in counts.items():

            result.append({

                "label":
                    str(label),

                "value":
                    int(value)
            })

        return result

    except Exception:
        return []


# ============================================================
# Generate Line Chart Data
# ============================================================

def generate_line_chart_data(
    df: pd.DataFrame,
    datetime_column,
    numeric_column
):

    if not numeric_column:
        return []

    try:

        temp = df.copy()

        temp[numeric_column] = (
            pd.to_numeric(
                temp[numeric_column],
                errors="coerce"
            )
        )

        # ----------------------------------------------------
        # Datetime based trend
        # ----------------------------------------------------

        if datetime_column:

            temp[datetime_column] = (
                pd.to_datetime(
                    temp[datetime_column],
                    errors="coerce"
                )
            )

            temp = temp.dropna(
                subset=[
                    datetime_column,
                    numeric_column
                ]
            )

            if temp.empty:
                return []

            grouped = (
                temp.groupby(
                    temp[
                        datetime_column
                    ].dt.date
                )[numeric_column]
                .sum()
                .sort_index()
            )

            # Keep chart readable
            grouped = grouped.tail(100)

            return [

                {
                    "label":
                        str(date),

                    "value":
                        float(value)
                }

                for date, value
                in grouped.items()
            ]

        # ----------------------------------------------------
        # Numeric sequence fallback
        # ----------------------------------------------------

        temp = temp.dropna(
            subset=[
                numeric_column
            ]
        )

        temp = temp.head(100)

        return [

            {
                "label":
                    str(index + 1),

                "value":
                    float(value)
            }

            for index, value
            in enumerate(
                temp[
                    numeric_column
                ].tolist()
            )
        ]

    except Exception:
        return []


# ============================================================
# Generate Distribution Data
# ============================================================

def generate_distribution_data(
    df: pd.DataFrame,
    numeric_column
):

    if not numeric_column:
        return []

    try:

        values = pd.to_numeric(
            df[numeric_column],
            errors="coerce"
        )

        # Remove NaN and Infinity
        values = values.replace(
            [
                np.inf,
                -np.inf
            ],
            np.nan
        )

        values = values.dropna()

        if values.empty:
            return []

        # ----------------------------------------------------
        # Constant-value dataset
        # ----------------------------------------------------

        if values.nunique() == 1:

            value = float(
                values.iloc[0]
            )

            return [
                {
                    "label":
                        f"{value:g}",

                    "value":
                        int(len(values))
                }
            ]

        # ----------------------------------------------------
        # Create histogram
        # ----------------------------------------------------

        counts, edges = np.histogram(
            values.to_numpy(
                dtype=float
            ),
            bins=10
        )

        result = []

        for i in range(
            len(counts)
        ):

            left = float(
                edges[i]
            )

            right = float(
                edges[i + 1]
            )

            # Clean readable labels
            label = (
                f"{left:.2f} - "
                f"{right:.2f}"
            )

            result.append({

                "label":
                    label,

                "value":
                    int(counts[i])
            })

        return result

    except Exception:
        return []


# ============================================================
# Generate Correlation Data
# ============================================================

def generate_correlation_data(
    df: pd.DataFrame,
    numeric_columns
):

    if len(numeric_columns) < 2:
        return []

    try:

        temp = (
            df[
                numeric_columns
            ]
            .apply(
                pd.to_numeric,
                errors="coerce"
            )
        )

        correlation_matrix = (
            temp.corr()
        )

        relationships = []

        for i in range(
            len(numeric_columns)
        ):

            for j in range(
                i + 1,
                len(numeric_columns)
            ):

                column1 = (
                    numeric_columns[i]
                )

                column2 = (
                    numeric_columns[j]
                )

                value = (
                    correlation_matrix.loc[
                        column1,
                        column2
                    ]
                )

                if pd.isna(value):
                    continue

                relationships.append({

                    "column_1":
                        str(column1),

                    "column_2":
                        str(column2),

                    "correlation":
                        float(value)
                })

        relationships.sort(
            key=lambda x:
                abs(
                    x["correlation"]
                ),
            reverse=True
        )

        return relationships[:20]

    except Exception:
        return []


# ============================================================
# GET VISUALIZATION DATA
# ============================================================

@router.get("/{file_id}")
async def get_visualization_data(
    file_id: int
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find uploaded file
        # ----------------------------------------------------

        uploaded_file = (
            get_uploaded_file(
                db,
                file_id
            )
        )

        if uploaded_file is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"File with ID {file_id} "
                    f"not found."
                )
            )

        # ----------------------------------------------------
        # Find actual file path
        # ----------------------------------------------------

        file_path = getattr(
            uploaded_file,
            "file_path",
            None
        )

        if not file_path:

            file_path = getattr(
                uploaded_file,
                "filepath",
                None
            )

        if not file_path:

            file_path = getattr(
                uploaded_file,
                "path",
                None
            )

        if not file_path:

            raise HTTPException(
                status_code=500,
                detail=(
                    "File path is missing "
                    "in database."
                )
            )

        # ----------------------------------------------------
        # Read dataset
        # ----------------------------------------------------

        df = read_dataset(
            file_path
        )

        # ----------------------------------------------------
        # Detect columns
        # ----------------------------------------------------

        numeric_columns = (
            df.select_dtypes(
                include="number"
            )
            .columns
            .tolist()
        )

        categorical_columns = (
            df.select_dtypes(
                include=[
                    "object",
                    "category"
                ]
            )
            .columns
            .tolist()
        )

        datetime_columns = (
            detect_datetime_columns(
                df
            )
        )

        # ----------------------------------------------------
        # Select useful columns
        # ----------------------------------------------------

        numeric_column = (
            select_numeric_column(
                numeric_columns
            )
        )

        categorical_column = (
            select_categorical_column(
                df,
                categorical_columns
            )
        )

        datetime_column = (
            datetime_columns[0]
            if datetime_columns
            else None
        )

        # ----------------------------------------------------
        # Chart recommendations
        # ----------------------------------------------------

        chart_recommendations = (
            generate_chart_recommendations(
                df
            )
        )

        # ----------------------------------------------------
        # Actual chart data
        # ----------------------------------------------------

        bar_chart = (
            generate_bar_chart_data(
                df,
                categorical_column,
                numeric_column
            )
        )

        donut_chart = (
            generate_donut_chart_data(
                df,
                categorical_column
            )
        )

        line_chart = (
            generate_line_chart_data(
                df,
                datetime_column,
                numeric_column
            )
        )

        distribution = (
            generate_distribution_data(
                df,
                numeric_column
            )
        )

        correlations = (
            generate_correlation_data(
                df,
                numeric_columns
            )
        )

        # ----------------------------------------------------
        # Return complete response
        # ----------------------------------------------------

        return {

            "success": True,

            "file_id":
                file_id,

            "filename":
                getattr(
                    uploaded_file,
                    "filename",
                    "Unknown"
                ),

            "total_rows":
                int(len(df)),

            "total_columns":
                int(len(df.columns)),

            "columns": [
                str(column)
                for column
                in df.columns
            ],

            "numeric_columns": [
                str(column)
                for column
                in numeric_columns
            ],

            "categorical_columns": [
                str(column)
                for column
                in categorical_columns
            ],

            "datetime_columns": [
                str(column)
                for column
                in datetime_columns
            ],

            # ------------------------------------------------
            # Chart recommendations
            # ------------------------------------------------

            "chart_recommendations":
                chart_recommendations,

            # ------------------------------------------------
            # Actual chart data
            # ------------------------------------------------

            "bar_chart":
                bar_chart,

            "line_chart":
                line_chart,

            "donut_chart":
                donut_chart,

            "distribution":
                distribution,

            "correlations":
                correlations,

            # ------------------------------------------------
            # Combined chart payload
            # ------------------------------------------------

            "charts": {

                "bar":
                    bar_chart,

                "line":
                    line_chart,

                "donut":
                    donut_chart,

                "distribution":
                    distribution,

                "correlation":
                    correlations
            }
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Visualization generation "
                "failed: "
                f"{str(e)}"
            )
        )

    finally:

        db.close()