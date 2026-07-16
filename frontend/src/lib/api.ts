// Cliente para comunicarse con la API Python (FastAPI)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error de red" }));
    throw new Error(error.detail || `Error ${res.status}`);
  }
  return res.json();
}

// Auth
export const loginApi = (username: string, password: string) => {
  const body = new URLSearchParams({ username, password });
  return fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al iniciar sesión");
    }
    return res.json();
  });
};

// Productores
export const getProductores = (token: string) =>
  apiFetch("/api/productores/", { token });

export const crearProductor = (data: object, token: string) =>
  apiFetch("/api/productores/", { method: "POST", body: JSON.stringify(data), token });

export const actualizarProductor = (id: number, data: object, token: string) =>
  apiFetch(`/api/productores/${id}`, { method: "PUT", body: JSON.stringify(data), token });

export const eliminarProductor = (id: number, token: string) =>
  apiFetch(`/api/productores/${id}`, { method: "DELETE", token });

// Inventario
export const getInventario = (token: string) =>
  apiFetch("/api/inventario", { token });

export const buscarLote = (codigoQr: string, token: string) =>
  apiFetch(`/api/inventario/buscar?codigo_qr=${encodeURIComponent(codigoQr)}`, { token });

export const getTodosLotes = (token: string) =>
  apiFetch("/api/inventario/todos", { token });

// Recepción
export const registrarIngreso = (data: object, token: string) =>
  apiFetch("/api/recepcion", { method: "POST", body: JSON.stringify(data), token });

// Despacho
export const registrarDespacho = (codigoQr: string, pesoSalida: number, token: string) =>
  apiFetch(`/api/despacho?codigo_qr=${encodeURIComponent(codigoQr)}&peso_salida=${pesoSalida}`, {
    method: "POST",
    token,
  });

// Mermas
export const getMermas = (token: string) =>
  apiFetch("/api/mermas", { token });

// Reportes
export const getReportes = (agrupacion: "mes" | "semana", token: string) =>
  apiFetch(`/api/reportes?agrupacion=${agrupacion}`, { token });

export const getApiUrl = () => API_URL;
