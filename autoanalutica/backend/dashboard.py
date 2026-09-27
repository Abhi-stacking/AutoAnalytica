import pandas as pd
import numpy as np


def safe_value(value):
    if pd.isna(value):
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        return float(value)

    return value


def detect_columns(df):

    numeric_columns = []
    categorical_columns = []
    date_columns = []

    for column in df.columns:

        series = df[column]

        if pd.api.types.is_numeric_dtype(series):
            numeric_columns.append(column)

        elif pd.api.types.is_datetime64_any_dtype(series):
            date_columns.append(column)

        else:
            unique_ratio = (
                series.nunique(dropna=True) /
                max(len(series), 1)
            )

            if unique_ratio < 0.2:
                categorical_columns.append(column)

    return {
        "numeric": numeric_columns,
        "categorical": categorical_columns,
        "date": date_columns
    }


def create_kpis(df):

    numeric_columns = df.select_dtypes(
        include="number"
    ).columns.tolist()

    kpis = {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "numeric_columns": len(numeric_columns)
    }

    return kpis


def create_numeric_summary(df, numeric_columns):

    summary = []

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        summary.append({
            "column": column,
            "min": safe_value(series.min()),
            "max": safe_value(series.max()),
            "mean": safe_value(round(series.mean(), 2)),
            "median": safe_value(round(series.median(), 2))
        })

    return summary


def create_category_summary(
    df,
    categorical_columns
):

    charts = []

    for column in categorical_columns:

        counts = (
            df[column]
            .fillna("Unknown")
            .astype(str)
            .value_counts()
            .head(10)
        )

        data = []

        for category, count in counts.items():

            data.append({
                "category": category,
                "count": int(count)
            })

        charts.append({
            "column": column,
            "data": data
        })

    return charts


def create_insights(df, numeric_columns):

    insights = []

    for column in numeric_columns:

        series = pd.to_numeric(
            df[column],
            errors="coerce"
        ).dropna()

        if series.empty:
            continue

        max_value = series.max()
        min_value = series.min()
        mean_value = series.mean()

        insights.append(
            f"{column} ranges from "
            f"{round(min_value, 2)} to "
            f"{round(max_value, 2)}, "
            f"with an average of "
            f"{round(mean_value, 2)}."
        )

    return insights[:5]


def create_dashboard(df):

    columns = detect_columns(df)

    kpis = create_kpis(df)

    numeric_summary = create_numeric_summary(
        df,
        columns["numeric"]
    )

    category_summary = create_category_summary(
        df,
        columns["categorical"]
    )

    insights = create_insights(
        df,
        columns["numeric"]
    )

    return {
        "kpis": kpis,

        "columns": {
            "numeric": columns["numeric"],
            "categorical": columns["categorical"],
            "date": columns["date"]
        },

        "numeric_summary": numeric_summary,

        "category_summary": category_summary,

        "insights": insights
    }