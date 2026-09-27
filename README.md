# AutoAnalytica

> An automated data preprocessing, quality analysis, cleaning, visualization, and insights platform built with FastAPI, Pandas, React, and TypeScript.

## Overview

AutoAnalytica is a full-stack data analysis platform designed to simplify the process of working with messy CSV and Excel datasets.

Instead of manually inspecting a dataset for missing values, duplicates, inconsistent categories, and formatting issues, AutoAnalytica analyzes the uploaded data, identifies potential quality problems, performs cleaning operations, and generates an interactive dashboard.

The project focuses on making the data preparation workflow easier, more transparent, and easier to understand.

## Features

### 📂 Dataset Upload

* Upload CSV, XLSX, and XLS files
* Validate supported file formats
* Process datasets through the web interface

### 🔍 Data Quality Analysis

Automatically detects:

* Missing values
* Duplicate rows
* Completely empty columns
* Numeric values stored as text
* Inconsistent categorical values
* Potential outliers
* Date formatting issues

### 🧹 Automated Cleaning

AutoAnalytica can:

* Remove completely empty columns
* Remove duplicate rows
* Convert numeric text into numeric values
* Standardize categorical values
* Fill missing numeric values using median values
* Fill missing text values using `Unknown`
* Track cleaning operations

### 📊 Interactive Dashboard

The generated dashboard provides:

* Dataset KPIs
* Data-quality score
* Numeric summaries
* Category distributions
* Interactive charts
* Automatic dataset insights

### 📋 Cleaning Activity

The application keeps track of the operations performed during cleaning, making it easier to understand how the dataset was transformed.

### 📥 Export

Cleaned datasets can be exported as:

* CSV
* Excel (`.xlsx`)

## Application Workflow

```text
Upload Dataset
      ↓
Analyze Dataset
      ↓
Detect Data Quality Issues
      ↓
Generate Recommendations
      ↓
Clean Dataset
      ↓
Track Cleaning Operations
      ↓
Generate Dashboard
      ↓
Explore Insights
      ↓
Export Cleaned Dataset
```


## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts
* Lucide React
* Axios

### Backend

* Python
* FastAPI
* Pandas
* NumPy
* Scikit-learn
* OpenPyXL

## Project Structure

```text
AutoAnalytica/
│
├── backend/
│   ├── main.py
│   ├── analysis.py
│   ├── cleaning.py
│   ├── dashboard.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── screenshots/
│   ├── dashboard.png
│   ├── analysis.png
│   ├── cleaning.png
│   └── upload.png
│
├── .gitignore
└── README.md
```

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Abhi-stacking/AutoAnalytica.git
cd AutoAnalytica
```

### 2. Start the Backend

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint          | Purpose                   |
| ------ | ----------------- | ------------------------- |
| POST   | `/upload`         | Validate uploaded dataset |
| POST   | `/analyze`        | Analyze data quality      |
| POST   | `/clean`          | Clean the dataset         |
| POST   | `/download-clean` | Download cleaned dataset  |
| POST   | `/dashboard`      | Generate dashboard data   |
| GET    | `/`               | Backend health check      |

## Data Cleaning Approach

AutoAnalytica follows a simple data-preparation pipeline:

```text
Raw Dataset
    ↓
Type Detection
    ↓
Missing Value Detection
    ↓
Duplicate Detection
    ↓
Category Consistency Check
    ↓
Numeric Validation
    ↓
Cleaning
    ↓
Clean Dataset
```

Cleaning operations are recorded so users can understand what changes were performed.

## Current Limitations

* Ambiguous date formats are not automatically guessed.
* Dashboard insights currently focus mainly on descriptive statistics.
* Large datasets have not yet been extensively optimized for processing.
* Authentication and cloud deployment are not currently included.

## Future Improvements

Planned improvements include:

* Smart date-format detection
* Anomaly detection
* ML-based recommendations
* More advanced statistical insights
* Correlation analysis
* Automatic visualization recommendations
* PostgreSQL integration
* Docker support
* User authentication
* Cloud deployment
* Dataset comparison
* More advanced reporting

## What I Learned

Building AutoAnalytica helped me gain practical experience with:

* Full-stack application development
* REST API development with FastAPI
* Data preprocessing with Pandas
* Data-quality analysis
* React and TypeScript
* Data visualization
* File processing
* API integration
* Designing an end-to-end data workflow

## License

This project is intended for learning, experimentation, and portfolio purposes.
