import pandas as pd
import numpy as np


# =========================================================
# COLUMN DETECTION
# =========================================================

def normalize_column_name(column_name: str) -> str:
    """
    Convert column name into a normalized format
    for intelligent matching.
    """

    return (
        str(column_name)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


def find_matching_columns(
    df: pd.DataFrame,
    keywords: list[str]
) -> list[str]:
    """
    Find columns whose names contain any of the
    supplied keywords.
    """

    matches = []

    for column in df.columns:

        normalized = normalize_column_name(
            column
        )

        for keyword in keywords:

            if keyword in normalized:

                matches.append(column)

                break

    return matches


# =========================================================
# NUMERIC COLUMNS
# =========================================================

def get_numeric_columns(
    df: pd.DataFrame
) -> list[str]:

    return df.select_dtypes(
        include=np.number
    ).columns.tolist()


# =========================================================
# CATEGORICAL COLUMNS
# =========================================================

def get_categorical_columns(
    df: pd.DataFrame
) -> list[str]:

    return df.select_dtypes(
        include=[
            "object",
            "category",
            "bool"
        ]
    ).columns.tolist()


# =========================================================
# SAFE NUMBER
# =========================================================

def safe_number(value):

    try:

        if pd.isna(value):
            return 0

        return float(value)

    except Exception:

        return 0


# =========================================================
# KPI CREATOR
# =========================================================

def create_kpi(
    name: str,
    value,
    description: str,
    category: str,
    column: str | None = None
) -> dict:

    numeric_value = safe_number(
        value
    )

    if numeric_value.is_integer():

        display_value = int(
            numeric_value
        )

    else:

        display_value = round(
            numeric_value,
            2
        )

    return {
        "name": name,
        "value": display_value,
        "description": description,
        "category": category,
        "column": column
    }


# =========================================================
# TOTAL / AVERAGE / MIN / MAX KPIs
# =========================================================

def generate_numeric_kpis(
    df: pd.DataFrame
) -> list[dict]:

    kpis = []

    numeric_columns = (
        get_numeric_columns(df)
    )

    if not numeric_columns:
        return kpis

    # -----------------------------------------------------
    # Find business-important numeric columns
    # -----------------------------------------------------

    sales_columns = find_matching_columns(
        df,
        [
            "sales",
            "sale",
            "revenue",
            "amount",
            "income",
            "turnover",
            "value",
            "price"
        ]
    )

    profit_columns = find_matching_columns(
        df,
        [
            "profit",
            "earning",
            "net income"
        ]
    )

    expense_columns = find_matching_columns(
        df,
        [
            "expense",
            "cost",
            "spend",
            "expenditure"
        ]
    )

    # -----------------------------------------------------
    # Priority business columns
    # -----------------------------------------------------

    important_columns = []

    for column in (
        sales_columns
        + profit_columns
        + expense_columns
    ):

        if column not in important_columns:
            important_columns.append(
                column
            )

    # If no semantic match, use first useful numeric
    # column instead of creating fake business labels.

    if not important_columns:

        important_columns = numeric_columns[
            :3
        ]

    # -----------------------------------------------------
    # Generate metrics
    # -----------------------------------------------------

    for column in important_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        normalized = normalize_column_name(
            column
        )

        # ---------------------------------------------
        # Sales / Revenue
        # ---------------------------------------------

        if any(
            word in normalized
            for word in [
                "sales",
                "sale",
                "revenue",
                "income",
                "turnover"
            ]
        ):

            kpis.append(
                create_kpi(
                    "Total Sales / Revenue",
                    series.sum(),
                    f"Total value calculated from {column}.",
                    "Sales",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Average Sales / Revenue",
                    series.mean(),
                    f"Average value calculated from {column}.",
                    "Sales",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Maximum Sales / Revenue",
                    series.max(),
                    f"Highest value found in {column}.",
                    "Sales",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Minimum Sales / Revenue",
                    series.min(),
                    f"Lowest value found in {column}.",
                    "Sales",
                    column
                )
            )

        # ---------------------------------------------
        # Profit
        # ---------------------------------------------

        elif "profit" in normalized:

            kpis.append(
                create_kpi(
                    "Total Profit",
                    series.sum(),
                    f"Total profit calculated from {column}.",
                    "Financial",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Average Profit",
                    series.mean(),
                    f"Average profit calculated from {column}.",
                    "Financial",
                    column
                )
            )

        # ---------------------------------------------
        # Expense
        # ---------------------------------------------

        elif any(
            word in normalized
            for word in [
                "expense",
                "cost",
                "spend",
                "expenditure"
            ]
        ):

            kpis.append(
                create_kpi(
                    "Total Expenses",
                    series.sum(),
                    f"Total expenses calculated from {column}.",
                    "Financial",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Average Expenses",
                    series.mean(),
                    f"Average expense calculated from {column}.",
                    "Financial",
                    column
                )
            )

        # ---------------------------------------------
        # Generic numeric column
        # ---------------------------------------------

        else:

            kpis.append(
                create_kpi(
                    f"Total {column}",
                    series.sum(),
                    f"Total of numeric column {column}.",
                    "Numeric",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    f"Average {column}",
                    series.mean(),
                    f"Average of numeric column {column}.",
                    "Numeric",
                    column
                )
            )

    return kpis


# =========================================================
# ROW / RECORD KPIs
# =========================================================

def generate_record_kpis(
    df: pd.DataFrame
) -> list[dict]:

    kpis = []

    total_rows = len(df)

    kpis.append(
        create_kpi(
            "Total Records",
            total_rows,
            "Total number of records in the dataset.",
            "Dataset"
        )
    )

    categorical_columns = (
        get_categorical_columns(df)
    )

    # -----------------------------------------------------
    # Customer detection
    # -----------------------------------------------------

    customer_columns = find_matching_columns(
        df,
        [
            "customer id",
            "customerid",
            "customer",
            "client id",
            "client"
        ]
    )

    if customer_columns:

        column = customer_columns[0]

        unique_customers = (
            df[column]
            .dropna()
            .nunique()
        )

        kpis.append(
            create_kpi(
                "Total Customers",
                unique_customers,
                f"Unique customers identified from {column}.",
                "Customer",
                column
            )
        )

    # -----------------------------------------------------
    # Order detection
    # -----------------------------------------------------

    order_columns = find_matching_columns(
        df,
        [
            "order id",
            "orderid",
            "invoice",
            "invoice id",
            "transaction id",
            "transactionid"
        ]
    )

    if order_columns:

        column = order_columns[0]

        unique_orders = (
            df[column]
            .dropna()
            .nunique()
        )

        kpis.append(
            create_kpi(
                "Total Orders",
                unique_orders,
                f"Unique orders identified from {column}.",
                "Sales",
                column
            )
        )

    # -----------------------------------------------------
    # Category count
    # -----------------------------------------------------

    category_columns = find_matching_columns(
        df,
        [
            "category",
            "product category",
            "segment",
            "department",
            "type"
        ]
    )

    if category_columns:

        column = category_columns[0]

        unique_categories = (
            df[column]
            .dropna()
            .nunique()
        )

        kpis.append(
            create_kpi(
                "Unique Categories",
                unique_categories,
                f"Unique categories identified from {column}.",
                "Category",
                column
            )
        )

    return kpis


# =========================================================
# PROFIT MARGIN
# =========================================================

def generate_profit_margin_kpi(
    df: pd.DataFrame
) -> list[dict]:

    kpis = []

    profit_columns = find_matching_columns(
        df,
        [
            "profit",
            "net profit"
        ]
    )

    revenue_columns = find_matching_columns(
        df,
        [
            "revenue",
            "sales",
            "sale",
            "turnover"
        ]
    )

    if not profit_columns or not revenue_columns:
        return kpis

    profit_column = profit_columns[0]
    revenue_column = revenue_columns[0]

    profit = pd.to_numeric(
        df[profit_column],
        errors="coerce"
    ).sum()

    revenue = pd.to_numeric(
        df[revenue_column],
        errors="coerce"
    ).sum()

    if revenue == 0:
        return kpis

    margin = (
        profit / revenue
    ) * 100

    kpis.append(
        create_kpi(
            "Profit Margin",
            round(margin, 2),
            "Profit as a percentage of total revenue/sales.",
            "Financial",
            profit_column
        )
    )

    return kpis


# =========================================================
# AVERAGE ORDER VALUE
# =========================================================

def generate_average_order_value(
    df: pd.DataFrame
) -> list[dict]:

    kpis = []

    amount_columns = find_matching_columns(
        df,
        [
            "sales",
            "sale",
            "revenue",
            "amount",
            "order value",
            "total amount"
        ]
    )

    order_columns = find_matching_columns(
        df,
        [
            "order id",
            "orderid",
            "invoice",
            "invoice id",
            "transaction id"
        ]
    )

    if not amount_columns or not order_columns:
        return kpis

    amount_column = amount_columns[0]
    order_column = order_columns[0]

    amounts = pd.to_numeric(
        df[amount_column],
        errors="coerce"
    )

    valid = pd.DataFrame({
        "amount": amounts,
        "order": df[order_column]
    }).dropna()

    if valid.empty:
        return kpis

    order_totals = (
        valid
        .groupby("order")["amount"]
        .sum()
    )

    if order_totals.empty:
        return kpis

    average_order_value = (
        order_totals.mean()
    )

    kpis.append(
        create_kpi(
            "Average Order Value",
            average_order_value,
            f"Average order value using {amount_column} grouped by {order_column}.",
            "Sales",
            amount_column
        )
    )

    return kpis


# =========================================================
# MAIN KPI ENGINE
# =========================================================

def generate_kpis(
    df: pd.DataFrame
) -> dict:

    if df is None:
        raise ValueError(
            "Dataset is not available."
        )

    if df.empty:
        raise ValueError(
            "Dataset contains no records."
        )

    kpis = []

    # Dataset KPIs
    kpis.extend(
        generate_record_kpis(df)
    )

    # Numeric KPIs
    kpis.extend(
        generate_numeric_kpis(df)
    )

    # Financial KPIs
    kpis.extend(
        generate_profit_margin_kpi(df)
    )

    # Order KPIs
    kpis.extend(
        generate_average_order_value(df)
    )

    # -----------------------------------------------------
    # Remove duplicate KPI names
    # -----------------------------------------------------

    unique_kpis = []

    existing_names = set()

    for kpi in kpis:

        if kpi["name"] in existing_names:
            continue

        existing_names.add(
            kpi["name"]
        )

        unique_kpis.append(
            kpi
        )

    # -----------------------------------------------------
    # Summary
    # -----------------------------------------------------

    categories = {}

    for kpi in unique_kpis:

        category = kpi["category"]

        if category not in categories:
            categories[category] = 0

        categories[category] += 1

    return {
        "success": True,
        "total_kpis": len(unique_kpis),
        "categories": categories,
        "kpis": unique_kpis
    }