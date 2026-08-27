import os
import pandas as pd


ALLOWED_EXTENSIONS = {
    ".xlsx",
    ".xls",
    ".csv"
}


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def is_allowed_file(filename: str) -> bool:
    extension = get_file_extension(filename)
    return extension in ALLOWED_EXTENSIONS


def read_dataset(filepath: str) -> pd.DataFrame:

    extension = get_file_extension(filepath)

    if extension == ".csv":
        df = pd.read_csv(filepath)

    elif extension in [".xlsx", ".xls"]:
        df = pd.read_excel(filepath)

    else:
        raise ValueError(
            "Unsupported file format. Please upload CSV or Excel file."
        )

    if df.empty:
        raise ValueError(
            "The uploaded file is empty."
        )

    # Remove completely empty rows
    df = df.dropna(how="all")

    if df.empty:
        raise ValueError(
            "The uploaded file contains no usable data."
        )

    return df


def get_dataset_profile(df: pd.DataFrame) -> dict:

    numeric_columns = df.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    date_columns = []

    for column in df.columns:

        if pd.api.types.is_datetime64_any_dtype(df[column]):
            date_columns.append(column)

    missing_values = int(df.isna().sum().sum())

    duplicate_rows = int(df.duplicated().sum())

    memory_usage = int(
        df.memory_usage(deep=True).sum()
    )

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "memory_usage": memory_usage,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "date_columns": date_columns,
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "column_names": df.columns.tolist(),
        "data_types": {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }
    }


def get_preview(df: pd.DataFrame, limit: int = 10) -> list:

    preview_df = df.head(limit).copy()

    preview_df = preview_df.astype(object)

    preview_df = preview_df.where(
        pd.notnull(preview_df),
        None
    )

    return preview_df.to_dict(
        orient="records"
    )