import pandas as pd
import re


# =========================================================
# TYPE DETECTION
# =========================================================

def detect_type(column):

    if column.isna().all():
        return "empty"

    if pd.api.types.is_bool_dtype(column):
        return "boolean"

    if pd.api.types.is_numeric_dtype(column):
        return "numeric"

    if pd.api.types.is_datetime64_any_dtype(column):
        return "date"

    values = (
        column
        .dropna()
        .astype(str)
        .str.strip()
    )

    if values.empty:
        return "empty"

    # Numeric stored as text
    numeric = pd.to_numeric(
        values,
        errors="coerce"
    )

    if numeric.notna().mean() >= 0.80:
        return "numeric_text"

    # Date stored as text
    dates = pd.to_datetime(
        values,
        errors="coerce",
        format="mixed"
    )

    if dates.notna().mean() >= 0.80:
        return "date_text"

    # Categorical
    unique_ratio = (
        column.nunique(dropna=True)
        / max(len(column), 1)
    )

    if unique_ratio < 0.10:
        return "categorical"

    return "text"


# =========================================================
# OUTLIER DETECTION
# =========================================================

def count_outliers(column):

    if not pd.api.types.is_numeric_dtype(column):
        return 0

    values = column.dropna()

    if len(values) < 5:
        return 0

    q1 = values.quantile(0.25)
    q3 = values.quantile(0.75)

    iqr = q3 - q1

    if iqr == 0:
        return 0

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    return int(
        ((values < lower) | (values > upper)).sum()
    )


# =========================================================
# CATEGORY INCONSISTENCY
# =========================================================

def find_inconsistent_categories(column):

    values = (
        column
        .dropna()
        .astype(str)
        .str.strip()
    )

    if values.empty:
        return []

    groups = {}

    for value in values.unique():

        normalized = re.sub(
            r"\s+",
            " ",
            value.lower()
        )

        groups.setdefault(
            normalized,
            []
        ).append(value)

    inconsistent = []

    for normalized, variants in groups.items():

        variants = sorted(
            list(set(variants))
        )

        if len(variants) > 1:

            inconsistent.append({
                "standard_value": normalized,
                "variants": variants
            })

    return inconsistent


# =========================================================
# RECOMMENDATIONS
# =========================================================

def generate_recommendations(df):

    recommendations = []

    # Empty columns
    for column in df.columns:

        if df[column].isna().all():

            recommendations.append({
                "column": column,
                "problem": "Completely empty column",
                "severity": "high",
                "recommendation": "Remove column",
                "reason": "The column contains no usable data."
            })

    # Duplicate rows
    duplicate_count = int(
        df.duplicated().sum()
    )

    if duplicate_count > 0:

        recommendations.append({
            "column": None,
            "problem": "Duplicate rows",
            "severity": "medium",
            "count": duplicate_count,
            "recommendation": "Remove duplicate rows",
            "reason": "Duplicate records may distort analysis."
        })

    # Column analysis
    for column in df.columns:

        series = df[column]

        missing = int(
            series.isna().sum()
        )

        missing_percentage = (
            missing / len(df) * 100
            if len(df)
            else 0
        )

        column_type = detect_type(series)

        # Missing values
        if missing > 0 and column_type != "empty":

            if pd.api.types.is_numeric_dtype(series):

                action = "Fill with median or review manually"

            elif column_type == "numeric_text":

                action = "Convert to numeric, then handle missing values"

            else:

                action = "Fill with mode or 'Unknown'"

            recommendations.append({
                "column": column,
                "problem": "Missing values",
                "severity": (
                    "high"
                    if missing_percentage > 20
                    else "medium"
                ),
                "count": missing,
                "percentage": round(
                    missing_percentage,
                    2
                ),
                "recommendation": action,
                "reason": (
                    f"{missing} values are missing "
                    f"({round(missing_percentage, 2)}%)."
                )
            })

        # Numeric text
        if column_type == "numeric_text":

            recommendations.append({
                "column": column,
                "problem": "Numeric values stored as text",
                "severity": "medium",
                "recommendation": "Convert column to numeric",
                "reason": (
                    "The column appears to contain "
                    "numbers stored as text."
                )
            })

        # Date text
        if column_type == "date_text":

            recommendations.append({
                "column": column,
                "problem": "Date values stored as text",
                "severity": "medium",
                "recommendation": "Convert to standardized date format",
                "reason": (
                    "Date values appear to be stored as text."
                )
            })

        # Inconsistent categories
        inconsistent = find_inconsistent_categories(
            series
        )

        if inconsistent:

            recommendations.append({
                "column": column,
                "problem": "Inconsistent category values",
                "severity": "medium",
                "examples": inconsistent[:10],
                "recommendation": "Standardize category names",
                "reason": (
                    "The same category appears with "
                    "different capitalization or formatting."
                )
            })

        # Outliers
        if pd.api.types.is_numeric_dtype(series):

            outliers = count_outliers(series)

            if outliers > 0:

                recommendations.append({
                    "column": column,
                    "problem": "Potential outliers",
                    "severity": "low",
                    "count": outliers,
                    "recommendation": "Review outliers before removing",
                    "reason": (
                        "Values fall outside the "
                        "IQR-based normal range."
                    )
                })

    return recommendations


# =========================================================
# QUALITY SCORE
# =========================================================

def calculate_quality_score(
    df,
    recommendations
):

    if df.empty:
        return 0

    score = 100

    total_cells = (
        df.shape[0] *
        df.shape[1]
    )

    missing_cells = int(
        df.isna().sum().sum()
    )

    if total_cells > 0:

        missing_ratio = (
            missing_cells /
            total_cells
        )

        score -= missing_ratio * 30

    if len(df) > 0:

        duplicate_ratio = (
            df.duplicated().sum() /
            len(df)
        )

        score -= duplicate_ratio * 25

    empty_columns = sum(
        df[column].isna().all()
        for column in df.columns
    )

    if df.shape[1] > 0:

        empty_ratio = (
            empty_columns /
            df.shape[1]
        )

        score -= empty_ratio * 20

    score -= min(
        len(recommendations) * 1.5,
        20
    )

    return round(
        max(0, score),
        2
    )


# =========================================================
# MAIN ANALYSIS FUNCTION
# =========================================================
def make_json_safe(value):

    if isinstance(value, dict):

        return {
            key: make_json_safe(val)
            for key, val in value.items()
        }

    if isinstance(value, list):

        return [
            make_json_safe(item)
            for item in value
        ]

    if pd.isna(value):

        return None

    if hasattr(value, "item"):

        try:
            return value.item()
        except Exception:
            pass

    return value

def analyze_dataset(df):

    recommendations = generate_recommendations(df)

    quality_score = calculate_quality_score(
        df,
        recommendations
    )

    preview_df = df.head(10).copy()

    # Convert NaN / NaT to None
    preview_df = preview_df.astype(object).where(
        pd.notna(preview_df),
        None
    )

    preview = preview_df.to_dict(
        orient="records"
    )

    return {
        "summary": {
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "quality_score": float(quality_score),
            "duplicates": int(
                df.duplicated().sum()
            ),
            "missing_cells": int(
                df.isna().sum().sum()
            )
        },

        "recommendations": recommendations,

        "preview": preview
    }