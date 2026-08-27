import os

import pandas as pd

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UploadedFile, User
from app.api.dependencies import get_current_user

from app.services.kpi_service import generate_kpis
from app.services.insights_service import generate_business_insights


router = APIRouter(
    prefix="/api/insights",
    tags=["AI Business Insights"]
)


# =========================================================
# AI BUSINESS INSIGHTS
# =========================================================

@router.get("/{file_id}")
def get_business_insights(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        # -------------------------------------------------
        # FIND USER FILE
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
        # FILE PATH
        # -------------------------------------------------

        filepath = uploaded_file.filepath

        if not filepath:

            raise HTTPException(
                status_code=404,
                detail="File path is missing."
            )

        if not os.path.exists(filepath):

            raise HTTPException(
                status_code=404,
                detail="Dataset file not found on server."
            )

        # -------------------------------------------------
        # READ DATASET
        # -------------------------------------------------

        filepath_lower = filepath.lower()

        if filepath_lower.endswith(".csv"):

            df = pd.read_csv(filepath)

        elif filepath_lower.endswith(
            (".xlsx", ".xls")
        ):

            df = pd.read_excel(filepath)

        else:

            raise HTTPException(
                status_code=400,
                detail="Unsupported file format."
            )

        # -------------------------------------------------
        # EMPTY DATASET CHECK
        # -------------------------------------------------

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Dataset contains no records."
            )

        # -------------------------------------------------
        # GENERATE KPIs
        # -------------------------------------------------

        kpi_data = generate_kpis(df)

        # -------------------------------------------------
        # GENERATE BUSINESS INSIGHTS
        # -------------------------------------------------

        insights = generate_business_insights(
            df=df,
            kpi_data=kpi_data,
            filename=uploaded_file.filename
        )

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return {
            "success": True,
            "file_id": uploaded_file.id,
            "filename": uploaded_file.filename,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "kpis": kpi_data,
            "insights": insights
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "AI Insights Error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate business insights: {str(e)}"
        )