from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app import models

from app.api.auth import router as auth_router
from app.api.files import router as files_router
from app.api.upload import router as upload_router
from app.api.cleaning import router as cleaning_router
from app.api.analysis import router as analysis_router
from app.api.insights import router as insights_router
from app.api.analytics import router as analytics_router
from app.api.visualization import router as visualization_router

from app.config import create_directories
from app.database import create_tables

from app.services.kpi_service import generate_kpis
from app.services.insights_service import generate_business_insights

# ---------------------------------------------------------
# Application
# ---------------------------------------------------------

app = FastAPI(
    title="Excel AI Automation",
    description=(
        "AI-powered Excel and CSV analytics "
        "automation platform."
    ),
    version="1.0.0"
)


# ---------------------------------------------------------
# Initialization
# ---------------------------------------------------------

create_directories()
create_tables()


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# ---------------------------------------------------------
# Static Files
# ---------------------------------------------------------

app.mount(
    "/static",
    StaticFiles(
        directory=str(BASE_DIR / "static")
    ),
    name="static"
)


# ---------------------------------------------------------
# API Routers
# ---------------------------------------------------------

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(files_router)
app.include_router(cleaning_router)
app.include_router(analysis_router)
app.include_router(insights_router)
app.include_router(analytics_router)
app.include_router(visualization_router)

# ---------------------------------------------------------
# Landing Page
# ---------------------------------------------------------

@app.get("/")
async def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )


# ---------------------------------------------------------
# Login
# ---------------------------------------------------------

@app.get(
    "/login",
    response_class=HTMLResponse
)
async def login_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={
            "title": "Login"
        }
    )


# ---------------------------------------------------------
# Register
# ---------------------------------------------------------

@app.get(
    "/register",
    response_class=HTMLResponse
)
async def register_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={
            "title": "Register"
        }
    )


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.get(
    "/dashboard",
    response_class=HTMLResponse
)
async def dashboard_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "Dashboard"
        }
    )


# ---------------------------------------------------------
# Upload Page
# ---------------------------------------------------------

@app.get(
    "/upload",
    response_class=HTMLResponse
)
async def upload_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="upload.html",
        context={
            "title": "Upload Data"
        }
    )

# ---------------------------------------------------------
# Cleaning Page
# ---------------------------------------------------------

@app.get(
    "/cleaning",
    response_class=HTMLResponse
)
async def cleaning_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="cleaning.html",
        context={
            "title": "Data Cleaning"
        }
    )
# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
async def health_check():

    return {
        "status": "healthy",
        "application": "Excel AI Automation",
        "version": "1.0.0"
    }


# ---------------------------------------------------------
# API Home
# ---------------------------------------------------------

@app.get("/api")
async def api_home():

    return {
        "message": "Excel AI Automation API is running",
        "version": "1.0.0"
    }
