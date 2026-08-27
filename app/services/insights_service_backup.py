import pandas as pd
import numpy as np


# =========================================================
# EXCEL AI AUTOMATION
# AI BUSINESS INSIGHTS SERVICE
# Step 8.7.1
# =========================================================


# =========================================================
# SAFE HELPERS
# =========================================================

def safe_number(value, default=0):
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def normalize_column_name(column):
    return (
        str(column)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


def find_columns(df, keywords):
    matches = []

    for column in df.columns:

        normalized = normalize_column_name(column)

        for keyword in keywords:

            if keyword in normalized:

                if column not in matches:
                    matches.append(column)

                break

    return matches


# =========================================================
# DATASET SUMMARY
# =========================================================

def generate_dataset_summary(df):

    rows = len(df)
    columns = len(df.columns)

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns.tolist()

    categorical_columns = df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    missing_values = int(
        df.isna().sum().sum()
    )

    duplicate_rows = int(
        df.duplicated().sum()
    )

    return {
        "rows": rows,
        "columns": columns,
        "numeric_columns": len(numeric_columns),
        "categorical_columns": len(categorical_columns),
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "column_names": [
            str(column)
            for column in df.columns
        ]
    }


# =========================================================
# DOMAIN DETECTION
# =========================================================

def detect_dataset_domains(df):

    domains = []

    sales_columns = find_columns(
        df,
        [
            "sales",
            "sale",
            "revenue",
            "turnover",
            "order value"
        ]
    )

    customer_columns = find_columns(
        df,
        [
            "customer",
            "client"
        ]
    )

    finance_columns = find_columns(
        df,
        [
            "profit",
            "expense",
            "cost",
            "income",
            "amount"
        ]
    )

    price_columns = find_columns(
        df,
        [
            "price",
            "stock",
            "crypto",
            "btc",
            "eth",
            "ltc",
            "market"
        ]
    )

    order_columns = find_columns(
        df,
        [
            "order",
            "invoice",
            "transaction"
        ]
    )

    if sales_columns:
        domains.append("Sales")

    if customer_columns:
        domains.append("Customer")

    if finance_columns:
        domains.append("Finance")

    if price_columns:
        domains.append("Asset / Price")

    if order_columns:
        domains.append("Orders")

    if not domains:
        domains.append("General Analytics")

    return domains


# =========================================================
# KPI BASED INSIGHTS
# =========================================================

def generate_kpi_insights(kpis):

    insights = []

    if not isinstance(kpis, list):
        return insights

    for kpi in kpis:

        name = str(
            kpi.get("name", "")
        )

        value = kpi.get(
            "value",
            0
        )

        category = str(
            kpi.get(
                "category",
                "General"
            )
        )

        name_lower = name.lower()

        numeric_value = safe_number(
            value
        )

        # -------------------------------------------------
        # Records
        # -------------------------------------------------

        if "total records" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} records."
            )

        # -------------------------------------------------
        # Customers
        # -------------------------------------------------

        elif "total customers" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} unique customers."
            )

        # -------------------------------------------------
        # Orders
        # -------------------------------------------------

        elif "total orders" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} unique orders."
            )

        # -------------------------------------------------
        # Sales
        # -------------------------------------------------

        elif (
            "total sales" in name_lower
            or "total revenue" in name_lower
        ):

            insights.append(
                f"Total sales/revenue is "
                f"{numeric_value:,.2f}."
            )

        # -------------------------------------------------
        # Profit
        # -------------------------------------------------

        elif "total profit" in name_lower:

            insights.append(
                f"Total profit is "
                f"{numeric_value:,.2f}."
            )

        # -------------------------------------------------
        # Profit Margin
        # -------------------------------------------------

        elif "profit margin" in name_lower:

            insights.append(
                f"Profit margin is "
                f"{numeric_value:,.2f}%."
            )

        # -------------------------------------------------
        # Average Order Value
        # -------------------------------------------------

        elif "average order value" in name_lower:

            insights.append(
                f"Average order value is "
                f"{numeric_value:,.2f}."
            )

    return insights


# =========================================================
# DATA QUALITY INSIGHTS
# =========================================================

def generate_data_quality_insights(summary):

    insights = []

    missing = summary["missing_values"]
    duplicates = summary["duplicate_rows"]

    if missing == 0:

        insights.append(
            "Dataset has no missing values."
        )

    else:

        insights.append(
            f"Dataset contains "
            f"{missing:,} missing values that "
            f"should be reviewed before advanced analysis."
        )

    if duplicates == 0:

        insights.append(
            "No duplicate rows were detected."
        )

    else:

        insights.append(
            f"Dataset contains "
            f"{duplicates:,} duplicate rows."
        )

    return insights


# =========================================================
# ASSET / PRICE INSIGHTS
# =========================================================

def generate_price_insights(df):

    insights = []

    price_columns = find_columns(
        df,
        [
            "price",
            "btc",
            "eth",
            "ltc",
            "stock"
        ]
    )

    numeric_price_columns = []

    for column in price_columns:

        if pd.api.types.is_numeric_dtype(
            df[column]
        ):

            numeric_price_columns.append(
                column
            )

    for column in numeric_price_columns[:5]:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        average = series.mean()
        minimum = series.min()
        maximum = series.max()

        insights.append(
            f"{column} has an average value of "
            f"{average:,.2f}, with a range from "
            f"{minimum:,.2f} to {maximum:,.2f}."
        )

    return insights


# =========================================================
# RECOMMENDATIONS
# =========================================================

def generate_recommendations(
    df,
    summary,
    domains
):

    recommendations = []

    # -----------------------------------------------------
    # Missing values
    # -----------------------------------------------------

    if summary["missing_values"] > 0:

        recommendations.append(
            "Review and handle missing values "
            "before predictive analytics."
        )

    # -----------------------------------------------------
    # Duplicate rows
    # -----------------------------------------------------

    if summary["duplicate_rows"] > 0:

        recommendations.append(
            "Remove or investigate duplicate records "
            "to improve analytical accuracy."
        )

    # -----------------------------------------------------
    # Asset / Price data
    # -----------------------------------------------------

    if "Asset / Price" in domains:

        recommendations.append(
            "Use price volatility, trend and "
            "average-price analysis for deeper "
            "asset performance evaluation."
        )

    # -----------------------------------------------------
    # Sales
    # -----------------------------------------------------

    if "Sales" in domains:

        recommendations.append(
            "Analyze sales trends, top-performing "
            "products and revenue contribution "
            "to identify growth opportunities."
        )

    # -----------------------------------------------------
    # Customer
    # -----------------------------------------------------

    if "Customer" in domains:

        recommendations.append(
            "Perform customer segmentation and "
            "customer-value analysis to identify "
            "high-value customers."
        )

    # -----------------------------------------------------
    # Finance
    # -----------------------------------------------------

    if "Finance" in domains:

        recommendations.append(
            "Monitor profit, expenses and margins "
            "to identify financial improvement areas."
        )

    # -----------------------------------------------------
    # General recommendation
    # -----------------------------------------------------

    if not recommendations:

        recommendations.append(
            "Explore correlations, distributions "
            "and trends to discover deeper patterns "
            "in the dataset."
        )

    return recommendations


# =========================================================
# MAIN AI INSIGHTS ENGINE
# =========================================================

def generate_business_insights(
    df,
    kpi_data=None,
    filename=None
):

    if df is None:

        raise ValueError(
            "Dataset is not available."
        )

    if df.empty:

        raise ValueError(
            "Dataset contains no records."
        )

    # -----------------------------------------------------
    # Dataset summary
    # -----------------------------------------------------

    summary = generate_dataset_summary(
        df
    )

    # -----------------------------------------------------
    # Detect domains
    # -----------------------------------------------------

    domains = detect_dataset_domains(
        df
    )

    # -----------------------------------------------------
    # KPI extraction
    # -----------------------------------------------------

    kpis = []

    if isinstance(kpi_data, dict):

        kpis = kpi_data.get(
            "kpis",
            []
        )

    # -----------------------------------------------------
    # Generate insights
    # -----------------------------------------------------

    insights = []

    insights.extend(
        generate_kpi_insights(
            kpis
        )
    )

    insights.extend(
        generate_data_quality_insights(
            summary
        )
    )

    insights.extend(
        generate_price_insights(
            df
        )
    )

    # Remove duplicates
    unique_insights = []

    for insight in insights:

        if insight not in unique_insights:

            unique_insights.append(
                insight
            )

    # -----------------------------------------------------
    # Recommendations
    # -----------------------------------------------------

    recommendations = generate_recommendations(
        df,
        summary,
        domains
    )

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {

        "success": True,

        "filename": filename,

        "summary": summary,

        "domains": domains,

        "insights": unique_insights[:10],

        "recommendations": recommendations[:10],

        "total_insights": len(
            unique_insights
        ),

        "total_recommendations": len(
            recommendations
        )
    }