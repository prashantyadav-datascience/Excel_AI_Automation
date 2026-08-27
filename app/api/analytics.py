import os

import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import UploadedFile, User

from app.services.analytics_service import (
    generate_advanced_analytics
)


# =========================================================
# ADVANCED ANALYTICS API
# Step 8.9.2
# =========================================================

router = APIRouter(
    prefix="/api/analytics",
    tags=["Advanced Analytics"]
)


# =========================================================
# GET ADVANCED ANALYTICS
# =========================================================

@router.get("/{file_id}")
def get_advanced_analytics(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        # -------------------------------------------------
        # Find uploaded file
        # -------------------------------------------------

        uploaded_file = (
            db.query(UploadedFile)
            .filter(
                UploadedFile.id == file_id,
                UploadedFile.user_id == current_user.id
            )
            .first()
        )

        if not uploaded_file:

            raise HTTPException(
                status_code=404,
                detail="File not found."
            )

        # -------------------------------------------------
        # Get file path
        # -------------------------------------------------

        file_path = uploaded_file.filepath

        if not file_path:

            raise HTTPException(
                status_code=404,
                detail="File path is not available."
            )

        if not os.path.exists(file_path):

            raise HTTPException(
                status_code=404,
                detail="Dataset file not found on server."
            )

        # -------------------------------------------------
        # Read CSV / Excel
        # -------------------------------------------------

        file_path_lower = file_path.lower()

        if file_path_lower.endswith(".csv"):

            df = pd.read_csv(
                file_path
            )

        elif file_path_lower.endswith(
            (".xlsx", ".xls")
        ):

            df = pd.read_excel(
                file_path
            )

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file format. "
                    "Only CSV and Excel files are supported."
                )
            )

        # -------------------------------------------------
        # Validate dataset
        # -------------------------------------------------

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Dataset contains no records."
            )

        # -------------------------------------------------
        # Generate Advanced Analytics
        # -------------------------------------------------

        analytics = generate_advanced_analytics(
            df=df,
            filename=uploaded_file.filename
        )

        # -------------------------------------------------
        # Add file information
        # -------------------------------------------------

        analytics["file_id"] = uploaded_file.id

        analytics["filename"] = (
            uploaded_file.filename
        )

        return analytics

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Advanced Analytics Error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate advanced analytics: "
                f"{str(e)}"
            )
        )