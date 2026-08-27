import pandas as pd
import numpy as np


# =========================================================
# COLUMN DETECTION
# =========================================================

def normalize_column_name(column_name: str) -> str:
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

    matches = []

    for column in df.columns:

        normalized = normalize_column_name(column)

        for keyword in keywords:

            if keyword.lower() in normalized:

                matches.append(column)
                break

    return matches


# =========================================================
# NUMERIC / CATEGORICAL COLUMNS
# =========================================================

def get_numeric_columns(
    df: pd.DataFrame
) -> list[str]:

    return df.select_dtypes(
        include=np.number
    ).columns.tolist()


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
            return 0.0

        return float(value)

    except Exception:

        return 0.0


# =========================================================
# KPI CATEGORY NORMALIZATION
# =========================================================

def normalize_kpi_category(
    category: str
) -> str:

    value = str(
        category or ""
    ).strip().lower()

    if value in [
        "sales",
        "sale"
    ]:
        return "Sales"

    if value in [
        "customer",
        "customers",
        "client"
    ]:
        return "Customer"

    if value in [
        "finance",
        "financial",
        "profit",
        "expense"
    ]:
        return "Finance"

    return "General"


# =========================================================
# KPI FORMATTER
# =========================================================

def format_kpi_value(
    value,
    category: str = "General",
    name: str = ""
) -> str:

    numeric_value = safe_number(value)

    name_lower = str(
        name or ""
    ).lower()

    category_lower = str(
        category or ""
    ).lower()

    # Percentage
    percentage_keywords = [
        "margin",
        "rate",
        "percentage",
        "%",
        "growth"
    ]

    if any(
        keyword in name_lower
        for keyword in percentage_keywords
    ):

        return f"{numeric_value:,.2f}%"

    # Currency / Financial
    currency_keywords = [
        "sales",
        "revenue",
        "profit",
        "expense",
        "income",
        "cost",
        "amount",
        "price",
        "value",
        "order value",
        "turnover",
        "market value",
        "market cap"
    ]

    if (
        category_lower == "finance"
        or any(
            keyword in name_lower
            for keyword in currency_keywords
        )
    ):

        if abs(numeric_value) >= 1_000_000_000:
            return (
                f"₹{numeric_value / 1_000_000_000:,.2f}B"
            )

        if abs(numeric_value) >= 1_000_000:
            return (
                f"₹{numeric_value / 1_000_000:,.2f}M"
            )

        if abs(numeric_value) >= 1_000:
            return (
                f"₹{numeric_value / 1_000:,.2f}K"
            )

        return f"₹{numeric_value:,.2f}"

    # General
    if numeric_value.is_integer():

        return f"{int(numeric_value):,}"

    return f"{numeric_value:,.2f}"


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

    numeric_value = safe_number(value)

    normalized_category = (
        normalize_kpi_category(category)
    )

    formatted_value = format_kpi_value(
        numeric_value,
        normalized_category,
        name
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
        "formatted_value": formatted_value,
        "description": description,
        "category": normalized_category,
        "column": column
    }


# =========================================================
# NUMERIC KPI ENGINE
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
    # SALES / REVENUE
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
            "order value",
            "total amount"
        ]
    )

    # -----------------------------------------------------
    # PROFIT
    # -----------------------------------------------------

    profit_columns = find_matching_columns(
        df,
        [
            "profit",
            "earning",
            "net income",
            "net profit"
        ]
    )

    # -----------------------------------------------------
    # EXPENSE
    # -----------------------------------------------------

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
    # FINANCIAL / ASSET PRICE
    # -----------------------------------------------------

    financial_columns = find_matching_columns(
        df,
        [
            "price",
            "stock price",
            "share price",
            "market value",
            "market cap",
            "crypto",
            "btc",
            "eth",
            "ltc",
            "usd",
            "asset value"
        ]
    )

    # -----------------------------------------------------
    # PROCESS IMPORTANT COLUMNS
    # -----------------------------------------------------

    important_columns = []

    for column in (
        sales_columns
        + profit_columns
        + expense_columns
        + financial_columns
    ):

        if column not in important_columns:

            important_columns.append(
                column
            )

    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    if not important_columns:

        important_columns = numeric_columns[:3]

    # -----------------------------------------------------
    # GENERATE KPIs
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

        # =================================================
        # SALES
        # =================================================

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

        # =================================================
        # PROFIT
        # =================================================

        elif "profit" in normalized:

            kpis.append(
                create_kpi(
                    "Total Profit",
                    series.sum(),
                    f"Total profit calculated from {column}.",
                    "Finance",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Average Profit",
                    series.mean(),
                    f"Average profit calculated from {column}.",
                    "Finance",
                    column
                )
            )

        # =================================================
        # EXPENSE
        # =================================================

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
                    "Finance",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    "Average Expenses",
                    series.mean(),
                    f"Average expenses calculated from {column}.",
                    "Finance",
                    column
                )
            )

        # =================================================
        # FINANCIAL / ASSET PRICE
        # =================================================

        elif any(
            word in normalized
            for word in [
                "price",
                "stock",
                "share price",
                "market value",
                "market cap",
                "crypto",
                "btc",
                "eth",
                "ltc",
                "usd",
                "asset value"
            ]
        ):

            kpis.append(
                create_kpi(
                    f"Total {column}",
                    series.sum(),
                    f"Total financial value calculated from {column}.",
                    "Finance",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    f"Average {column}",
                    series.mean(),
                    f"Average financial value calculated from {column}.",
                    "Finance",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    f"Maximum {column}",
                    series.max(),
                    f"Maximum financial value found in {column}.",
                    "Finance",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    f"Minimum {column}",
                    series.min(),
                    f"Minimum financial value found in {column}.",
                    "Finance",
                    column
                )
            )

        # =================================================
        # GENERIC NUMERIC
        # =================================================

        else:

            kpis.append(
                create_kpi(
                    f"Total {column}",
                    series.sum(),
                    f"Total of numeric column {column}.",
                    "General",
                    column
                )
            )

            kpis.append(
                create_kpi(
                    f"Average {column}",
                    series.mean(),
                    f"Average of numeric column {column}.",
                    "General",
                    column
                )
            )

    return kpis


# =========================================================
# RECORD / CUSTOMER / ORDER KPIs
# =========================================================

def generate_record_kpis(
    df: pd.DataFrame
) -> list[dict]:

    kpis = []

    # -----------------------------------------------------
    # TOTAL RECORDS
    # -----------------------------------------------------

    kpis.append(
        create_kpi(
            "Total Records",
            len(df),
            "Total number of records in the dataset.",
            "General"
        )
    )

    # -----------------------------------------------------
    # CUSTOMER
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
    # ORDERS
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
    # CATEGORY
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
                "General",
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
            margin,
            "Profit as a percentage of total revenue/sales.",
            "Finance",
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

    valid = pd.DataFrame(
        {
            "amount": amounts,
            "order": df[order_column]
        }
    ).dropna()

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

    # -----------------------------------------------------
    # RECORD KPIs
    # -----------------------------------------------------

    kpis.extend(
        generate_record_kpis(df)
    )

    # -----------------------------------------------------
    # NUMERIC KPIs
    # -----------------------------------------------------

    kpis.extend(
        generate_numeric_kpis(df)
    )

    # -----------------------------------------------------
    # PROFIT MARGIN
    # -----------------------------------------------------

    kpis.extend(
        generate_profit_margin_kpi(df)
    )

    # -----------------------------------------------------
    # AVERAGE ORDER VALUE
    # -----------------------------------------------------

    kpis.extend(
        generate_average_order_value(df)
    )

    # -----------------------------------------------------
    # REMOVE DUPLICATE KPI NAMES
    # -----------------------------------------------------

    unique_kpis = []

    existing_names = set()

    for kpi in kpis:

        name = kpi["name"]

        if name in existing_names:
            continue

        existing_names.add(name)

        unique_kpis.append(kpi)

    # -----------------------------------------------------
    # CATEGORY SUMMARY
    # -----------------------------------------------------

    categories = {}

    for kpi in unique_kpis:

        category = kpi["category"]

        if category not in categories:

            categories[category] = 0

        categories[category] += 1

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,
        "total_kpis": len(unique_kpis),
        "categories": categories,
        "kpis": unique_kpis
    }