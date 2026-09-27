import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const uploadDataset = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/upload`,
    formData
  );

  return response.data;
};


export const analyzeDataset = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/analyze`,
    formData
  );

  return response.data;
};


export const cleanDataset = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/clean`,
    formData
  );

  return response.data;
};


export const downloadCleanDataset = async (
  file: File,
  format: "csv" | "xlsx"
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/download-clean?format=${format}`,
    formData,
    {
      responseType: "blob",
    }
  );

  const blob = new Blob(
    [response.data],
    {
      type: response.headers["content-type"],
    }
  );

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download =
    format === "csv"
      ? "AutoAnalytica_Cleaned.csv"
      : "AutoAnalytica_Cleaned.xlsx";

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
};


export const cleanDatasetFile = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/download-clean?format=xlsx`,
    formData,
    {
      responseType: "blob",
    }
  );

  return new File(
    [response.data],
    "AutoAnalytica_Cleaned.xlsx",
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );
};


export const getDashboard = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/dashboard`,
    formData
  );

  return response.data;
};