import os
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.database import SessionLocal
from app.models import UploadedFile

from app.services.excel_service import read_dataset

from app.services.cleaning_service import (
    get_cleaning_summary,
    suggest_missing_value_method,
    detect_duplicates,
    detect_iqr_outliers,
    detect_zscore_outliers,
    detect_data_types,
    detect_empty_columns,
    auto_clean_dataset
)


router = APIRouter(
    prefix="/api/clean",
    tags=["Data Cleaning"]
)


# =========================================================
# BASE DIRECTORIES
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "data",
    "processed"
)

os.makedirs(
    PROCESSED_DIR,
    exist_ok=True
)


# =========================================================
# DATABASE HELPER
# =========================================================

def get_file_by_id(file_id: int):

    db = SessionLocal()

    try:

        uploaded_file = (
            db.query(UploadedFile)
            .filter(
                UploadedFile.id == file_id
            )
            .first()
        )

        return uploaded_file

    finally:

        db.close()


# =========================================================
# DOWNLOAD CLEANED FILE
# IMPORTANT:
# Keep this route BEFORE /{file_id}/profile
# =========================================================

@router.get("/download/{filename}")
def download_cleaned_file(filename: str):

    # Prevent path traversal
    safe_filename = os.path.basename(
        filename
    )

    filepath = os.path.join(
        PROCESSED_DIR,
        safe_filename
    )

    if not os.path.exists(filepath):

        raise HTTPException(
            status_code=404,
            detail="Cleaned file not found."
        )

    return FileResponse(
        path=filepath,
        filename=safe_filename,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )
    )


# =========================================================
# CLEANING PROFILE
# =========================================================

@router.get("/{file_id}/profile")
def cleaning_profile(file_id: int):

    uploaded_file = get_file_by_id(
        file_id
    )

    if not uploaded_file:

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    if not os.path.exists(
        uploaded_file.filepath
    ):

        raise HTTPException(
            status_code=404,
            detail="Uploaded file is missing from storage."
        )

    try:

        # Read dataset
        df = read_dataset(
            uploaded_file.filepath
        )

        # Cleaning summary
        summary = get_cleaning_summary(
            df
        )

        # Missing value suggestions
        missing_suggestions = (
            suggest_missing_value_method(
                df
            )
        )

        # Duplicate detection
        duplicates = detect_duplicates(
            df
        )

        # IQR outliers
        iqr_outliers = detect_iqr_outliers(
            df
        )

        # Z-score outliers
        zscore_outliers = (
            detect_zscore_outliers(
                df
            )
        )

        # Data types
        data_types = detect_data_types(
            df
        )

        # Completely empty columns
        empty_columns = detect_empty_columns(
            df
        )

        return {

            "success": True,

            "file_id": file_id,

            "filename": uploaded_file.filename,

            "summary": summary,

            "missing_value_suggestions": (
                missing_suggestions
            ),

            "duplicates": {

                "count": duplicates["count"],

                "percentage": duplicates["percentage"]

            },

            "iqr_outliers": iqr_outliers,

            "zscore_outliers": zscore_outliers,

            "data_types": data_types,

            "empty_columns": empty_columns

        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unable to analyze dataset: {str(e)}"
            )
        )


# =========================================================
# AUTOMATIC CLEANING
# =========================================================

@router.post("/{file_id}/auto")
def auto_clean(file_id: int):

    uploaded_file = get_file_by_id(
        file_id
    )

    if not uploaded_file:

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    if not os.path.exists(
        uploaded_file.filepath
    ):

        raise HTTPException(
            status_code=404,
            detail="Uploaded file is missing from storage."
        )

    try:

        # Read original dataset
        df = read_dataset(
            uploaded_file.filepath
        )

        # Automatic cleaning
        cleaned_df, summary = (
            auto_clean_dataset(
                df,

                remove_duplicate_rows=True,

                handle_missing=True,

                # Outliers are not automatically removed
                # because removal can destroy valid business data.
                handle_outliers=False
            )
        )

        # Original filename without extension
        original_name = os.path.splitext(
            uploaded_file.filename
        )[0]

        # Generate unique output filename
        output_filename = (
            f"{original_name}_cleaned_"
            f"{uuid.uuid4().hex[:8]}.xlsx"
        )

        output_path = os.path.join(
            PROCESSED_DIR,
            output_filename
        )

        # Save cleaned Excel file
        cleaned_df.to_excel(
            output_path,
            index=False,
            engine="openpyxl"
        )

        return {

            "success": True,

            "message": (
                "Dataset cleaned successfully."
            ),

            "file_id": file_id,

            "original_filename": (
                uploaded_file.filename
            ),

            "processed_filename": (
                output_filename
            ),

            "download_url": (
                f"/api/clean/download/"
                f"{output_filename}"
            ),

            "processed_path": output_path,

            "summary": summary

        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unable to clean dataset: {str(e)}"
            )
        )