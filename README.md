# Excel AI Automation

> AI-Powered Excel & CSV Data Analytics Platform

Excel AI Automation is an end-to-end web-based data analytics platform that transforms raw Excel and CSV files into meaningful business insights.

The platform allows users to upload datasets and automatically perform data cleaning, KPI generation, statistical analysis, anomaly detection, correlation analysis, trend detection, interactive visualization, and AI-powered business insights.

---

## 🚀 Project Overview

Working with raw Excel and CSV data often requires multiple tools for cleaning, analysis, visualization, and reporting.

**Excel AI Automation** brings these capabilities together into a single analytics platform.

Users can upload a dataset and use an interactive dashboard to understand:

- What is happening in the dataset
- Which metrics are important
- Which variables are correlated
- Where anomalies or outliers exist
- What trends are present
- What business insights can be derived
- What actions can potentially be taken

The goal is to reduce repetitive manual data-analysis work and provide a faster path from raw data to actionable insights.

---

## 🎯 Business Problem

Organizations frequently receive data in Excel or CSV format.

Before this data can be used for decision-making, analysts often need to:

1. Inspect the dataset
2. Identify data types
3. Clean missing values
4. Detect duplicate records
5. Analyze numerical variables
6. Calculate KPIs
7. Identify trends
8. Detect outliers
9. Analyze correlations
10. Create visualizations
11. Interpret the results
12. Generate business recommendations

Performing these tasks manually can be time-consuming.

**Excel AI Automation automates many of these repetitive analytics tasks inside a single web application.**

---

# ✨ Key Features

## 📁 Excel & CSV Upload

Upload datasets directly into the platform.

Supported formats:

- `.xlsx`
- `.xls`
- `.csv`

---

## 🧹 Automated Data Cleaning

The platform analyzes uploaded datasets and helps identify common data-quality problems such as:

- Missing values
- Duplicate records
- Invalid values
- Data-type inconsistencies
- Numerical anomalies
- Potential outliers

---

## 📊 Intelligent KPI Generation

The KPI engine automatically analyzes the selected dataset and generates relevant metrics.

Supported KPI categories include:

- Sales
- Customer
- Finance
- General

Users can filter KPIs by category from the dashboard.

---

## 🤖 AI Business Insights

The platform converts analytical results into understandable business insights.

Examples include:

- Important performance patterns
- Significant numerical changes
- Dataset-level observations
- Potential business opportunities
- Potential risks

---

## 💡 Recommendations

Based on detected patterns and analytical results, the system generates actionable recommendations.

The goal is to move beyond:

> "What happened?"

towards:

> "What should we consider doing next?"

---

## 📈 Advanced Analytics

The Advanced Analytics module provides automated statistical analysis including:

- Dataset summary
- Numerical column analysis
- Mean
- Median
- Minimum
- Maximum
- Standard deviation
- Correlation analysis
- Outlier detection
- Trend detection
- Distribution analysis
- Analytical insights
- Recommendations

---

## 🔗 Correlation Analysis

The platform identifies relationships between numerical variables.

This can help users understand whether changes in one variable may be associated with changes in another variable.

---

## 🚨 Outlier Detection

The system analyzes numerical columns to identify potential unusual observations.

Outlier information can help users investigate:

- Data-quality issues
- Unusual transactions
- Exceptional business events
- Potential anomalies

---

## 📉 Trend Detection

The platform analyzes numerical/time-related data to identify potential trends.

The dashboard can show:

- Direction
- Change
- First value
- Last value

---

## 📊 Interactive Data Visualization

The visualization module automatically generates charts based on the uploaded dataset.

Current visualization capabilities include:

- Category Comparison
- Trend Analysis
- Category Distribution
- Correlation Analysis
- Numeric Distribution

Charts are rendered interactively using Chart.js.

---

## 👤 User Authentication

The platform includes user authentication functionality.

Users can:

- Register
- Login
- Access their dashboard
- Manage uploaded datasets
- Logout

---

## 🗄️ Database Integration

The application uses a database-backed architecture for storing application data.

Current database entities include:

- Users
- Uploaded Files
- Analysis Results

SQLAlchemy is used as the database interaction layer.

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │       User           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Web Dashboard      │
                    │ HTML / CSS / JS      │
                    │ Bootstrap / Chart.js  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌─────────────┐  ┌─────────────┐
       │ File       │   │ Analytics   │  │ KPI / AI    │
       │ Processing │   │ Engine      │  │ Insights    │
       └─────┬──────┘   └──────┬──────┘  └──────┬──────┘
             │                 │                │
             └─────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Pandas / NumPy       │
                    │ Statistical Analysis │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Database        │
                    │ SQLite / SQLAlchemy  │
                    └──────────────────────┘



🛠️ Technology Stack
Frontend
HTML5
CSS3
JavaScript
Bootstrap 5
Chart.js
Font Awesome
Bootstrap Icons
Backend
Python
FastAPI
Uvicorn
Jinja2
Data Analytics
Pandas
NumPy
Statistical Analysis
Data Cleaning
Outlier Detection
Correlation Analysis
Trend Analysis
Database
SQLite
SQLAlchemy
Development Tools
Git
GitHub
VS Code / Notepad
Python Virtual Environment
📂 Project Structure
Excel_AI_Automation/
│
├── app/
│   │
│   ├── api/
│   │   ├── analytics.py
│   │   ├── auth.py
│   │   ├── files.py
│   │   ├── insights.py
│   │   ├── kpi.py
│   │   ├── upload.py
│   │   └── visualization.py
│   │
│   ├── services/
│   │   ├── analytics_service.py
│   │   ├── kpi_service.py
│   │   └── ...
│   │
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   │
│   ├── templates/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── ...
│   │
│   ├── models.py
│   ├── database.py
│   └── main.py
│
├── data/
│
├── reports/
│
├── requirements.txt
├── .gitignore
└── README.md

Run Locally

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the application:

uvicorn app.main:app --reload

Open:

http://127.0.0.1:8000
Project Goal

The goal of Excel AI Automation is to make common data-analysis tasks faster and easier by combining data cleaning, analytics, visualization, KPIs, and business insights into one platform.

Future Improvements
Machine Learning predictions
Automated forecasting
Natural language data analysis
PDF report generation
Cloud deployment
PostgreSQL database
Docker support
Author

Prashant Yadav

B.Tech CSE | Data Science & Data Analytics

GitHub:
https://github.com/prashantyadav-datascience

LinkedIn:
https://www.linkedin.com/in/prashant-yadav-05144a334/