// Utilidades de cálculo y fechas para entregas de capital
export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMesActualStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMesYear(mesStr) {
  if (!mesStr) return '-';
  const [y, m] = mesStr.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${NOMBRES_MESES[idx] || m} ${y}`;
}

export function sumarMes(mesStr) {
  if (!mesStr) return getMesActualStr();
  const [y, m] = mesStr.split('-').map(Number);
  let nextM = m + 1;
  let nextY = y;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  return `${nextY}-${String(nextM).padStart(2, '0')}`;
}

export function getEstadoCobro(prestamo, fechaActual = new Date()) {
  const est = (prestamo.estado || '').toLowerCase();
  if (prestamo.capitalActual <= 0 || est === 'liquidado' || est === 'cancelado') {
    return {
      estado: 'liquidado',
      yaCobradoEsteMes: true,
      mensaje: 'Préstamo liquidado',
      mesPorCobrar: null,
      nombreMesPorCobrar: 'Liquidado',
      proximaFechaTexto: 'Liquidado',
      esAtrasado: false,
    };
  }

  const mesActual = getMesActualStr(fechaActual);
  const diaHoy = fechaActual.getDate();
  const ultimoPagado = prestamo.ultimoMesPagado || '';

  // Determinar el mes que toca pagar
  let mesPorCobrar = '';
  if (!ultimoPagado) {
    mesPorCobrar = prestamo.fechaInicio ? prestamo.fechaInicio.slice(0, 7) : mesActual;
  } else {
    mesPorCobrar = sumarMes(ultimoPagado);
  }

  const yaCobradoEsteMes = ultimoPagado >= mesActual;

  const [yPend, mPend] = mesPorCobrar.split('-').map(Number);
  const nombreMesPend = NOMBRES_MESES[mPend - 1] || mesPorCobrar;

  // ¿Está atrasado?
  let esAtrasado = false;
  if (mesPorCobrar < mesActual) {
    esAtrasado = true;
  } else if (mesPorCobrar === mesActual && diaHoy > prestamo.diaCobro) {
    esAtrasado = true;
  }

  let proximaFechaTexto = '';
  if (yaCobradoEsteMes) {
    const mesSiguiente = sumarMes(ultimoPagado);
    const [ySig, mSig] = mesSiguiente.split('-').map(Number);
    proximaFechaTexto = `${prestamo.diaCobro} de ${NOMBRES_MESES[mSig - 1]} ${ySig}`;
  } else {
    proximaFechaTexto = `${prestamo.diaCobro} de ${nombreMesPend} ${yPend}`;
  }

  return {
    estado: esAtrasado ? 'atrasado' : 'al_dia',
    yaCobradoEsteMes,
    mesPorCobrar,
    nombreMesPorCobrar: `${nombreMesPend} ${yPend}`,
    esAtrasado,
    proximaFechaTexto,
  };
}

export function calcularMetricas(listaPrestamos) {
  const activos = listaPrestamos.filter((p) => p.capitalActual > 0 && p.estado !== 'liquidado');

  let cobrosPendientesOatrasados = 0;
  activos.forEach((p) => {
    const cobroInfo = getEstadoCobro(p);
    if (!cobroInfo.yaCobradoEsteMes || cobroInfo.esAtrasado) {
      cobrosPendientesOatrasados++;
    }
  });

  return {
    // 1. Capital en la calle: Total prestado al distribuidor
    capitalEnLaCalle: activos.reduce((sum, p) => sum + p.capitalActual, 0),
    // 2. Intereses esperados al mes: Tu ganancia mensual total
    interesesDelMes: activos.reduce((sum, p) => sum + p.interesMensual, 0),
    // 3. Cobros atrasados o pendientes este mes
    proximosCobros: cobrosPendientesOatrasados,
  };
}

export function formatearMoneda(valor) {
  return `S/ ${Number(valor || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}


