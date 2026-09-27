import pandas as pd
import re

def is_text_column(series):
    return (
        series.dtype == "object"
        or str(series.dtype) in ["str", "string"]
    )

# =========================================================
# STANDARDIZE CATEGORIES
# =========================================================

def standardize_categories(df, changes):

    excluded_columns = [
        "Order_ID",
        "Customer_Name",
        "Product",
        "Quantity"
    ]

    for column in df.columns:

        if column in excluded_columns:
            continue

        if not (
            df[column].dtype == "str"
            or df[column].dtype == "string"
            or df[column].dtype == "object"
        ):
            continue

        values = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        if values.empty:
            continue

        # Only standardize low-cardinality text columns
        if values.nunique() > 20:
            continue

        clean_mapping = {}

        for value in values.unique():

            normalized = re.sub(
                r"\s+",
                " ",
                value.lower()
            )

            clean_mapping[value] = normalized.title()

        changed = {
            old: new
            for old, new in clean_mapping.items()
            if old != new
        }

        if changed:

            df[column] = (
                df[column]
                .astype(str)
                .str.strip()
                .replace(clean_mapping)
            )

            changes.append({
                "action": "standardize_categories",
                "column": column,
                "changes": changed,
                "count": len(changed)
            })

    return df

# =========================================================
# DATE PARSER
# =========================================================

def parse_date(value):

    if pd.isna(value):
        return None

    value = str(value).strip()

    # YYYY-MM-DD
    if re.match(
        r"^\d{4}-\d{1,2}-\d{1,2}$",
        value
    ):

        try:
            return pd.to_datetime(
                value,
                format="%Y-%m-%d"
            )
        except:
            return None

    # Split DD/MM/YYYY or MM/DD/YYYY
    match = re.match(
        r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$",
        value
    )

    if not match:
        return None

    first = int(match.group(1))
    second = int(match.group(2))
    year = int(match.group(3))

    # Clearly DD/MM/YYYY
    if first > 12:

        try:
            return pd.Timestamp(
                year,
                second,
                first
            )
        except:
            return None

    # Clearly MM/DD/YYYY
    if second > 12:

        try:
            return pd.Timestamp(
                year,
                first,
                second
            )
        except:
            return None

    # Both <= 12 = ambiguous
    return "AMBIGUOUS"


# =========================================================
# HANDLE DATES
# =========================================================

def clean_dates(df, changes):

    for column in df.columns:

        if not is_text_column(df[column]):
            continue

        values = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        if values.empty:
            continue

        parsed = []
        ambiguous_values = []

        for value in values:

            result = parse_date(value)

            if result == "AMBIGUOUS":

                ambiguous_values.append(value)

            elif result is not None:

                parsed.append(result)

        # Only process columns that actually look like dates
        if len(parsed) / len(values) >= 0.70:

            if ambiguous_values:

                changes.append({
                    "action": "date_conversion_skipped",
                    "column": column,
                    "reason": "Ambiguous date formats detected",
                    "values": list(
                        dict.fromkeys(
                            ambiguous_values
                        )
                    )[:10]
                })

                continue

            converted = []

            for value in df[column]:

                result = parse_date(value)

                if result is None or result == "AMBIGUOUS":
                    converted.append(pd.NaT)
                else:
                    converted.append(result)

            df[column] = pd.to_datetime(
                converted,
                errors="coerce"
            )

            changes.append({
                "action": "convert_to_date",
                "column": column,
                "format": "YYYY-MM-DD"
            })

    return df


# =========================================================
# CLEAN DATASET
# =========================================================

def clean_dataset(df):

    df = df.copy()

    original_rows = len(df)
    original_columns = len(df.columns)

    changes = []

    # -----------------------------------------------------
    # 1. REMOVE EMPTY COLUMNS
    # -----------------------------------------------------

    empty_columns = [
        column
        for column in df.columns
        if df[column].isna().all()
    ]

    if empty_columns:

        df = df.drop(
            columns=empty_columns
        )

        changes.append({
            "action": "remove_empty_columns",
            "columns": empty_columns,
            "count": len(empty_columns)
        })

    # -----------------------------------------------------
    # 2. REMOVE DUPLICATES
    # -----------------------------------------------------

    duplicate_count = int(
        df.duplicated().sum()
    )

    if duplicate_count > 0:

        df = df.drop_duplicates()

        changes.append({
            "action": "remove_duplicates",
            "rows_removed": duplicate_count
        })

    # -----------------------------------------------------
    # 3. CONVERT NUMERIC TEXT
    # -----------------------------------------------------

    for column in df.columns:

        if not is_text_column(df[column]):
            continue

        values = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        if values.empty:
            continue

        numeric_values = pd.to_numeric(
            values,
            errors="coerce"
        )

        valid_ratio = (
            numeric_values.notna().mean()
        )

        if valid_ratio >= 0.80:

            before_invalid = (
                numeric_values.isna().sum()
            )

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            if before_invalid > 0:

                changes.append({
                    "action": "convert_to_numeric",
                    "column": column,
                    "invalid_values": int(
                        before_invalid
                    )
                })

    # -----------------------------------------------------
    # 4. STANDARDIZE CATEGORIES
    # -----------------------------------------------------

    df = standardize_categories(
        df,
        changes
    )

    # -----------------------------------------------------
    # 5. HANDLE DATES
    # -----------------------------------------------------

    df = clean_dates(
        df,
        changes
    )

    # -----------------------------------------------------
    # 6. FILL MISSING NUMERIC VALUES
    # -----------------------------------------------------

    for column in df.columns:

        if pd.api.types.is_numeric_dtype(
            df[column]
        ):

            missing = int(
                df[column].isna().sum()
            )

            if missing > 0:

                median_value = df[column].median()

                df[column] = df[column].fillna(
                    median_value
                )

                changes.append({
                    "action": "fill_missing_numeric",
                    "column": column,
                    "method": "median",
                    "values_filled": missing,
                    "value": (
                        median_value.item()
                        if hasattr(
                            median_value,
                            "item"
                        )
                        else median_value
                    )
                })

    # -----------------------------------------------------
    # 7. FILL MISSING TEXT VALUES
    # -----------------------------------------------------

    for column in df.columns:

        if (
            is_text_column(df[column])
            and df[column].isna().sum() > 0
        ):

            missing = int(
                df[column].isna().sum()
            )

            df[column] = df[column].fillna(
                "Unknown"
            )

            changes.append({
                "action": "fill_missing_text",
                "column": column,
                "method": "Unknown",
                "values_filled": missing
            })

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    cleaning_summary = {

        "original_rows": original_rows,

        "final_rows": len(df),

        "rows_removed": (
            original_rows - len(df)
        ),

        "original_columns": original_columns,

        "final_columns": len(df.columns),

        "columns_removed": (
            original_columns - len(df.columns)
        ),

        "changes": changes
    }

    return df, cleaning_summary