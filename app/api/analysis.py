import os

from fastapi import APIRouter, HTTPException

from app.database import SessionLocal
from app.models import UploadedFile

from app.services.excel_service import read_dataset
from app.services.kpi_service import generate_kpis


router = APIRouter(
    prefix="/api/kpis",
    tags=["KPI Analytics"]
)


# =========================================================
# GET KPI DATA
# =========================================================

@router.get("/{file_id}")
def get_kpis(file_id: int):

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Find uploaded file
        # -------------------------------------------------

        uploaded_file = (
            db.query(UploadedFile)
            .filter(
                UploadedFile.id == file_id
            )
            .first()
        )

        if not uploaded_file:

            raise HTTPException(
                status_code=404,
                detail="File not found."
            )

        # -------------------------------------------------
        # Check physical file
        # -------------------------------------------------

        if not os.path.exists(
            uploaded_file.filepath
        ):

            raise HTTPException(
                status_code=404,
                detail="Uploaded file is missing from storage."
            )

        # -------------------------------------------------
        # Read dataset
        # -------------------------------------------------

        try:

            df = read_dataset(
                uploaded_file.filepath
            )

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=f"Unable to read dataset: {str(e)}"
            )

        # -------------------------------------------------
        # Generate KPIs
        # -------------------------------------------------

        try:

            result = generate_kpis(
                df
            )

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=f"Unable to generate KPIs: {str(e)}"
            )

        # -------------------------------------------------
        # Return response
        # -------------------------------------------------

        return {
            "success": True,
            "file_id": file_id,
            "filename": uploaded_file.filename,
            "total_rows": int(df.shape[0]),
            "total_columns": int(df.shape[1]),
            "total_kpis": result.get(
                "total_kpis",
                len(result.get("kpis", []))
            ),
            "categories": result.get(
                "categories",
                {}
            ),
            "kpis": result.get(
                "kpis",
                []
            )
        }

    finally:

        db.close()