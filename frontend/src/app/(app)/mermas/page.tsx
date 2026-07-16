"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMermas } from "@/lib/api";
import { useRouter } from "next/navigation";

interface MermaItem {
  id: number; codigo_qr: string; productor: string; peso_ingreso: number; peso_salida: number;
  merma: number; merma_porcentaje: number; fecha_hora_ingreso: string; fecha_hora_despacho: string;
  alerta_amarilla: boolean;
}

export default function MermasPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ total: number; alertas_amarillas: number; total_merma_kg: number; lotes: MermaItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "alerta">("todos");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getMermas(user.token).then(setData).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return null;

  const lotesFiltrados = data?.lotes.filter((l) => filtro === "todos" || l.alerta_amarilla) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚖️ Auditoría de Mermas</h1>
          <p className="page-subtitle">Historial de despachos — Amarillo = merma superior al 3% (posible desposte injustificado)</p>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-icon success">✅</div>
            <div><div className="stat-value">{data.total}</div><div className="stat-label">Total despachos</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">⚠️</div>
            <div>
              <div className="stat-value" style={{ color: data.alertas_amarillas > 0 ? "var(--color-warning)" : "inherit" }}>
                {data.alertas_amarillas}
              </div>
              <div className="stat-label">Alertas amarillas (&gt;3%)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">📉</div>
            <div><div className="stat-value">{data.total_merma_kg} kg</div><div className="stat-label">Merma total acumulada</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon accent">📊</div>
            <div>
              <div className="stat-value">
                {data.total > 0
                  ? (data.lotes.reduce((s, l) => s + l.merma_porcentaje, 0) / data.total).toFixed(2)
                  : "0.00"}%
              </div>
              <div className="stat-label">Merma promedio</div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda y filtro */}
      <div className="flex-between" style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="flex-gap">
          <div className="badge badge-yellow" style={{ padding: "0.35rem 0.75rem" }}>🟡 Amarillo = merma &gt;3% (anormal)</div>
          <div className="badge badge-green" style={{ padding: "0.35rem 0.75rem" }}>🟢 Verde = merma normal (≤3%)</div>
        </div>
        <div className="flex-gap">
          <button className={`btn ${filtro === "todos" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setFiltro("todos")}>Todos</button>
          <button className={`btn ${filtro === "alerta" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setFiltro("alerta")}>Solo alertas</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0 }}>
        {loading && <div className="flex-center" style={{ padding: "3rem" }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>}
        {error && <div className="alert-banner alert-banner-error" style={{ margin: "1rem" }}>⚠️ {error}</div>}
        {!loading && !error && (
          <div className="table-container" style={{ borderRadius: "var(--radius-lg)" }}>
            <table>
              <thead>
                <tr>
                  <th>Código QR</th>
                  <th>Productor</th>
                  <th>Peso Ingreso</th>
                  <th>Peso Salida</th>
                  <th>Merma (kg)</th>
                  <th>Merma %</th>
                  <th>Fecha Despacho</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">⚖️</div><div className="empty-state-text">No hay registros de despachos aún</div></div></td></tr>
                ) : lotesFiltrados.map((l) => (
                  <tr key={l.id} className={l.alerta_amarilla ? "alert-yellow" : ""}>
                    <td><code style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--color-accent)" }}>{l.codigo_qr}</code></td>
                    <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{l.productor}</td>
                    <td>{l.peso_ingreso.toFixed(3)} kg</td>
                    <td>{l.peso_salida?.toFixed(3)} kg</td>
                    <td><strong style={{ color: "var(--color-text-primary)" }}>{l.merma?.toFixed(3)} kg</strong></td>
                    <td>
                      <span style={{ fontWeight: 700, color: l.alerta_amarilla ? "var(--color-warning)" : "var(--color-success)" }}>
                        {l.alerta_amarilla ? "⚠️" : "✅"} {l.merma_porcentaje?.toFixed(2)}%
                      </span>
                    </td>
                    <td>{new Date(l.fecha_hora_despacho).toLocaleString("es-BO")}</td>
                    <td><span className={`badge ${l.alerta_amarilla ? "badge-yellow" : "badge-green"}`}>{l.alerta_amarilla ? "🟡 Anormal" : "🟢 Normal"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
