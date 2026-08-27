import pandas as pd
import numpy as np


# =========================================================
# Excel AI Automation
# AI Business Insights Engine
# Step 8.6
# =========================================================


# =========================================================
# SAFE NUMBER
# =========================================================

def safe_number(value):

    try:

        if pd.isna(value):
            return 0.0

        return float(value)

    except Exception:

        return 0.0


# =========================================================
# NORMALIZE COLUMN NAME
# =========================================================

def normalize_column_name(column):

    return (
        str(column)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


# =========================================================
# FIND COLUMNS
# =========================================================

def find_columns(df, keywords):

    matches = []

    for column in df.columns:

        normalized = normalize_column_name(column)

        for keyword in keywords:

            if keyword in normalized:

                matches.append(column)

                break

    return matches


# =========================================================
# DATASET PROFILE
# =========================================================

def analyze_dataset(df):

    total_rows = len(df)
    total_columns = len(df.columns)

    numeric_columns = (
        df.select_dtypes(
            include=np.number
        ).columns.tolist()
    )

    categorical_columns = (
        df.select_dtypes(
            include=[
                "object",
                "category",
                "bool"
            ]
        ).columns.tolist()
    )

    return {
        "rows": total_rows,
        "columns": total_columns,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns
    }


# =========================================================
# DATASET INSIGHT
# =========================================================

def generate_dataset_insight(df):

    profile = analyze_dataset(df)

    rows = profile["rows"]
    columns = profile["columns"]

    numeric_columns = profile[
        "numeric_columns"
    ]

    categorical_columns = profile[
        "categorical_columns"
    ]

    column_names = [
        str(column)
        for column in df.columns
    ]

    insight = (
        f"Dataset contains {rows:,} records "
        f"across {columns} columns."
    )

    if numeric_columns:

        insight += (
            f" It contains "
            f"{len(numeric_columns)} numeric "
            f"data fields."
        )

    if categorical_columns:

        insight += (
            f" {len(categorical_columns)} "
            f"categorical fields were detected."
        )

    return {
        "type": "dataset",
        "title": "Dataset Overview",
        "insight": insight,
        "columns": column_names
    }


# =========================================================
# SALES INSIGHT
# =========================================================

def generate_sales_insight(df):

    sales_columns = find_columns(
        df,
        [
            "sales",
            "sale",
            "revenue",
            "turnover",
            "income"
        ]
    )

    if not sales_columns:

        return None

    column = sales_columns[0]

    series = pd.to_numeric(
        df[column],
        errors="coerce"
    ).dropna()

    if series.empty:

        return None

    total = series.sum()
    average = series.mean()
    maximum = series.max()

    insight = (
        f"{column} generated a total value of "
        f"{total:,.2f}, with an average of "
        f"{average:,.2f} per record."
    )

    recommendation = (
        f"Monitor {column} regularly and "
        f"compare average performance with "
        f"the maximum observed value."
    )

    return {
        "type": "sales",
        "title": "Sales Performance",
        "insight": insight,
        "recommendation": recommendation,
        "column": column,
        "total": round(total, 2),
        "average": round(average, 2),
        "maximum": round(maximum, 2)
    }


# =========================================================
# CUSTOMER INSIGHT
# =========================================================

def generate_customer_insight(df):

    customer_columns = find_columns(
        df,
        [
            "customer id",
            "customerid",
            "customer",
            "client id",
            "client"
        ]
    )

    if not customer_columns:

        return None

    column = customer_columns[0]

    customers = (
        df[column]
        .dropna()
        .nunique()
    )

    if customers == 0:

        return None

    insight = (
        f"The dataset contains approximately "
        f"{customers:,} unique customers "
        f"identified using {column}."
    )

    recommendation = (
        "Use customer-level segmentation, "
        "purchase frequency and customer value "
        "analysis to identify high-value users."
    )

    return {
        "type": "customer",
        "title": "Customer Analysis",
        "insight": insight,
        "recommendation": recommendation,
        "column": column,
        "unique_customers": customers
    }


# =========================================================
# FINANCE INSIGHT
# =========================================================

def generate_finance_insight(df):

    profit_columns = find_columns(
        df,
        [
            "profit",
            "net profit",
            "earning"
        ]
    )

    expense_columns = find_columns(
        df,
        [
            "expense",
            "cost",
            "spend",
            "expenditure"
        ]
    )

    insights = []

    if profit_columns:

        column = profit_columns[0]

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if not series.empty:

            total_profit = series.sum()

            if total_profit > 0:

                status = "positive"

            elif total_profit < 0:

                status = "negative"

            else:

                status = "neutral"

            insights.append({
                "type": "profit",
                "title": "Profit Analysis",
                "insight": (
                    f"Total profit from {column} "
                    f"is {total_profit:,.2f}. "
                    f"Overall profit status is "
                    f"{status}."
                ),
                "recommendation": (
                    "Track profit trends against "
                    "sales and operating costs to "
                    "identify profitability drivers."
                ),
                "column": column
            })

    if expense_columns:

        column = expense_columns[0]

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if not series.empty:

            total_expense = series.sum()

            insights.append({
                "type": "expense",
                "title": "Expense Analysis",
                "insight": (
                    f"Total expenses from "
                    f"{column} are "
                    f"{total_expense:,.2f}."
                ),
                "recommendation": (
                    "Monitor expense categories "
                    "and identify areas where "
                    "operational costs can be reduced."
                ),
                "column": column
            })

    return insights


# =========================================================
# PRICE / ASSET INSIGHT
# =========================================================

def generate_price_insight(df):

    price_columns = find_columns(
        df,
        [
            "price",
            "stock",
            "share price",
            "market price",
            "btc",
            "eth",
            "ltc",
            "crypto"
        ]
    )

    if not price_columns:

        return []

    insights = []

    for column in price_columns[:5]:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:

            continue

        average = series.mean()
        minimum = series.min()
        maximum = series.max()

        if average == 0:

            continue

        volatility_range = (
            maximum - minimum
        )

        range_percentage = (
            volatility_range /
            abs(average)
        ) * 100

        insight = (
            f"{column} has an average value "
            f"of {average:,.2f}, ranging from "
            f"{minimum:,.2f} to "
            f"{maximum:,.2f}."
        )

        recommendation = (
            f"Analyze the price movement and "
            f"volatility of {column} over time "
            f"before making performance decisions."
        )

        insights.append({
            "type": "price",
            "title": f"{column} Analysis",
            "insight": insight,
            "recommendation": recommendation,
            "column": column,
            "average": round(average, 2),
            "minimum": round(minimum, 2),
            "maximum": round(maximum, 2),
            "range_percentage": round(
                range_percentage,
                2
            )
        })

    return insights


# =========================================================
# MISSING DATA INSIGHT
# =========================================================

def generate_quality_insight(df):

    total_cells = (
        df.shape[0] *
        df.shape[1]
    )

    missing_cells = int(
        df.isna().sum().sum()
    )

    if total_cells == 0:

        return None

    missing_percentage = (
        missing_cells /
        total_cells
    ) * 100

    if missing_cells == 0:

        return {
            "type": "quality",
            "title": "Data Quality",
            "insight": (
                "No missing values were detected "
                "in the current dataset."
            ),
            "recommendation": (
                "Continue monitoring data quality "
                "during future uploads."
            )
        }

    return {
        "type": "quality",
        "title": "Data Quality",
        "insight": (
            f"{missing_cells:,} missing cells "
            f"were detected, representing "
            f"{missing_percentage:.2f}% of all "
            f"dataset values."
        ),
        "recommendation": (
            "Review missing fields before "
            "performing advanced analytics "
            "or predictive modeling."
        )
    }


# =========================================================
# MAIN INSIGHT ENGINE
# =========================================================

def generate_business_insights(df):

    if df is None:

        raise ValueError(
            "Dataset is not available."
        )

    if df.empty:

        raise ValueError(
            "Dataset contains no records."
        )

    insights = []

    # Dataset overview

    dataset_insight = (
        generate_dataset_insight(df)
    )

    insights.append(
        dataset_insight
    )

    # Sales

    sales_insight = (
        generate_sales_insight(df)
    )

    if sales_insight:

        insights.append(
            sales_insight
        )

    # Customer

    customer_insight = (
        generate_customer_insight(df)
    )

    if customer_insight:

        insights.append(
            customer_insight
        )

    # Finance

    finance_insights = (
        generate_finance_insight(df)
    )

    insights.extend(
        finance_insights
    )

    # Price / Asset

    price_insights = (
        generate_price_insight(df)
    )

    insights.extend(
        price_insights
    )

    # Data Quality

    quality_insight = (
        generate_quality_insight(df)
    )

    if quality_insight:

        insights.append(
            quality_insight
        )

    # -----------------------------------------------------
    # Recommendations
    # -----------------------------------------------------

    recommendations = []

    for item in insights:

        recommendation = (
            item.get(
                "recommendation"
            )
        )

        if recommendation:

            recommendations.append(
                recommendation
            )

    return {
        "success": True,
        "total_insights": len(insights),
        "total_recommendations": len(
            recommendations
        ),
        "insights": insights,
        "recommendations": recommendations
    }