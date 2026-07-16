"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { buscarLote, registrarDespacho, getApiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";

interface LoteBuscado {
  id: number; codigo_qr: string; peso_ingreso: number; estado: string;
  fecha_hora_ingreso: string; horas_almacenado: number; alerta_roja: boolean;
  productor: { nombre: string; ci_nit: string; estancia_ubicacion?: string };
}

export default function DespachoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [codigoQr, setCodigoQr] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [lote, setLote] = useState<LoteBuscado | null>(null);
  const [pesoSalida, setPesoSalida] = useState("");
  const [despachando, setDespachando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
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

  const buscar = async () => {
    if (!codigoQr.trim()) return;
    setBuscando(true);
    setError("");
    setLote(null);
    try {
      const data = await buscarLote(codigoQr.trim(), user!.token);
      if (data.estado !== "En Cámara") {
        setError(`Este lote ya fue despachado (estado: ${data.estado})`);
      } else {
        setLote(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  };

  const despachar = async () => {
    const peso = parseFloat(pesoSalida);
    if (isNaN(peso) || peso <= 0) { setError("Ingresa un peso de salida válido"); return; }
    if (lote && peso > lote.peso_ingreso) { setError("El peso de salida no puede superar el peso de ingreso"); return; }
    setDespachando(true);
    setError("");
    try {
      const data = await registrarDespacho(lote!.codigo_qr, peso, user!.token);
      setResultado(data);
      setLote(null);
      setCodigoQr("");
      setPesoSalida("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDespachando(false);
    }
  };

  const handleNuevo = () => { setResultado(null); setError(""); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📤 Despacho y Ventas</h1>
          <p className="page-subtitle">Escanea o ingresa el código QR del lote para registrar la salida</p>
        </div>
      </div>

      {resultado ? (
        /* ─── Resultado Despacho ─── */
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className={`alert-banner ${resultado.alerta_amarilla ? "alert-banner-warning" : "alert-banner-success"}`} style={{ marginBottom: "1.5rem" }}>
            {resultado.alerta_amarilla ? "⚠️ ALERTA: " : "✅ "}{resultado.mensaje}
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text-primary)" }}>
              🧾 Resultado del Despacho
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              {[
                ["Código QR", resultado.lote.codigo_qr],
                ["Productor", resultado.lote.productor?.nombre],
                ["Peso Ingreso", `${resultado.lote.peso_ingreso} kg`],
                ["Peso Salida", `${resultado.lote.peso_salida} kg`],
                ["Merma", `${resultado.merma.toFixed(3)} kg`],
                ["Merma %", `${resultado.merma_porcentaje.toFixed(2)}%`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "var(--color-surface-2)", padding: "0.875rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: label === "Merma %" && resultado.alerta_amarilla ? "var(--color-warning)" : "var(--color-text-primary)", marginTop: "0.25rem" }}>{value}</div>
                </div>
              ))}
            </div>

            {resultado.alerta_amarilla && (
              <div className="alert-banner alert-banner-warning" style={{ marginBottom: "1rem" }}>
                ⚠️ Merma superior al 3% — requiere revisión supervisada
              </div>
            )}

            <div className="flex-gap" style={{ justifyContent: "center" }}>
              <a
                href={`http://localhost:8000${resultado.pdf_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent"
              >
                📄 Descargar Remito PDF
              </a>
              <button className="btn btn-primary" onClick={handleNuevo}>➕ Nuevo Despacho</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: "600px" }}>
          {/* ─── Buscar QR ─── */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-primary)" }}>
              🔍 Buscar Lote por Código QR
            </h2>
            {error && <div className="alert-banner alert-banner-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                className="input"
                placeholder="Ingresa o escanea el código QR..."
                value={codigoQr}
                onChange={(e) => setCodigoQr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-accent" onClick={buscar} disabled={buscando}>
                {buscando ? <div className="spinner" /> : "🔍 Buscar"}
              </button>
            </div>
          </div>

          {/* ─── Lote encontrado ─── */}
          {lote && (
            <div className="card">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-primary)" }}>
                ✅ Lote Encontrado
              </h2>

              <div
                style={{
                  background: lote.alerta_roja ? "var(--color-alert-red-bg)" : "var(--color-surface-2)",
                  border: `1px solid ${lote.alerta_roja ? "var(--color-alert-red)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    ["Código QR", lote.codigo_qr],
                    ["Productor", lote.productor.nombre],
                    ["Peso Ingreso", `${lote.peso_ingreso} kg`],
                    ["Tiempo en Cámara", lote.alerta_roja ? `⚠️ ${lote.horas_almacenado.toFixed(1)}h (ALERTA)` : `${lote.horas_almacenado.toFixed(1)}h`],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>{l}</div>
                      <div style={{ fontWeight: 600, color: l === "Tiempo en Cámara" && lote.alerta_roja ? "var(--color-alert-red)" : "var(--color-text-primary)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Peso de Salida (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={lote.peso_ingreso}
                  className="input"
                  placeholder={`Máx: ${lote.peso_ingreso} kg`}
                  value={pesoSalida}
                  onChange={(e) => setPesoSalida(e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  La merma se calculará automáticamente
                </span>
              </div>

              {pesoSalida && !isNaN(parseFloat(pesoSalida)) && (
                <div style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "0.875rem", marginBottom: "1rem", display: "flex", gap: "1.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>MERMA ESTIMADA</div>
                    <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {(lote.peso_ingreso - parseFloat(pesoSalida)).toFixed(3)} kg
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>MERMA %</div>
                    <div style={{ fontWeight: 700, color: ((lote.peso_ingreso - parseFloat(pesoSalida)) / lote.peso_ingreso * 100) > 3 ? "var(--color-warning)" : "var(--color-success)" }}>
                      {((lote.peso_ingreso - parseFloat(pesoSalida)) / lote.peso_ingreso * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={despachar} disabled={despachando}>
                {despachando ? <><div className="spinner" /> Procesando...</> : "🚚 Confirmar Despacho y Generar PDF"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
