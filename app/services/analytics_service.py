import pandas as pd
import numpy as np


# =========================================================
# EXCEL AI AUTOMATION
# ADVANCED ANALYTICS SERVICE
# Step 8.9.1
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


# =========================================================
# NUMERIC COLUMN DETECTION
# =========================================================

def get_numeric_columns(df):
    """
    Return numeric columns from dataframe.
    """

    if df is None or df.empty:
        return []

    return df.select_dtypes(
        include=np.number
    ).columns.tolist()


# =========================================================
# BASIC STATISTICS
# =========================================================

def generate_statistics(df):
    """
    Generate statistical summary for numeric columns.
    """

    statistics = []

    numeric_columns = get_numeric_columns(df)

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        statistics.append({
            "column": str(column),
            "count": int(series.count()),
            "mean": round(float(series.mean()), 4),
            "median": round(float(series.median()), 4),
            "minimum": round(float(series.min()), 4),
            "maximum": round(float(series.max()), 4),
            "standard_deviation": round(
                float(series.std()),
                4
            ) if len(series) > 1 else 0,
            "variance": round(
                float(series.var()),
                4
            ) if len(series) > 1 else 0
        })

    return statistics


# =========================================================
# CORRELATION ANALYSIS
# =========================================================

def generate_correlation_analysis(df):
    """
    Detect strong positive and negative correlations.
    """

    numeric_columns = get_numeric_columns(df)

    if len(numeric_columns) < 2:
        return {
            "available": False,
            "message": (
                "At least two numeric columns "
                "are required for correlation analysis."
            ),
            "matrix": {},
            "strong_relationships": []
        }

    numeric_df = df[numeric_columns].apply(
        pd.to_numeric,
        errors="coerce"
    )

    correlation_matrix = numeric_df.corr()

    matrix = {}

    for column in correlation_matrix.columns:

        matrix[str(column)] = {}

        for other_column in correlation_matrix.columns:

            value = correlation_matrix.loc[
                column,
                other_column
            ]

            if pd.isna(value):
                matrix[str(column)][
                    str(other_column)
                ] = None

            else:
                matrix[str(column)][
                    str(other_column)
                ] = round(
                    float(value),
                    4
                )

    # -----------------------------------------------------
    # Strong relationships
    # -----------------------------------------------------

    relationships = []

    columns = correlation_matrix.columns.tolist()

    for i in range(len(columns)):

        for j in range(i + 1, len(columns)):

            column_a = columns[i]
            column_b = columns[j]

            value = correlation_matrix.loc[
                column_a,
                column_b
            ]

            if pd.isna(value):
                continue

            correlation = float(value)

            if abs(correlation) >= 0.7:

                if correlation >= 0:
                    relationship_type = "Strong Positive"
                else:
                    relationship_type = "Strong Negative"

                relationships.append({
                    "column_1": str(column_a),
                    "column_2": str(column_b),
                    "correlation": round(
                        correlation,
                        4
                    ),
                    "type": relationship_type
                })

    relationships.sort(
        key=lambda item: abs(
            item["correlation"]
        ),
        reverse=True
    )

    return {
        "available": True,
        "matrix": matrix,
        "strong_relationships": relationships
    }


# =========================================================
# OUTLIER DETECTION
# =========================================================

def detect_outliers(df):
    """
    Detect outliers using the IQR method.
    """

    outliers = []

    numeric_columns = get_numeric_columns(df)

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if len(series) < 4:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        if iqr == 0:
            continue

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        mask = (
            (series < lower_bound)
            |
            (series > upper_bound)
        )

        outlier_count = int(mask.sum())

        if outlier_count > 0:

            percentage = (
                outlier_count
                / len(series)
            ) * 100

            outliers.append({
                "column": str(column),
                "outlier_count": outlier_count,
                "outlier_percentage": round(
                    percentage,
                    2
                ),
                "lower_bound": round(
                    float(lower_bound),
                    4
                ),
                "upper_bound": round(
                    float(upper_bound),
                    4
                )
            })

    outliers.sort(
        key=lambda item: item["outlier_count"],
        reverse=True
    )

    return {
        "total_columns_with_outliers": len(
            outliers
        ),
        "columns": outliers
    }


# =========================================================
# TREND DETECTION
# =========================================================

def detect_trends(df):
    """
    Detect simple directional trends in numeric columns.

    Uses row order as the observation sequence when
    no explicit date/time handling is required.
    """

    trends = []

    numeric_columns = get_numeric_columns(df)

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if len(series) < 5:
            continue

        values = series.to_numpy(
            dtype=float
        )

        x = np.arange(
            len(values)
        )

        try:

            slope = np.polyfit(
                x,
                values,
                1
            )[0]

        except Exception:

            continue

        mean_value = float(
            np.mean(values)
        )

        if mean_value == 0:
            continue

        relative_slope = (
            slope / abs(mean_value)
        ) * 100

        if relative_slope > 0.05:
            direction = "Increasing"

        elif relative_slope < -0.05:
            direction = "Decreasing"

        else:
            direction = "Stable"

        first_value = float(
            values[0]
        )

        last_value = float(
            values[-1]
        )

        change_percentage = 0

        if first_value != 0:

            change_percentage = (
                (last_value - first_value)
                / abs(first_value)
            ) * 100

        trends.append({
            "column": str(column),
            "direction": direction,
            "slope": round(
                float(slope),
                6
            ),
            "change_percentage": round(
                float(change_percentage),
                2
            ),
            "first_value": round(
                first_value,
                4
            ),
            "last_value": round(
                last_value,
                4
            )
        })

    return trends


# =========================================================
# DISTRIBUTION ANALYSIS
# =========================================================

def generate_distribution_analysis(df):
    """
    Classify numeric columns based on mean vs median.
    """

    distributions = []

    numeric_columns = get_numeric_columns(df)

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        mean_value = float(
            series.mean()
        )

        median_value = float(
            series.median()
        )

        if mean_value > median_value * 1.05:
            distribution = "Right Skewed"

        elif mean_value < median_value * 0.95:
            distribution = "Left Skewed"

        else:
            distribution = "Approximately Symmetric"

        distributions.append({
            "column": str(column),
            "mean": round(
                mean_value,
                4
            ),
            "median": round(
                median_value,
                4
            ),
            "distribution": distribution
        })

    return distributions


# =========================================================
# DATASET ANALYTICS SUMMARY
# =========================================================

def generate_analytics_summary(df):

    numeric_columns = get_numeric_columns(df)

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
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "numeric_columns": len(
            numeric_columns
        ),
        "categorical_columns": len(
            categorical_columns
        ),
        "numeric_column_names": [
            str(column)
            for column in numeric_columns
        ],
        "categorical_column_names": [
            str(column)
            for column in categorical_columns
        ]
    }


# =========================================================
# AUTOMATED ANALYTICS INSIGHTS
# =========================================================

def generate_analytics_insights(
    correlation_data,
    outlier_data,
    trend_data,
    distribution_data
):

    insights = []

    # -----------------------------------------------------
    # Correlation insights
    # -----------------------------------------------------

    relationships = correlation_data.get(
        "strong_relationships",
        []
    )

    for relationship in relationships[:5]:

        column_1 = relationship["column_1"]
        column_2 = relationship["column_2"]
        correlation = relationship["correlation"]
        relationship_type = relationship["type"]

        insights.append(
            f"{relationship_type} correlation detected "
            f"between {column_1} and {column_2} "
            f"({correlation:.2f})."
        )

    # -----------------------------------------------------
    # Outlier insights
    # -----------------------------------------------------

    outlier_columns = outlier_data.get(
        "columns",
        []
    )

    for item in outlier_columns[:5]:

        insights.append(
            f"{item['column']} contains "
            f"{item['outlier_count']:,} potential "
            f"outliers "
            f"({item['outlier_percentage']:.2f}% "
            f"of valid observations)."
        )

    # -----------------------------------------------------
    # Trend insights
    # -----------------------------------------------------

    for trend in trend_data[:5]:

        if trend["direction"] == "Stable":
            continue

        insights.append(
            f"{trend['column']} shows a "
            f"{trend['direction'].lower()} pattern "
            f"with an estimated change of "
            f"{trend['change_percentage']:.2f}% "
            f"from first to last observation."
        )

    # -----------------------------------------------------
    # Distribution insights
    # -----------------------------------------------------

    for distribution in distribution_data[:5]:

        if distribution["distribution"] == (
            "Approximately Symmetric"
        ):
            continue

        insights.append(
            f"{distribution['column']} appears "
            f"{distribution['distribution'].lower()}, "
            f"which may indicate uneven value "
            f"distribution."
        )

    return insights


# =========================================================
# ADVANCED ANALYTICS RECOMMENDATIONS
# =========================================================

def generate_analytics_recommendations(
    correlation_data,
    outlier_data,
    trend_data,
    distribution_data
):

    recommendations = []

    # -----------------------------------------------------
    # Correlation
    # -----------------------------------------------------

    relationships = correlation_data.get(
        "strong_relationships",
        []
    )

    if relationships:

        recommendations.append(
            "Investigate strongly correlated variables "
            "to understand potential business drivers "
            "and relationships."
        )

    # -----------------------------------------------------
    # Outliers
    # -----------------------------------------------------

    outlier_columns = outlier_data.get(
        "columns",
        []
    )

    if outlier_columns:

        recommendations.append(
            "Review detected outliers before "
            "building predictive models because "
            "extreme values can influence results."
        )

    # -----------------------------------------------------
    # Trends
    # -----------------------------------------------------

    changing_trends = [
        item
        for item in trend_data
        if item["direction"] != "Stable"
    ]

    if changing_trends:

        recommendations.append(
            "Monitor changing numeric metrics over "
            "time or observation order to identify "
            "growth, decline and unusual movements."
        )

    # -----------------------------------------------------
    # Distribution
    # -----------------------------------------------------

    skewed_columns = [
        item
        for item in distribution_data
        if item["distribution"]
        != "Approximately Symmetric"
    ]

    if skewed_columns:

        recommendations.append(
            "Consider distribution-aware analysis "
            "or transformations for strongly skewed "
            "numeric variables."
        )

    # -----------------------------------------------------
    # Default
    # -----------------------------------------------------

    if not recommendations:

        recommendations.append(
            "Dataset does not show major automated "
            "analytical signals. Explore additional "
            "business-specific metrics and trends."
        )

    return recommendations


# =========================================================
# MAIN ADVANCED ANALYTICS ENGINE
# =========================================================

def generate_advanced_analytics(
    df,
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
    # Summary
    # -----------------------------------------------------

    summary = generate_analytics_summary(
        df
    )

    # -----------------------------------------------------
    # Statistics
    # -----------------------------------------------------

    statistics = generate_statistics(
        df
    )

    # -----------------------------------------------------
    # Correlations
    # -----------------------------------------------------

    correlation_data = (
        generate_correlation_analysis(
            df
        )
    )

    # -----------------------------------------------------
    # Outliers
    # -----------------------------------------------------

    outlier_data = detect_outliers(
        df
    )

    # -----------------------------------------------------
    # Trends
    # -----------------------------------------------------

    trend_data = detect_trends(
        df
    )

    # -----------------------------------------------------
    # Distributions
    # -----------------------------------------------------

    distribution_data = (
        generate_distribution_analysis(
            df
        )
    )

    # -----------------------------------------------------
    # Insights
    # -----------------------------------------------------

    insights = generate_analytics_insights(
        correlation_data,
        outlier_data,
        trend_data,
        distribution_data
    )

    # -----------------------------------------------------
    # Recommendations
    # -----------------------------------------------------

    recommendations = (
        generate_analytics_recommendations(
            correlation_data,
            outlier_data,
            trend_data,
            distribution_data
        )
    )

    return {
        "success": True,

        "filename": filename,

        "summary": summary,

        "statistics": statistics,

        "correlation": correlation_data,

        "outliers": outlier_data,

        "trends": trend_data,

        "distributions": distribution_data,

        "insights": insights[:15],

        "recommendations": recommendations[:10],

        "total_insights": len(insights),

        "total_recommendations": len(
            recommendations
        )
    }