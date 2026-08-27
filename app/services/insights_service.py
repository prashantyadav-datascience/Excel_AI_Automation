import pandas as pd
import numpy as np


# =========================================================
# EXCEL AI AUTOMATION
# AI BUSINESS INSIGHTS ENGINE
# Step 8.8
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


def get_numeric_series(df, column):

    try:

        return pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

    except Exception:

        return pd.Series(dtype=float)


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
        include=[
            "object",
            "category",
            "bool"
        ]
    ).columns.tolist()

    missing_values = int(
        df.isna().sum().sum()
    )

    duplicate_rows = int(
        df.duplicated().sum()
    )

    total_cells = max(
        rows * columns,
        1
    )

    missing_percentage = (
        missing_values / total_cells
    ) * 100

    duplicate_percentage = (
        duplicate_rows / max(rows, 1)
    ) * 100

    return {

        "rows": rows,

        "columns": columns,

        "numeric_columns": len(
            numeric_columns
        ),

        "categorical_columns": len(
            categorical_columns
        ),

        "missing_values": missing_values,

        "missing_percentage": round(
            missing_percentage,
            2
        ),

        "duplicate_rows": duplicate_rows,

        "duplicate_percentage": round(
            duplicate_percentage,
            2
        ),

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
            "order value",
            "total amount"
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
            "amount",
            "margin"
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
            "market",
            "asset"
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
        domains.append(
            "General Analytics"
        )

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
            kpi.get(
                "name",
                ""
            )
        )

        value = kpi.get(
            "value",
            0
        )

        numeric_value = safe_number(
            value
        )

        name_lower = name.lower()

        if "total records" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} records."
            )

        elif "total customers" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} unique customers."
            )

        elif "total orders" in name_lower:

            insights.append(
                f"Dataset contains "
                f"{int(numeric_value):,} unique orders."
            )

        elif "total sales" in name_lower:

            insights.append(
                f"Total sales/revenue is "
                f"{numeric_value:,.2f}."
            )

        elif "total revenue" in name_lower:

            insights.append(
                f"Total revenue is "
                f"{numeric_value:,.2f}."
            )

        elif "total profit" in name_lower:

            insights.append(
                f"Total profit is "
                f"{numeric_value:,.2f}."
            )

        elif "profit margin" in name_lower:

            insights.append(
                f"Profit margin is "
                f"{numeric_value:,.2f}%."
            )

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

    missing = summary[
        "missing_values"
    ]

    duplicates = summary[
        "duplicate_rows"
    ]

    if missing == 0:

        insights.append(
            "Dataset has no missing values."
        )

    else:

        insights.append(
            f"Dataset contains "
            f"{missing:,} missing values "
            f"({summary['missing_percentage']:.2f}% "
            f"of all cells)."
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
# PRICE / ASSET INSIGHTS
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
            "stock",
            "market value"
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

        series = get_numeric_series(
            df,
            column
        )

        if series.empty:
            continue

        average = series.mean()

        minimum = series.min()

        maximum = series.max()

        insights.append(
            f"{column} has an average value "
            f"of {average:,.2f}, with a range "
            f"from {minimum:,.2f} to "
            f"{maximum:,.2f}."
        )

    return insights


# =========================================================
# PERFORMANCE SCORE
# =========================================================

def calculate_performance_score(
    df,
    summary,
    domains
):

    score = 100

    reasons = []

    # -----------------------------------------------------
    # Missing values penalty
    # -----------------------------------------------------

    missing_percentage = summary[
        "missing_percentage"
    ]

    if missing_percentage > 20:

        score -= 30

        reasons.append(
            "High missing-value ratio"
        )

    elif missing_percentage > 5:

        score -= 15

        reasons.append(
            "Moderate missing-value ratio"
        )

    elif missing_percentage > 0:

        score -= 5

        reasons.append(
            "Some missing values detected"
        )

    # -----------------------------------------------------
    # Duplicate penalty
    # -----------------------------------------------------

    duplicate_percentage = summary[
        "duplicate_percentage"
    ]

    if duplicate_percentage > 10:

        score -= 20

        reasons.append(
            "High duplicate-record ratio"
        )

    elif duplicate_percentage > 2:

        score -= 10

        reasons.append(
            "Duplicate records detected"
        )

    # -----------------------------------------------------
    # Numeric analytics availability
    # -----------------------------------------------------

    if summary[
        "numeric_columns"
    ] == 0:

        score -= 20

        reasons.append(
            "No numeric columns available"
        )

    elif summary[
        "numeric_columns"
    ] >= 3:

        score += 5

    # -----------------------------------------------------
    # Dataset size
    # -----------------------------------------------------

    if summary["rows"] >= 100:

        score += 5

    # -----------------------------------------------------
    # Final score
    # -----------------------------------------------------

    score = max(
        0,
        min(
            100,
            score
        )
    )

    if score >= 85:

        status = "Excellent"

    elif score >= 70:

        status = "Healthy"

    elif score >= 50:

        status = "Needs Attention"

    else:

        status = "High Risk"

    return {

        "score": int(score),

        "status": status,

        "reasons": reasons

    }


# =========================================================
# PERFORMANCE ANALYSIS
# =========================================================

def generate_performance_analysis(
    df,
    summary,
    domains,
    kpis
):

    analysis = []

    numeric_columns = (
        df.select_dtypes(
            include=np.number
        ).columns.tolist()
    )

    # -----------------------------------------------------
    # Dataset scale
    # -----------------------------------------------------

    if summary["rows"] >= 10000:

        analysis.append(
            "Large dataset detected. "
            "The dataset contains enough records "
            "for advanced statistical and predictive analysis."
        )

    elif summary["rows"] >= 1000:

        analysis.append(
            "Medium-sized dataset detected. "
            "The available records provide a useful "
            "base for business analytics."
        )

    else:

        analysis.append(
            "Relatively small dataset detected. "
            "Interpret advanced trends carefully."
        )

    # -----------------------------------------------------
    # Numeric analysis
    # -----------------------------------------------------

    if numeric_columns:

        analysis.append(
            f"{len(numeric_columns)} numeric "
            f"columns are available for quantitative analysis."
        )

    # -----------------------------------------------------
    # Domain-specific analysis
    # -----------------------------------------------------

    if "Sales" in domains:

        analysis.append(
            "Sales-related metrics were detected. "
            "Revenue and sales performance can be monitored "
            "using the available numeric measures."
        )

    if "Customer" in domains:

        analysis.append(
            "Customer-related fields were detected. "
            "Customer-level segmentation and value analysis "
            "can provide additional business insights."
        )

    if "Finance" in domains:

        analysis.append(
            "Financial metrics were detected. "
            "Profit, cost and margin-oriented analysis "
            "can be performed."
        )

    if "Asset / Price" in domains:

        analysis.append(
            "Asset or price metrics were detected. "
            "Price movement, volatility and trend analysis "
            "can be applied."
        )

    if not analysis:

        analysis.append(
            "Dataset is suitable for exploratory "
            "statistical analysis."
        )

    return analysis[:8]


# =========================================================
# TREND DETECTION
# =========================================================

def generate_trend_detection(df):

    trends = []

    numeric_columns = (
        df.select_dtypes(
            include=np.number
        ).columns.tolist()
    )

    for column in numeric_columns[:8]:

        series = get_numeric_series(
            df,
            column
        )

        if len(series) < 10:
            continue

        first_values = series.head(
            max(3, len(series) // 10)
        )

        last_values = series.tail(
            max(3, len(series) // 10)
        )

        first_mean = first_values.mean()

        last_mean = last_values.mean()

        if first_mean == 0:
            continue

        change_percentage = (
            (
                last_mean
                - first_mean
            )
            / abs(first_mean)
        ) * 100

        if change_percentage > 10:

            direction = "Increasing"

        elif change_percentage < -10:

            direction = "Decreasing"

        else:

            direction = "Stable"

        volatility = series.std()

        mean_value = abs(
            series.mean()
        )

        if mean_value != 0:

            volatility_ratio = (
                volatility
                / mean_value
            )

        else:

            volatility_ratio = 0

        if volatility_ratio > 0.5:

            volatility_level = "High"

        elif volatility_ratio > 0.2:

            volatility_level = "Moderate"

        else:

            volatility_level = "Low"

        trends.append({

            "metric": str(column),

            "direction": direction,

            "change_percentage": round(
                change_percentage,
                2
            ),

            "volatility": volatility_level

        })

    return trends


# =========================================================
# RISK / ANOMALY DETECTION
# =========================================================

def generate_risk_analysis(
    df,
    summary
):

    risks = []

    # -----------------------------------------------------
    # Missing data risk
    # -----------------------------------------------------

    missing_percentage = summary[
        "missing_percentage"
    ]

    if missing_percentage > 20:

        risks.append({

            "type": "Data Quality",

            "severity": "High",

            "message": (
                f"{missing_percentage:.2f}% "
                "of dataset cells contain missing values."
            ),

            "recommendation": (
                "Clean or impute missing values "
                "before advanced analytics."
            )

        })

    elif missing_percentage > 5:

        risks.append({

            "type": "Data Quality",

            "severity": "Medium",

            "message": (
                f"{missing_percentage:.2f}% "
                "of dataset cells contain missing values."
            ),

            "recommendation": (
                "Review missing-value patterns "
                "before modeling."
            )

        })

    # -----------------------------------------------------
    # Duplicate risk
    # -----------------------------------------------------

    duplicate_percentage = summary[
        "duplicate_percentage"
    ]

    if duplicate_percentage > 2:

        severity = (
            "High"
            if duplicate_percentage > 10
            else "Medium"
        )

        risks.append({

            "type": "Duplicates",

            "severity": severity,

            "message": (
                f"{duplicate_percentage:.2f}% "
                "of records are duplicates."
            ),

            "recommendation": (
                "Investigate duplicate records "
                "and remove invalid duplicates."
            )

        })

    # -----------------------------------------------------
    # Numeric anomaly detection
    # -----------------------------------------------------

    numeric_columns = (
        df.select_dtypes(
            include=np.number
        ).columns.tolist()
    )

    for column in numeric_columns[:8]:

        series = get_numeric_series(
            df,
            column
        )

        if len(series) < 10:
            continue

        q1 = series.quantile(
            0.25
        )

        q3 = series.quantile(
            0.75
        )

        iqr = q3 - q1

        if iqr == 0:
            continue

        lower_bound = (
            q1 - 1.5 * iqr
        )

        upper_bound = (
            q3 + 1.5 * iqr
        )

        outliers = series[
            (series < lower_bound)
            |
            (series > upper_bound)
        ]

        outlier_percentage = (
            len(outliers)
            / len(series)
        ) * 100

        if outlier_percentage >= 5:

            severity = (
                "High"
                if outlier_percentage >= 10
                else "Medium"
            )

            risks.append({

                "type": "Anomaly",

                "severity": severity,

                "message": (
                    f"{column} contains "
                    f"{len(outliers):,} potential "
                    f"outliers ({outlier_percentage:.2f}%)."
                ),

                "recommendation": (
                    f"Review unusual values in "
                    f"{column} before using the metric "
                    "for predictive analysis."
                )

            })

    return risks[:10]


# =========================================================
# RECOMMENDATIONS
# =========================================================

def generate_recommendations(
    df,
    summary,
    domains,
    risks,
    trends
):

    recommendations = []

    # -----------------------------------------------------
    # Data quality
    # -----------------------------------------------------

    if summary[
        "missing_values"
    ] > 0:

        recommendations.append(
            "Review and handle missing values "
            "before predictive analytics."
        )

    if summary[
        "duplicate_rows"
    ] > 0:

        recommendations.append(
            "Investigate duplicate records "
            "to improve analytical accuracy."
        )

    # -----------------------------------------------------
    # Trend-based recommendations
    # -----------------------------------------------------

    increasing_trends = [
        trend
        for trend in trends
        if trend["direction"] == "Increasing"
    ]

    decreasing_trends = [
        trend
        for trend in trends
        if trend["direction"] == "Decreasing"
    ]

    if increasing_trends:

        metric = increasing_trends[0][
            "metric"
        ]

        recommendations.append(
            f"Monitor the increasing trend in "
            f"{metric} and identify the business "
            "drivers behind the growth."
        )

    if decreasing_trends:

        metric = decreasing_trends[0][
            "metric"
        ]

        recommendations.append(
            f"Investigate the declining trend in "
            f"{metric} and identify possible "
            "performance drivers."
        )

    # -----------------------------------------------------
    # Risk recommendations
    # -----------------------------------------------------

    if risks:

        recommendations.append(
            "Review the detected data-quality "
            "and anomaly risks before making "
            "high-impact business decisions."
        )

    # -----------------------------------------------------
    # Asset / Price
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
    # General
    # -----------------------------------------------------

    if not recommendations:

        recommendations.append(
            "Explore correlations, distributions "
            "and trends to discover deeper patterns "
            "in the dataset."
        )

    # -----------------------------------------------------
    # Remove duplicates
    # -----------------------------------------------------

    unique_recommendations = []

    for recommendation in recommendations:

        if recommendation not in unique_recommendations:

            unique_recommendations.append(
                recommendation
            )

    return unique_recommendations[:10]


# =========================================================
# BUSINESS SUMMARY
# =========================================================

def generate_business_summary(
    summary,
    domains,
    performance
):

    domain_text = ", ".join(
        domains
    )

    return (
        f"Dataset contains "
        f"{summary['rows']:,} records and "
        f"{summary['columns']} columns. "
        f"Detected analytical domains: "
        f"{domain_text}. "
        f"Overall dataset performance is "
        f"{performance['status'].lower()} "
        f"with a score of "
        f"{performance['score']}/100."
    )


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
    # Domain detection
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
    # KPI insights
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

    # -----------------------------------------------------
    # Remove duplicate insights
    # -----------------------------------------------------

    unique_insights = []

    for insight in insights:

        if insight not in unique_insights:

            unique_insights.append(
                insight
            )

    # -----------------------------------------------------
    # Performance
    # -----------------------------------------------------

    performance = calculate_performance_score(
        df,
        summary,
        domains
    )

    performance_analysis = (
        generate_performance_analysis(
            df,
            summary,
            domains,
            kpis
        )
    )

    # -----------------------------------------------------
    # Trend detection
    # -----------------------------------------------------

    trends = generate_trend_detection(
        df
    )

    # -----------------------------------------------------
    # Risk / anomaly detection
    # -----------------------------------------------------

    risks = generate_risk_analysis(
        df,
        summary
    )

    # -----------------------------------------------------
    # Recommendations
    # -----------------------------------------------------

    recommendations = generate_recommendations(
        df,
        summary,
        domains,
        risks,
        trends
    )

    # -----------------------------------------------------
    # Business summary
    # -----------------------------------------------------

    business_summary = generate_business_summary(
        summary,
        domains,
        performance
    )

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {

        "success": True,

        "filename": filename,

        # -------------------------------------------------
        # Dataset
        # -------------------------------------------------

        "summary": summary,

        "domains": domains,

        # -------------------------------------------------
        # Overall performance
        # -------------------------------------------------

        "performance": {

            "score": performance[
                "score"
            ],

            "status": performance[
                "status"
            ],

            "reasons": performance[
                "reasons"
            ]

        },

        # -------------------------------------------------
        # Business summary
        # -------------------------------------------------

        "business_summary": business_summary,

        # -------------------------------------------------
        # Performance analysis
        # -------------------------------------------------

        "performance_analysis":
            performance_analysis,

        # -------------------------------------------------
        # Trend detection
        # -------------------------------------------------

        "trends": trends,

        # -------------------------------------------------
        # Risk / anomaly detection
        # -------------------------------------------------

        "risks": risks,

        # -------------------------------------------------
        # Existing insights
        # -------------------------------------------------

        "insights":
            unique_insights[:10],

        # -------------------------------------------------
        # Recommendations
        # -------------------------------------------------

        "recommendations":
            recommendations[:10],

        # -------------------------------------------------
        # Counts
        # -------------------------------------------------

        "total_insights":
            len(unique_insights),

        "total_recommendations":
            len(recommendations),

        "total_trends":
            len(trends),

        "total_risks":
            len(risks)

    }