import os
import uuid

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UploadedFile, User
from app.api.dependencies import get_current_user

from app.services.excel_service import (
    is_allowed_file,
    read_dataset,
    get_dataset_profile,
    get_preview
)


router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"]
)


# =========================================================
# BASE / UPLOAD DIRECTORY
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "data",
    "uploads"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# MAX FILE SIZE
# =========================================================

MAX_FILE_SIZE = 10 * 1024 * 1024


# =========================================================
# UPLOAD
# =========================================================

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------------------
    # Validate filename
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )


    # -----------------------------------------------------
    # Validate extension
    # -----------------------------------------------------

    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only .xlsx, .xls and .csv "
                "files are allowed."
            )
        )


    # -----------------------------------------------------
    # Read file
    # -----------------------------------------------------

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )


    # -----------------------------------------------------
    # Size validation
    # -----------------------------------------------------

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10 MB."
        )


    # -----------------------------------------------------
    # Safe filename
    # -----------------------------------------------------

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    safe_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    filepath = os.path.join(
        UPLOAD_DIR,
        safe_filename
    )


    # -----------------------------------------------------
    # Save + process dataset
    # -----------------------------------------------------

    try:

        with open(
            filepath,
            "wb"
        ) as buffer:
            buffer.write(file_content)


        df = read_dataset(
            filepath
        )

        profile = get_dataset_profile(
            df
        )

        preview = get_preview(
            df
        )


    except Exception as e:

        if os.path.exists(filepath):
            os.remove(filepath)

        raise HTTPException(
            status_code=400,
            detail=f"Unable to process file: {str(e)}"
        )


    # -----------------------------------------------------
    # Save database record
    # -----------------------------------------------------

    try:

        uploaded_file = UploadedFile(
            user_id=current_user.id,
            filename=file.filename,
            filepath=filepath,
            rows=profile["rows"],
            columns=profile["columns"]
        )

        db.add(
            uploaded_file
        )

        db.commit()

        db.refresh(
            uploaded_file
        )


        # -------------------------------------------------
        # SUCCESS
        # -------------------------------------------------

        return {
            "success": True,
            "message": "File uploaded successfully.",

            "file": {
                "id": uploaded_file.id,
                "filename": uploaded_file.filename,
                "rows": uploaded_file.rows,
                "columns": uploaded_file.columns
            },

            "profile": profile,

            "preview": preview
        }


    except Exception as e:

        db.rollback()

        if os.path.exists(filepath):
            os.remove(filepath)

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


    finally:

        db.close()