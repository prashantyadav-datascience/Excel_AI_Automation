from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = BASE_DIR / "reports"


# ---------------------------------------------------------
# File settings
# ---------------------------------------------------------

MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls"
}


# ---------------------------------------------------------
# Authentication settings
# ---------------------------------------------------------

SECRET_KEY = "excel-ai-automation-change-this-secret-key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ---------------------------------------------------------
# Directory creation
# ---------------------------------------------------------

def create_directories():

    DATA_DIR.mkdir(
        exist_ok=True
    )

    UPLOAD_DIR.mkdir(
        exist_ok=True
    )

    PROCESSED_DIR.mkdir(
        exist_ok=True
    )

    REPORTS_DIR.mkdir(
        exist_ok=True
    )