from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import UploadedFile, User


router = APIRouter(
    prefix="/api/files",
    tags=["Files"]
)


@router.get("")
def get_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return files belonging only to the
    authenticated user.
    """

    files = (
        db.query(UploadedFile)
        .filter(
            UploadedFile.user_id == current_user.id
        )
        .order_by(
            UploadedFile.uploaded_at.desc()
        )
        .all()
    )

    return {
        "success": True,
        "count": len(files),
        "files": [
            {
                "id": item.id,
                "filename": item.filename,
                "rows": item.rows,
                "columns": item.columns,
                "uploaded_at": (
                    item.uploaded_at.isoformat()
                    if item.uploaded_at
                    else None
                ),
            }
            for item in files
        ],
    }


@router.get("/{file_id}")
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return a file only if it belongs
    to the authenticated user.
    """

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

    return {
        "success": True,
        "file": {
            "id": uploaded_file.id,
            "filename": uploaded_file.filename,
            "filepath": uploaded_file.filepath,
            "rows": uploaded_file.rows,
            "columns": uploaded_file.columns,
            "uploaded_at": (
                uploaded_file.uploaded_at.isoformat()
                if uploaded_file.uploaded_at
                else None
            ),
        },
    }


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a file only if it belongs
    to the authenticated user.
    """

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

    filepath = Path(
        uploaded_file.filepath
    )

    if filepath.exists():
        filepath.unlink()

    db.delete(uploaded_file)
    db.commit()

    return {
        "success": True,
        "message": "File deleted successfully."
    }