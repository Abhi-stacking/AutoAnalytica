import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Table2,
  Trash2,
  Upload,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

import {
  analyzeDataset,
  cleanDataset,
  cleanDatasetFile,
  downloadCleanDataset,
  getDashboard,
} from "./api";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FileType = File | null;

type Recommendation = {
  column: string | null;
  problem: string;
  severity: string;
  count?: number;
  percentage?: number;
  examples?: {
    standard_value: string;
    variants: string[];
  }[];
  recommendation: string;
  reason: string;
};

type AnalysisResult = {
  filename: string;
  status: string;
  summary: {
    rows: number;
    columns: number;
    quality_score: number;
    duplicates: number;
    missing_cells: number;
  };
  recommendations: Recommendation[];
};

type CleaningChange = {
  action: string;
  column?: string;
  columns?: string[];
  rows_removed?: number;
  values_filled?: number;
  invalid_values?: number;
  method?: string;
  value?: number;
  count?: number;
  reason?: string;
  changes?: Record<string, string>;
};

type CleaningResult = {
  filename: string;
  status: string;
  summary: {
    original_rows: number;
    final_rows: number;
    rows_removed: number;
    original_columns: number;
    final_columns: number;
    columns_removed: number;
    changes: CleaningChange[];
  };
};

type DashboardResult = {
  filename: string;
  status: string;
  kpis: {
    rows: number;
    columns: number;
    missing_cells: number;
    duplicate_rows: number;
    numeric_columns: number;
  };
  columns: {
    numeric: string[];
    categorical: string[];
    date: string[];
  };
  numeric_summary: {
    column: string;
    min: number;
    max: number;
    mean: number;
    median: number;
  }[];
  category_summary: {
    column: string;
    data: {
      category: string;
      count: number;
    }[];
  }[];
  insights: string[];
};

type ActivePage =
  | "dashboard"
  | "analysis"
  | "cleaning"
  | "insights"
  | "export";

const chartColors = [
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#e879f9",
];

function App() {
  const [file, setFile] = useState<FileType>(null);
  const [cleanedFile, setCleanedFile] = useState<FileType>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [cleaningResult, setCleaningResult] =
    useState<CleaningResult | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResult | null>(null);

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  const [dragActive, setDragActive] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [error, setError] = useState("");

  const qualityScore = analysis?.summary.quality_score ?? 0;

  const qualityColor = useMemo(() => {
    if (qualityScore >= 80) return "#22c55e";
    if (qualityScore >= 60) return "#f59e0b";
    return "#f43f5e";
  }, [qualityScore]);

  const handleFile = (selectedFile: File) => {
    const validExtensions = [".csv", ".xlsx", ".xls"];

    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      setError("Please upload a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setCleanedFile(null);
    setAnalysis(null);
    setCleaningResult(null);
    setDashboard(null);
    setError("");
    setActivePage("dashboard");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      setAnalyzing(true);
      setError("");

      const result = await analyzeDataset(file);

      setAnalysis(result);
      setActivePage("analysis");
    } catch (err) {
      console.error(err);
      setError("Failed to analyze dataset.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClean = async () => {
    if (!file) return;

    try {
      setCleaning(true);
      setError("");

      const result = await cleanDataset(file);
      const cleaned = await cleanDatasetFile(file);

      setCleaningResult(result);
      setCleanedFile(cleaned);
      setDashboard(null);
      setActivePage("cleaning");
    } catch (err) {
      console.error(err);
      setError("Failed to clean dataset.");
    } finally {
      setCleaning(false);
    }
  };

  const handleDashboard = async () => {
    if (!cleanedFile) {
      setError("Please clean the dataset first.");
      return;
    }

    try {
      setDashboardLoading(true);
      setError("");

      const result = await getDashboard(cleanedFile);

      setDashboard(result);
      setActivePage("dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to generate dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    if (!file) return;

    try {
      await downloadCleanDataset(file, format);
    } catch (err) {
      console.error(err);
      setError("Failed to download cleaned dataset.");
    }
  };

  const resetProject = () => {
    setFile(null);
    setCleanedFile(null);
    setAnalysis(null);
    setCleaningResult(null);
    setDashboard(null);
    setError("");
    setActivePage("dashboard");
  };

  const navItems = [
    {
      id: "dashboard" as ActivePage,
      label: "Dashboard",
      icon: LayoutDashboard,
      available: !!dashboard,
    },
    {
      id: "analysis" as ActivePage,
      label: "Data Analysis",
      icon: Search,
      available: !!analysis,
    },
    {
      id: "cleaning" as ActivePage,
      label: "Cleaning",
      icon: WandSparkles,
      available: !!cleaningResult,
    },
    {
      id: "insights" as ActivePage,
      label: "Insights",
      icon: Sparkles,
      available: !!dashboard,
    },
    {
      id: "export" as ActivePage,
      label: "Export",
      icon: Download,
      available: !!file,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-slate-800/80 bg-[#07101f] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>

          <div className="ml-3">
            <h1 className="text-lg font-bold tracking-tight">
              AutoAnalytica
            </h1>
            <p className="text-[11px] text-slate-500">
              Intelligent Data Platform
            </p>
          </div>

          <button
            onClick={() => setMobileSidebar(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;

              return (
                <button
                  key={item.id}
                  disabled={!item.available}
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileSidebar(false);
                  }}
                  className={`group flex w-full items-center rounded-xl px-3 py-3 text-sm transition ${
                    active
                      ? "bg-cyan-500/10 text-cyan-300"
                      : item.available
                      ? "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                      : "cursor-not-allowed text-slate-700"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-[18px] w-[18px] ${
                      active ? "text-cyan-400" : ""
                    }`}
                  />

                  <span>{item.label}</span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Dataset
            </p>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                  <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">
                    {file ? file.name : "No dataset"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {file ? "Ready for analysis" : "Upload a file"}
                  </p>
                </div>
              </div>

              {file && (
                <button
                  onClick={resetProject}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Start New Dataset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
              <Settings className="h-4 w-4 text-slate-500" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                AutoAnalytica
              </p>
              <p className="text-[10px] text-slate-600">v1.0 • Local</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/70 bg-[#020617]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebar(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                {activePage === "dashboard" && "Dashboard"}
                {activePage === "analysis" && "Data Analysis"}
                {activePage === "cleaning" && "Data Cleaning"}
                {activePage === "insights" && "Insights"}
                {activePage === "export" && "Export Dataset"}
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Automated data preparation and analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {file && (
              <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-300">
                  Dataset loaded
                </span>
              </div>
            )}

            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 sm:flex">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>

              <button
                onClick={() => setError("")}
                className="ml-auto text-red-400 hover:text-red-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!file ? (
            <UploadScreen
              dragActive={dragActive}
              setDragActive={setDragActive}
              handleDrop={handleDrop}
              handleFile={handleFile}
            />
          ) : (
            <>
              {/* Dataset header */}
              <section className="mb-8">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                      <Database className="h-4 w-4" />
                      <span>Current dataset</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-slate-400">
                        {file.name}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Analyze your data.
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      AutoAnalytica automatically detects data quality
                      problems, cleans your dataset, and generates
                      interactive analytics.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!analysis && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            Analyze Dataset
                          </>
                        )}
                      </button>
                    )}

                    {analysis && !cleanedFile && (
                      <button
                        onClick={handleClean}
                        disabled={cleaning}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cleaning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cleaning...
                          </>
                        ) : (
                          <>
                            <WandSparkles className="h-4 w-4" />
                            Clean Dataset
                          </>
                        )}
                      </button>
                    )}

                    {cleanedFile && !dashboard && (
                      <button
                        onClick={handleDashboard}
                        disabled={dashboardLoading}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {dashboardLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <LayoutDashboard className="h-4 w-4" />
                            Generate Dashboard
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {activePage === "dashboard" && (
                <DashboardPage
                  dashboard={dashboard}
                  analysis={analysis}
                  qualityColor={qualityColor}
                  qualityScore={qualityScore}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                  onDashboard={handleDashboard}
                  dashboardLoading={dashboardLoading}
                  cleanedFile={cleanedFile}
                />
              )}

              {activePage === "analysis" && (
                <AnalysisPage
                  analysis={analysis}
                  qualityColor={qualityColor}
                  qualityScore={qualityScore}
                />
              )}

              {activePage === "cleaning" && (
                <CleaningPage
                  result={cleaningResult}
                  cleanedFile={cleanedFile}
                  onDownload={handleDownload}
                />
              )}

              {activePage === "insights" && (
                <InsightsPage dashboard={dashboard} />
              )}

              {activePage === "export" && (
                <ExportPage
                  file={file}
                  cleanedFile={cleanedFile}
                  onDownload={handleDownload}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------
   Upload Screen
------------------------------------------------------- */

function UploadScreen({
  dragActive,
  setDragActive,
  handleDrop,
  handleFile,
}: {
  dragActive: boolean;
  setDragActive: (value: boolean) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleFile: (file: File) => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-150px)] items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20">
            <Zap className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Turn raw data into
            <span className="ml-2 bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              insights.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Upload a CSV or Excel dataset and let AutoAnalytica detect
            quality issues, clean your data, and generate an interactive
            analytics dashboard.
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition sm:p-16 ${
            dragActive
              ? "border-cyan-400 bg-cyan-500/5"
              : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_55%)]" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
              <Upload className="h-7 w-7 text-cyan-400" />
            </div>

            <h3 className="mt-6 text-lg font-semibold text-white">
              Drop your dataset here
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your computer
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              <FileSpreadsheet className="h-4 w-4" />
              Browse Files
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0];

                  if (selected) {
                    handleFile(selected);
                  }
                }}
              />
            </label>

            <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-slate-600">
              <span>CSV</span>
              <span>•</span>
              <span>XLSX</span>
              <span>•</span>
              <span>XLS</span>
              <span>•</span>
              <span>Local processing</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={Search}
            title="Detect"
            text="Find missing values, duplicates, outliers and inconsistent data."
          />

          <FeatureCard
            icon={WandSparkles}
            title="Clean"
            text="Automatically prepare your dataset for analysis."
          />

          <FeatureCard
            icon={BarChart3}
            title="Analyze"
            text="Generate charts, statistics and automatic insights."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>

      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

/* -------------------------------------------------------
   Dashboard
------------------------------------------------------- */

function DashboardPage({
  dashboard,
  analysis,
  qualityColor,
  qualityScore,
  onAnalyze,
  analyzing,
  onDashboard,
  dashboardLoading,
  cleanedFile,
}: {
  dashboard: DashboardResult | null;
  analysis: AnalysisResult | null;
  qualityColor: string;
  qualityScore: number;
  onAnalyze: () => void;
  analyzing: boolean;
  onDashboard: () => void;
  dashboardLoading: boolean;
  cleanedFile: FileType;
}) {
  if (!dashboard) {
    return (
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
              </div>

              <h3 className="text-xl font-semibold text-white">
                Dashboard is ready to generate
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Analyze your dataset first, clean it, and then AutoAnalytica
                will build the dashboard from the cleaned data.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!analysis && (
                <button
                  onClick={onAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Analyze Dataset
                </button>
              )}

              {cleanedFile && (
                <button
                  onClick={onDashboard}
                  disabled={dashboardLoading}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                >
                  {dashboardLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Generate Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {analysis && (
          <div className="grid gap-5 md:grid-cols-4">
            <KpiCard
              title="Rows"
              value={analysis.summary.rows}
              icon={Table2}
            />
            <KpiCard
              title="Columns"
              value={analysis.summary.columns}
              icon={Database}
            />
            <KpiCard
              title="Missing Cells"
              value={analysis.summary.missing_cells}
              icon={AlertCircle}
            />
            <KpiCard
              title="Duplicates"
              value={analysis.summary.duplicates}
              icon={Trash2}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Rows"
          value={dashboard.kpis.rows}
          icon={Table2}
          subtitle="Records analyzed"
        />

        <KpiCard
          title="Columns"
          value={dashboard.kpis.columns}
          icon={Database}
          subtitle="Dataset fields"
        />

        <KpiCard
          title="Missing Cells"
          value={dashboard.kpis.missing_cells}
          icon={AlertCircle}
          subtitle="After cleaning"
          positive={dashboard.kpis.missing_cells === 0}
        />

        <KpiCard
          title="Duplicate Rows"
          value={dashboard.kpis.duplicate_rows}
          icon={RefreshCw}
          subtitle="After cleaning"
          positive={dashboard.kpis.duplicate_rows === 0}
        />
      </div>

      {/* Health + dataset summary */}
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Data health
              </p>

              <h3 className="mt-1 text-lg font-semibold text-white">
                Dataset quality
              </h3>
            </div>

            <CircleHelp className="h-4 w-4 text-slate-600" />
          </div>

          <div className="mt-7 flex justify-center">
            <HealthGauge
              score={
                dashboard.kpis.missing_cells === 0 &&
                dashboard.kpis.duplicate_rows === 0
                  ? 100
                  : qualityScore
              }
              color={
                dashboard.kpis.missing_cells === 0 &&
                dashboard.kpis.duplicate_rows === 0
                  ? "#22c55e"
                  : qualityColor
              }
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-slate-200">
              {dashboard.kpis.missing_cells === 0
                ? "Clean dataset"
                : "Review recommended"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Based on missing values, duplicates and detected data quality
              issues.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Dataset overview
              </p>

              <h3 className="mt-1 text-lg font-semibold text-white">
                What AutoAnalytica found
              </h3>
            </div>

            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryItem
              label="Numeric fields"
              value={dashboard.columns.numeric.length}
              detail={dashboard.columns.numeric.join(", ")}
            />

            <SummaryItem
              label="Categorical fields"
              value={dashboard.columns.categorical.length}
              detail={dashboard.columns.categorical.join(", ")}
            />

            <SummaryItem
              label="Date fields"
              value={dashboard.columns.date.length}
              detail={
                dashboard.columns.date.length
                  ? dashboard.columns.date.join(", ")
                  : "No standardized date columns detected"
              }
            />

            <SummaryItem
              label="Rows processed"
              value={dashboard.kpis.rows}
              detail="Cleaned dataset"
            />
          </div>
        </div>
      </div>

      {/* Numeric charts */}
      {dashboard.numeric_summary.length > 0 && (
        <section>
          <SectionHeader
            icon={BarChart3}
            title="Numeric Overview"
            description="Distribution summary across numeric fields"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {dashboard.numeric_summary.slice(0, 6).map((item) => (
              <NumericChart key={item.column} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Category charts */}
      {dashboard.category_summary.length > 0 && (
        <section>
          <SectionHeader
            icon={BarChart3}
            title="Category Distribution"
            description="Top categories detected in the cleaned dataset"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {dashboard.category_summary.slice(0, 6).map((item) => (
              <CategoryChart key={item.column} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      {dashboard.insights.length > 0 && (
        <section>
          <SectionHeader
            icon={Sparkles}
            title="Automatic Insights"
            description="Quick observations generated from your dataset"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>

                  <p className="text-sm leading-6 text-slate-300">
                    {insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Analysis
------------------------------------------------------- */

function AnalysisPage({
  analysis,
  qualityColor,
  qualityScore,
}: {
  analysis: AnalysisResult | null;
  qualityColor: string;
  qualityScore: number;
}) {
  if (!analysis) {
    return <EmptyState title="No analysis available yet." />;
  }

  const high = analysis.recommendations.filter(
    (item) => item.severity === "high"
  ).length;

  const medium = analysis.recommendations.filter(
    (item) => item.severity === "medium"
  ).length;

  const low = analysis.recommendations.filter(
    (item) => item.severity === "low"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Data quality
          </p>

          <div className="mt-6 flex justify-center">
            <HealthGauge score={qualityScore} color={qualityColor} />
          </div>

          <div className="mt-5 text-center">
            <p className="font-semibold text-white">
              {qualityScore >= 80
                ? "Good quality"
                : qualityScore >= 60
                ? "Needs attention"
                : "Needs cleaning"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Quality score based on detected data issues.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <IssueSummary
            label="High priority"
            value={high}
            color="red"
          />

          <IssueSummary
            label="Medium priority"
            value={medium}
            color="amber"
          />

          <IssueSummary
            label="Low priority"
            value={low}
            color="blue"
          />
        </div>
      </div>

      <section>
        <SectionHeader
          icon={AlertCircle}
          title="Detected Issues"
          description={`${analysis.recommendations.length} recommendations generated`}
        />

        <div className="space-y-3">
          {analysis.recommendations.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">
                  No major data quality issues detected.
                </p>
              </div>
            </div>
          ) : (
            analysis.recommendations.map((item, index) => (
              <IssueCard key={index} issue={item} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------
   Cleaning
------------------------------------------------------- */

function CleaningPage({
  result,
  cleanedFile,
  onDownload,
}: {
  result: CleaningResult | null;
  cleanedFile: FileType;
  onDownload: (format: "csv" | "xlsx") => void;
}) {
  if (!result) {
    return <EmptyState title="No cleaning activity yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Original Rows"
          value={result.summary.original_rows}
          icon={Table2}
        />

        <KpiCard
          title="Final Rows"
          value={result.summary.final_rows}
          icon={CheckCircle2}
          positive
        />

        <KpiCard
          title="Rows Removed"
          value={result.summary.rows_removed}
          icon={Trash2}
        />

        <KpiCard
          title="Columns Removed"
          value={result.summary.columns_removed}
          icon={Database}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <SectionHeader
            icon={WandSparkles}
            title="Cleaning activity"
            description="Actions performed by AutoAnalytica"
          />

          <div className="mt-8">
            <CleaningTimeline changes={result.summary.changes} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Cleaned dataset
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            Ready to export
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Your cleaned dataset is available in CSV and Excel formats.
          </p>

          {cleanedFile && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-300">
                    {cleanedFile.name}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-400">
                    Cleaned successfully
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <button
              onClick={() => onDownload("xlsx")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </button>

            <button
              onClick={() => onDownload("csv")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Insights
------------------------------------------------------- */

function InsightsPage({
  dashboard,
}: {
  dashboard: DashboardResult | null;
}) {
  if (!dashboard || dashboard.insights.length === 0) {
    return <EmptyState title="No insights available yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Dataset Insights
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Automatically generated observations based on the numerical
              characteristics of your cleaned dataset.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {dashboard.insights.map((insight, index) => (
          <div
            key={index}
            className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-cyan-400">
                {String(index + 1).padStart(2, "0")}
              </div>

              <p className="text-sm leading-7 text-slate-300">
                {insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Export
------------------------------------------------------- */

function ExportPage({
  file,
  cleanedFile,
  onDownload,
}: {
  file: FileType;
  cleanedFile: FileType;
  onDownload: (format: "csv" | "xlsx") => void;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Export
        </p>

        <h2 className="mt-1 text-2xl font-bold text-white">
          Download your dataset
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Export the cleaned version of your dataset for further analysis.
        </p>
      </div>

      <div className="space-y-4">
        <ExportCard
          icon={FileSpreadsheet}
          title="Excel Workbook"
          description="Download the cleaned dataset as an XLSX file."
          button="Download XLSX"
          disabled={!cleanedFile}
          onClick={() => onDownload("xlsx")}
        />

        <ExportCard
          icon={FileText}
          title="CSV File"
          description="Download the cleaned dataset as a standard CSV file."
          button="Download CSV"
          disabled={!cleanedFile}
          onClick={() => onDownload("csv")}
        />
      </div>

      {!cleanedFile && file && (
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
          Clean the dataset first before exporting.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Reusable UI
------------------------------------------------------- */

function KpiCard({
  title,
  value,
  icon: Icon,
  subtitle,
  positive = false,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  subtitle?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
          <Icon
            className={`h-4 w-4 ${
              positive ? "text-emerald-400" : "text-cyan-400"
            }`}
          />
        </div>

        {positive && (
          <span className="text-[10px] font-medium text-emerald-400">
            Healthy
          </span>
        )}
      </div>

      <p className="mt-5 text-xs font-medium text-slate-500">{title}</p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-white">
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}

function HealthGauge({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score, 100));

  const dashOffset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="relative h-44 w-44">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 180 180"
      >
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="13"
        />

        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">
          {Math.round(progress)}
        </span>

        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function IssueSummary({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "amber" | "blue";
}) {
  const styles = {
    red: {
      bg: "bg-red-500/5",
      border: "border-red-500/20",
      text: "text-red-400",
    },
    amber: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      text: "text-amber-400",
    },
    blue: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      text: "text-blue-400",
    },
  };

  const style = styles[color];

  return (
    <div
      className={`rounded-2xl border ${style.border} ${style.bg} p-6`}
    >
      <p className="text-xs text-slate-500">{label}</p>

      <p className={`mt-3 text-3xl font-bold ${style.text}`}>
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        detected issues
      </p>
    </div>
  );
}

function IssueCard({
  issue,
}: {
  issue: Recommendation;
}) {
  const severity = issue.severity.toLowerCase();

  const styles =
    severity === "high"
      ? {
          border: "border-red-500/20",
          bg: "bg-red-500/5",
          badge: "bg-red-500/10 text-red-400",
          icon: "text-red-400",
        }
      : severity === "medium"
      ? {
          border: "border-amber-500/20",
          bg: "bg-amber-500/5",
          badge: "bg-amber-500/10 text-amber-400",
          icon: "text-amber-400",
        }
      : {
          border: "border-blue-500/20",
          bg: "bg-blue-500/5",
          badge: "bg-blue-500/10 text-blue-400",
          icon: "text-blue-400",
        };

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-5`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.badge}`}
        >
          <AlertCircle className={`h-5 w-5 ${styles.icon}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              {issue.problem}
            </h3>

            <span
              className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${styles.badge}`}
            >
              {issue.severity}
            </span>

            {issue.column && (
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] text-slate-500">
                {issue.column}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {issue.reason}
          </p>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Recommended action
            </p>

            <p className="mt-1 text-xs font-medium text-slate-300">
              {issue.recommendation}
            </p>
          </div>

          {issue.count !== undefined && (
            <p className="mt-3 text-[11px] text-slate-600">
              Affected values: {issue.count}
              {issue.percentage !== undefined
                ? ` (${issue.percentage.toFixed(2)}%)`
                : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CleaningTimeline({
  changes,
}: {
  changes: CleaningChange[];
}) {
  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-800" />

      <div className="space-y-6">
        {changes.map((change, index) => {
          const title = formatAction(change.action);

          return (
            <div key={index} className="relative flex gap-4">
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#0f172a]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="min-w-0 pt-1">
                <p className="text-sm font-medium text-slate-200">
                  {title}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {formatChange(change)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatChange(change: CleaningChange) {
  if (change.action === "remove_empty_columns") {
    return `Removed ${change.columns?.length ?? 0} empty column(s): ${change.columns?.join(
      ", "
    )}`;
  }

  if (change.action === "remove_duplicates") {
    return `Removed ${change.rows_removed ?? 0} duplicate row(s).`;
  }

  if (change.action === "convert_to_numeric") {
    return `${change.column}: converted values to numeric format. ${
      change.invalid_values ?? 0
    } invalid value(s) were handled.`;
  }

  if (change.action === "standardize_categories") {
    return `${change.column}: standardized ${change.count ?? 0} category value(s).`;
  }

  if (change.action === "fill_missing_numeric") {
    return `${change.column}: filled ${
      change.values_filled ?? 0
    } missing value(s) using ${change.method ?? "numeric"}${
      change.value !== undefined ? ` (value: ${change.value})` : ""
    }.`;
  }

  if (change.action === "fill_missing_text") {
    return `${change.column}: filled ${
      change.values_filled ?? 0
    } missing value(s) with ${change.method ?? "Unknown"}.`;
  }

  if (change.action === "date_conversion_skipped") {
    return `${change.column}: date conversion was skipped because ambiguous formats were detected.`;
  }

  return change.reason ?? "Cleaning action completed.";
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-2 text-xl font-bold text-white">{value}</p>

      <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-600">
        {detail || "None detected"}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function NumericChart({
  item,
}: {
  item: {
    column: string;
    min: number;
    max: number;
    mean: number;
    median: number;
  };
}) {
  const data = [
    { metric: "Min", value: item.min },
    { metric: "Average", value: item.mean },
    { metric: "Median", value: item.median },
    { metric: "Max", value: item.max },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">
          {item.column}
        </h3>

        <p className="mt-1 text-[11px] text-slate-600">
          Statistical summary
        </p>
      </div>

      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="metric"
              stroke="#64748b"
              tick={{
                fill: "#64748b",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="#64748b"
              tick={{
                fill: "#64748b",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#ffffff",
              }}
              labelStyle={{
                color: "#cbd5e1",
              }}
              itemStyle={{
                color: "#ffffff",
              }}
              cursor={{
                fill: "rgba(255,255,255,0.04)",
              }}
            />

            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              fill="#38bdf8"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CategoryChart({
  item,
}: {
  item: {
    column: string;
    data: {
      category: string;
      count: number;
    }[];
  };
}) {
  const data = item.data.slice(0, 8);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {item.column}
          </h3>

          <p className="mt-1 text-[11px] text-slate-600">
            Category distribution
          </p>
        </div>

        <BarChart3 className="h-4 w-4 text-slate-600" />
      </div>

      <div className="h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 65,
            }}
          >
            <CartesianGrid
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="category"
              stroke="#64748b"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={80}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
              }}
            />

            <YAxis
              stroke="#64748b"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 10,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#ffffff",
              }}
              labelStyle={{
                color: "#cbd5e1",
              }}
              itemStyle={{
                color: "#ffffff",
              }}
              cursor={{
                fill: "rgba(255,255,255,0.04)",
              }}
            />

            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  button,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  button: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={disabled}
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Download className="h-4 w-4" />
        {button}
      </button>
    </div>
  );
}

function EmptyState({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
          <Database className="h-5 w-5 text-slate-600" />
        </div>

        <p className="mt-4 text-sm text-slate-500">{title}</p>
      </div>
    </div>
  );
}

export default App;