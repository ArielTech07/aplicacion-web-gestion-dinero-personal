import axios from 'axios';
import { getEstadoCobro } from '../data/mockData';

// ==============================================================================
// CONFIGURACIÓN DEL CLIENTE AXIOS
// ==============================================================================
// Permite configurar la URL base mediante variables de entorno (VITE_API_URL),
// o usa por defecto el backend local en http://localhost:8080/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8 segundos de timeout para evitar peticiones colgadas
});

// Interceptor de petición para adjuntar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gd_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejo centralizado de errores y expiración de token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró o no es válido, notifica para cerrar sesión
    if (error.response?.status === 401 && !error.config?.url?.includes('/usuarios/login')) {
      localStorage.removeItem('gd_jwt_token');
      localStorage.removeItem('gd_auth_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    console.error('Error en la comunicación con el Backend:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==============================================================================
// ADAPTADORES / NORMALIZADORES DE DATOS
// ==============================================================================
// El backend en Java usa nombres como 'capitalInicial', 'capitalActual' y 'pagos',
// mientras que el frontend en React usaba 'capital' y 'abonos'.
// Estas funciones garantizan total compatibilidad sin romper la UI existente.

export function normalizePrestamo(p) {
  if (!p) return null;

  const abonosNormalizados = (p.pagos || p.abonos || []).map((pago) => ({
    id: pago.id,
    fecha: typeof pago.fecha === 'string' ? pago.fecha.split('T')[0] : pago.fecha,
    monto: Number(pago.monto || 0),
    tipo: (pago.tipo || 'interes').toLowerCase(),
    mesCobrado: pago.mesCobrado,
    descripcion: pago.descripcion,
  }));

  const capitalActualNum = Number(p.capitalActual ?? p.capitalInicial ?? 0);
  const capitalInicialNum = Number(p.capitalInicial ?? p.capitalActual ?? 0);
  const tasaNum = Number(p.tasaInteres ?? 10);
  const interesMensualNum = Number(p.interesMensual ?? Math.round(capitalActualNum * (tasaNum / 100)));

  // Determinar estado consistente con las pestañas del frontend ('liquidado', 'atrasado', 'al_dia')
  const estadoUpper = (p.estado || '').toUpperCase();
  let estadoCalculado = 'al_dia';

  if (capitalActualNum <= 0 || estadoUpper === 'LIQUIDADO' || estadoUpper === 'CANCELADO' || estadoUpper === 'PAGADO') {
    estadoCalculado = 'liquidado';
  } else {
    const tempPrestamo = {
      capitalActual: capitalActualNum,
      ultimoMesPagado: p.ultimoMesPagado,
      diaCobro: p.diaCobro || 21,
      fechaInicio: p.fechaInicio,
      estado: 'ACTIVO',
    };
    const infoCobro = getEstadoCobro(tempPrestamo);
    estadoCalculado = infoCobro.esAtrasado ? 'atrasado' : 'al_dia';
  }

  return {
    ...p,
    id: p.id,
    referencia: p.referencia || `Entrega #${p.id}`,
    distribuidor: p.distribuidor || 'Distribuidor',
    capital: capitalActualNum, // Compatible con componentes antiguos
    capitalActual: capitalActualNum,
    capitalInicial: capitalInicialNum,
    tasaInteres: tasaNum,
    interesMensual: interesMensualNum,
    diaCobro: p.diaCobro || 21,
    fechaInicio: p.fechaInicio || new Date().toISOString().split('T')[0],
    estado: estadoCalculado,
    estadoOriginal: p.estado,
    ultimoMesPagado: p.ultimoMesPagado,
    abonos: abonosNormalizados, // Mapeado desde 'pagos' del backend
    pagos: p.pagos || [],
  };
}

// Prepara el objeto de pago para que coincida con la entidad Pago en Spring Boot
export function preparePagoParaBackend(pago) {
  let tipoBackend = 'INTERES';
  const tipoLower = (pago.tipo || '').toLowerCase();

  if (tipoLower === 'abono_capital' || tipoLower === 'capital') {
    tipoBackend = 'CAPITAL';
  } else if (tipoLower === 'liquidacion' || tipoLower === 'total') {
    tipoBackend = 'TOTAL';
  }

  return {
    monto: Number(pago.monto),
    tipo: tipoBackend,
    mesCobrado: pago.mesCobrado || null,
    descripcion: pago.descripcion || '',
    fecha: pago.fecha ? `${pago.fecha}T12:00:00` : new Date().toISOString(),
  };
}

// ==============================================================================
// SERVICIOS DE LA API CON AXIOS
// ==============================================================================

// 1. Usuarios
export const usuariosApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/usuarios/login', { email, password });
    return res.data;
  },
  listar: async () => {
    const res = await apiClient.get('/usuarios');
    return res.data;
  },
  buscarPorId: async (id) => {
    const res = await apiClient.get(`/usuarios/${id}`);
    return res.data;
  },
};

// 2. Préstamos / Entregas de capital
export const prestamosApi = {
  listarTodos: async () => {
    const res = await apiClient.get('/prestamos');
    return (res.data || []).map(normalizePrestamo);
  },
  listarPorUsuario: async (usuarioId) => {
    const res = await apiClient.get(`/prestamos/usuario/${usuarioId}`);
    return (res.data || []).map(normalizePrestamo);
  },
  buscarPorId: async (id) => {
    const res = await apiClient.get(`/prestamos/${id}`);
    return normalizePrestamo(res.data);
  },
  crear: async (usuarioId, prestamo) => {
    const payload = {
      referencia: prestamo.referencia,
      capitalInicial: Number(prestamo.capital || prestamo.capitalInicial),
      capitalActual: Number(prestamo.capital || prestamo.capitalInicial),
      tasaInteres: Number(prestamo.tasaInteres || 10),
      interesMensual: Number(prestamo.interesMensual || 0),
      diaCobro: parseInt(prestamo.diaCobro, 10) || 21,
      fechaInicio: prestamo.fechaInicio || new Date().toISOString().split('T')[0],
      estado: 'ACTIVO',
      ultimoMesPagado: prestamo.ultimoMesPagado || prestamo.fechaInicio?.slice(0, 7),
    };

    const res = await apiClient.post(`/prestamos/usuario/${usuarioId}`, payload);
    return normalizePrestamo(res.data);
  },
  actualizar: async (id, prestamo) => {
    const res = await apiClient.put(`/prestamos/${id}`, prestamo);
    return normalizePrestamo(res.data);
  },
  eliminar: async (id) => {
    await apiClient.delete(`/prestamos/${id}`);
    return true;
  },
};

// 3. Pagos / Abonos
export const pagosApi = {
  listarPorPrestamo: async (prestamoId) => {
    const res = await apiClient.get(`/pagos/prestamo/${prestamoId}`);
    return res.data;
  },
  registrar: async (prestamoId, pago) => {
    const payload = preparePagoParaBackend(pago);
    const res = await apiClient.post(`/pagos/prestamo/${prestamoId}`, payload);
    return res.data;
  },
  eliminar: async (id) => {
    await apiClient.delete(`/pagos/${id}`);
    return true;
  },
};

