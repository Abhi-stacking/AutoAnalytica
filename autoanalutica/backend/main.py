from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dashboard import create_dashboard
import io
import pandas as pd
import tempfile
import os

from cleaning import clean_dataset
from analysis import analyze_dataset


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="AutoAnalytica",
    description="Automated Data Science & Dashboard Platform",
    version="0.3"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOAD FILE
# =========================================================

def load_file(file_path, extension):

    if extension == ".csv":
        return pd.read_csv(file_path)

    if extension in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)

    raise ValueError("Unsupported file type")


# =========================================================
# UPLOAD API
# =========================================================

@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".csv", ".xlsx", ".xls"]:

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    temp_path = None

    try:

        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        df = load_file(
            temp_path,
            extension
        )

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="The dataset is empty."
            )

        return {
            "filename": file.filename,
            "status": "uploaded",
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "column_names": df.columns.tolist(),
            "message": "Dataset uploaded successfully."
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)


# =========================================================
# CLEAN API
# =========================================================

@app.post("/clean")
async def clean(file: UploadFile = File(...)):

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".csv", ".xlsx", ".xls"]:

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    temp_path = None

    try:

        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        df = load_file(
            temp_path,
            extension
        )

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="The dataset is empty."
            )

        # ---------------------------------------------
        # CLEAN DATA
        # ---------------------------------------------

        cleaned_df, cleaning_summary = clean_dataset(df)

        # ---------------------------------------------
        # PREVIEW
        # ---------------------------------------------

        preview = (
            cleaned_df
            .head(10)
            .where(pd.notna(cleaned_df.head(10)), None)
            .to_dict(orient="records")
        )

        return {
            "filename": file.filename,
            "status": "cleaned",
            "summary": cleaning_summary,
            "preview": preview
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)


@app.post("/download-clean")
async def download_clean(
    file: UploadFile = File(...),
    format: str = "csv"
):

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".csv", ".xlsx", ".xls"]:

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    if format not in ["csv", "xlsx"]:

        raise HTTPException(
            status_code=400,
            detail="Format must be csv or xlsx."
        )

    temp_path = None

    try:

        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        df = load_file(
            temp_path,
            extension
        )

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="The dataset is empty."
            )

        # Clean dataset
        cleaned_df, _ = clean_dataset(df)

        # CSV
        if format == "csv":

            output = io.StringIO()

            cleaned_df.to_csv(
                output,
                index=False
            )

            output.seek(0)

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition":
                        'attachment; filename="AutoAnalytica_Cleaned.csv"'
                }
            )

        # Excel
        output = io.BytesIO()

        cleaned_df.to_excel(
            output,
            index=False,
            engine="openpyxl"
        )

        output.seek(0)

        return StreamingResponse(
            output,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition":
                    'attachment; filename="AutoAnalytica_Cleaned.xlsx"'
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)


# =========================================================
# ANALYZE API
# =========================================================

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".csv", ".xlsx", ".xls"]:

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    temp_path = None

    try:

        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        df = load_file(
            temp_path,
            extension
        )

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="The dataset is empty."
            )

        # ---------------------------------------------
        # ANALYZE DATA
        # ---------------------------------------------

        analysis_result = analyze_dataset(df)

        return {
            "filename": file.filename,
            "status": "analyzed",
            **analysis_result
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)

# =========================================================
# DASHBOARD
# =========================================================

@app.post("/dashboard")
async def dashboard(file: UploadFile = File(...)):

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".csv", ".xlsx", ".xls"]:

        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported."
        )

    temp_path = None

    try:

        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        df = load_file(
            temp_path,
            extension
        )

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="The dataset is empty."
            )

        dashboard_result = create_dashboard(df)

        return {
            "filename": file.filename,
            "status": "dashboard_ready",
            **dashboard_result
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)
# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "app": "AutoAnalytica",
        "version": "0.3",
        "status": "running"
    }