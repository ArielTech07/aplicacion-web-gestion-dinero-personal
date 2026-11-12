import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  calcularMetricas,
  getEstadoCobro,
  sumarMes,
  getMesActualStr,
  NOMBRES_MESES,
} from '../data/mockData';
import { prestamosApi, pagosApi } from '../services/api';
import { useAuth } from './AuthContext';

const LoanContext = createContext();

export function LoanProvider({ children }) {
  const { user } = useAuth();

  // Estado real: inicia completamente vacío (sin datos falsos ni mocks)
  const [prestamosList, setPrestamosList] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);

  // Settings dinámicos basados en el usuario autenticado
  const settings = {
    adminName: user?.nombre || 'Usuario',
    adminRole: 'El Goty',
    currency: user?.monedaDefault || 'S/',
    defaultRate: Number(user?.tasaDefault) || 10,
  };

  // ==============================================================================
  // 1. CARGA REAL DESDE LA BASE DE DATOS (AXIOS -> SPRING BOOT -> POSTGRESQL)
  // ==============================================================================
  const cargarDatosDelBackend = useCallback(async () => {
    if (!user) {
      setPrestamosList([]);
      return;
    }
    try {
      setCargando(true);
      setErrorBackend(null);

      // Traer los préstamos reales de la base de datos
      const data = await prestamosApi.listarTodos();
      // Si la base de datos no tiene datos, queda vacío []
      setPrestamosList(data || []);
    } catch (err) {
      console.warn('No se pudo conectar con el backend o la base de datos:', err.message);
      setErrorBackend(err.message);
      // Si falla la conexión, la lista permanece estrictamente vacía
      setPrestamosList([]);
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => {
    // Limpia cualquier residuo de datos falsos previos en el navegador
    localStorage.removeItem('gd_prestamos_v3');
    cargarDatosDelBackend();
  }, [cargarDatosDelBackend]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `${settings.currency} ${num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ==============================================================================
  // 2. CREAR PRÉSTAMO REAL (POST /api/prestamos/usuario/{id})
  // ==============================================================================
  const addLoan = async (newLoan) => {
    const capital = parseFloat(newLoan.capital) || 0;
    const tasa = parseFloat(newLoan.tasaInteres) || 10;
    const interesMensual = Math.round(capital * (tasa / 100));

    let dia = parseInt(newLoan.diaCobro, 10);
    if (!dia && newLoan.fechaInicio) {
      dia = parseInt(newLoan.fechaInicio.split('-')[2], 10) || 21;
    }

    const fechaInicio = newLoan.fechaInicio || new Date().toISOString().split('T')[0];
    const mesInicio = fechaInicio.slice(0, 7);

    const payload = {
      referencia: newLoan.referencia || 'Entrega de Capital',
      capital,
      capitalInicial: capital,
      capitalActual: capital,
      tasaInteres: tasa,
      interesMensual,
      diaCobro: dia || 21,
      fechaInicio,
      estado: 'ACTIVO',
      ultimoMesPagado: mesInicio,
    };

    // Registrar en PostgreSQL vía Axios
    const prestamoCreado = await prestamosApi.crear(user.id, payload);
    setPrestamosList((prev) => [prestamoCreado, ...prev]);
    return prestamoCreado;
  };

  // ==============================================================================
  // 3. REGISTRAR COBRO DE INTERÉS REAL (POST /api/pagos/prestamo/{id})
  // ==============================================================================
  const cobrarInteres = async (loanId, nota = '', forzarAdelanto = false) => {
    const targetLoan = prestamosList.find((p) => p.id === loanId);
    if (!targetLoan) return;

    const cobroInfo = getEstadoCobro(targetLoan);
    if (cobroInfo.yaCobradoEsteMes && !forzarAdelanto) {
      return;
    }

    let mesAPagar = cobroInfo.mesPorCobrar;
    if (cobroInfo.yaCobradoEsteMes && forzarAdelanto) {
      mesAPagar = sumarMes(targetLoan.ultimoMesPagado || getMesActualStr());
    }

    const [y, m] = mesAPagar.split('-').map(Number);
    const nombreMes = `${NOMBRES_MESES[m - 1] || m} ${y}`;

    const nuevoPago = {
      monto: targetLoan.interesMensual,
      tipo: 'interes',
      mesCobrado: mesAPagar,
      descripcion: nota || `Cobro de Interés Mensual (${nombreMes}) - Día ${targetLoan.diaCobro}`,
    };

    // Guardar en base de datos vía Axios y recargar estado real
    await pagosApi.registrar(loanId, nuevoPago);
    await cargarDatosDelBackend();
  };

  // ==============================================================================
  // 4. LIQUIDACIÓN TOTAL REAL (POST /api/pagos/prestamo/{id})
  // ==============================================================================
  const liquidarPrestamo = async (loanId) => {
    const targetLoan = prestamosList.find((p) => p.id === loanId);
    if (!targetLoan) return;

    const totalLiquidacion = targetLoan.capitalActual + targetLoan.interesMensual;
    const pagoLiquidacion = {
      monto: totalLiquidacion,
      tipo: 'liquidacion',
      descripcion: `Liquidación Total (Capital ${formatCurrency(targetLoan.capitalActual)} + Interés ${formatCurrency(targetLoan.interesMensual)})`,
    };

    // Guardar en base de datos vía Axios y recargar estado real
    await pagosApi.registrar(loanId, pagoLiquidacion);
    await cargarDatosDelBackend();
  };

  // ==============================================================================
  // 5. ABONO A CAPITAL REAL (POST /api/pagos/prestamo/{id})
  // ==============================================================================
  const abonarCapital = async (loanId, montoCapital) => {
    const monto = parseFloat(montoCapital);
    if (!monto || monto <= 0) return;

    const targetLoan = prestamosList.find((p) => p.id === loanId);
    if (!targetLoan) return;

    const nuevoCapital = Math.max(0, targetLoan.capitalActual - monto);
    const pagoAbono = {
      monto,
      tipo: 'abono_capital',
      descripcion: `Devolución parcial de capital (Capital restante: ${formatCurrency(nuevoCapital)})`,
    };

    // Guardar en base de datos vía Axios y recargar estado real
    await pagosApi.registrar(loanId, pagoAbono);
    await cargarDatosDelBackend();
  };

  // ==============================================================================
  // 6. ELIMINAR PRÉSTAMO REAL (DELETE /api/prestamos/{id})
  // ==============================================================================
  const deleteLoan = async (loanId) => {
    await prestamosApi.eliminar(loanId);
    setPrestamosList((prev) => prev.filter((p) => p.id !== loanId));
  };

  const metrics = calcularMetricas(prestamosList);

  return (
    <LoanContext.Provider
      value={{
        prestamosList,
        settings,
        metrics,
        cargando,
        errorBackend,
        formatCurrency,
        addLoan,
        cobrarInteres,
        liquidarPrestamo,
        abonarCapital,
        deleteLoan,
        recargarDatos: cargarDatosDelBackend,
      }}
    >
      {children}
    </LoanContext.Provider>
  );
}

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoans must be used within a LoanProvider');
  }
  return context;
};
