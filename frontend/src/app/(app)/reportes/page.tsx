"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getReportes } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, type ChartData,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface EstStat {
  periodo: string; total_ingresos: number; total_despachos: number;
  peso_total_ingresado: number; peso_total_despachado: number;
  merma_total: number; merma_promedio_porcentaje: number;
}

export default function ReportesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [agrupacion, setAgrupacion] = useState<"mes" | "semana">("mes");
  const [data, setData] = useState<{ agrupacion: string; estadisticas: EstStat[]; pdf_url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      cargar();
    }
  }, [user, isLoading, agrupacion, router]);

  const cargar = async () => {
    setLoading(true);
    try {
      const d = await getReportes(agrupacion, user!.token);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return null;

  const labels = data?.estadisticas.map((e) => e.periodo) || [];

  const chartPesos: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Peso Ingresado (kg)",
        data: data?.estadisticas.map((e) => e.peso_total_ingresado) || [],
        backgroundColor: "rgba(79, 156, 249, 0.7)",
        borderColor: "#4f9cf9",
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Peso Despachado (kg)",
        data: data?.estadisticas.map((e) => e.peso_total_despachado) || [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartMerma: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Merma Promedio (%)",
        data: data?.estadisticas.map((e) => e.merma_promedio_porcentaje) || [],
        borderColor: "#e94560",
        backgroundColor: "rgba(233, 69, 96, 0.1)",
        borderWidth: 2,
        pointBackgroundColor: "#e94560",
        pointRadius: 5,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 12 } } },
    },
    scales: {
      x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
    },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Reportes y Pronóstico</h1>
          <p className="page-subtitle">Estadísticas históricas de volumen e indicadores de merma para gerencia</p>
        </div>
        <div className="flex-gap">
          <select className="input" style={{ width: "auto" }} value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as any)}>
            <option value="mes">Por Mes</option>
            <option value="semana">Por Semana</option>
          </select>
          {data && (
            <a href={`http://localhost:8000${data.pdf_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              📄 Exportar PDF
            </a>
          )}
        </div>
      </div>

      {loading && <div className="flex-center" style={{ padding: "4rem" }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>}
      {error && <div className="alert-banner alert-banner-error">⚠️ {error}</div>}

      {!loading && data && (
        <>
          {/* Stats resumen */}
          <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-icon accent">📥</div>
              <div>
                <div className="stat-value">{data.estadisticas.reduce((s, e) => s + e.total_ingresos, 0)}</div>
                <div className="stat-label">Total ingresos históricos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">📤</div>
              <div>
                <div className="stat-value">{data.estadisticas.reduce((s, e) => s + e.total_despachos, 0)}</div>
                <div className="stat-label">Total despachos históricos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon primary">⚖️</div>
              <div>
                <div className="stat-value">{data.estadisticas.reduce((s, e) => s + e.peso_total_ingresado, 0).toFixed(1)} kg</div>
                <div className="stat-label">Peso total procesado</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger">📉</div>
              <div>
                <div className="stat-value">{data.estadisticas.reduce((s, e) => s + e.merma_total, 0).toFixed(1)} kg</div>
                <div className="stat-label">Merma total acumulada</div>
              </div>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div className="card-header">
              <h2 className="card-title">📊 Volumen de Pesos — {agrupacion === "mes" ? "Mensual" : "Semanal"}</h2>
            </div>
            {labels.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No hay datos disponibles aún</div></div>
            ) : (
              <Bar data={chartPesos} options={chartOptions} />
            )}
          </div>

          {/* Gráfico de líneas */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <div className="card-header">
              <h2 className="card-title">📉 Tendencia de Merma Promedio (%)</h2>
            </div>
            {labels.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📉</div><div className="empty-state-text">No hay datos disponibles aún</div></div>
            ) : (
              <Line data={chartMerma} options={chartOptions} />
            )}
          </div>

          {/* Tabla de estadísticas */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="card-title">📋 Tabla de Estadísticas Detalladas</h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Ingresos</th>
                    <th>Despachos</th>
                    <th>Peso Ingr. (kg)</th>
                    <th>Peso Desp. (kg)</th>
                    <th>Merma Total (kg)</th>
                    <th>Merma Prom. (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.estadisticas.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">Sin datos</div></div></td></tr>
                  ) : data.estadisticas.map((e) => (
                    <tr key={e.periodo} className={e.merma_promedio_porcentaje > 3 ? "alert-yellow" : ""}>
                      <td><strong style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>{e.periodo}</strong></td>
                      <td>{e.total_ingresos}</td>
                      <td>{e.total_despachos}</td>
                      <td>{e.peso_total_ingresado.toFixed(2)}</td>
                      <td>{e.peso_total_despachado.toFixed(2)}</td>
                      <td>{e.merma_total.toFixed(2)}</td>
                      <td><span style={{ fontWeight: 700, color: e.merma_promedio_porcentaje > 3 ? "var(--color-warning)" : "var(--color-success)" }}>{e.merma_promedio_porcentaje.toFixed(2)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
