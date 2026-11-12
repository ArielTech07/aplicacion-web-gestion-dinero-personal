import { useState, useEffect, useRef } from 'react';
import { X, Clock, CheckCircle } from 'lucide-react';
import { formatearFecha, getEstadoCobro } from '../../data/mockData';
import { useLoans } from '../../context/LoanContext';
import ConfirmModal from './ConfirmModal';
import './LoanDetailModal.css';

export default function LoanDetailModal({ prestamo, onClose }) {
  const { formatCurrency, cobrarInteres, liquidarPrestamo, abonarCapital, deleteLoan } = useLoans();
  const [showAbonoCapital, setShowAbonoCapital] = useState(false);
  const [montoAbonoCapital, setMontoAbonoCapital] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    onConfirm: () => {},
  });

  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !dialogState.isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, dialogState.isOpen]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const totalLiquidacion = prestamo.capitalActual + prestamo.interesMensual;
  const totalInteresesGanados = prestamo.abonos
    .filter((a) => a.tipo === 'interes')
    .reduce((sum, a) => sum + a.monto, 0);

  // Determinar estado de cobro para habilitar/deshabilitar botón
  const cobroInfo = getEstadoCobro(prestamo);
  const puedeCobrar = !cobroInfo.yaCobradoEsteMes || cobroInfo.esAtrasado;

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const showNotification = (title, message, variant = 'danger') => {
    setDialogState({
      isOpen: true,
      title,
      message,
      confirmText: 'Entendido',
      cancelText: null,
      variant,
      onConfirm: closeDialog,
    });
  };

  const handleCobroInteres = async () => {
    if (!puedeCobrar) return;
    try {
      await cobrarInteres(prestamo.id);
      setMensajeExito(`Cobro de interés de ${formatCurrency(prestamo.interesMensual)} registrado (${cobroInfo.nombreMesPorCobrar}). El capital de ${formatCurrency(prestamo.capitalActual)} sigue colocado.`);
      setTimeout(() => setMensajeExito(''), 3500);
    } catch (err) {
      showNotification('Error al registrar cobro', err.response?.data?.message || err.message, 'danger');
    }
  };

  const handleLiquidar = () => {
    setDialogState({
      isOpen: true,
      title: 'Liquidar Entrega de Capital',
      message: `¿Confirmas la liquidación total de la entrega "${prestamo.referencia || 'Capital'}"? El distribuidor devuelve ${formatCurrency(totalLiquidacion)} (Capital + Interés) y el préstamo quedará saldado.`,
      confirmText: 'Sí, liquidar entrega',
      cancelText: 'Cancelar',
      variant: 'warning',
      onConfirm: async () => {
        closeDialog();
        try {
          await liquidarPrestamo(prestamo.id);
          setMensajeExito('Entrega liquidada exitosamente.');
          setTimeout(() => setMensajeExito(''), 3500);
        } catch (err) {
          showNotification('Error al liquidar', err.response?.data?.message || err.message, 'danger');
        }
      },
    });
  };

  const handleDelete = () => {
    setDialogState({
      isOpen: true,
      title: 'Eliminar Entrega',
      message: `¿Estás seguro de eliminar el registro de "${prestamo.referencia || 'esta entrega'}"? Esta acción no se puede deshacer y borrará todo su historial.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        closeDialog();
        try {
          await deleteLoan(prestamo.id);
          onClose();
        } catch (err) {
          showNotification('Error al eliminar', err.response?.data?.message || err.message, 'danger');
        }
      },
    });
  };

  const handleAbonoCapitalSubmit = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbonoCapital);
    if (!monto || monto <= 0 || monto > prestamo.capitalActual) {
      showNotification('Monto inválido', 'Por favor ingresa un monto válido mayor a 0 y menor o igual al capital actual.', 'warning');
      return;
    }

    try {
      await abonarCapital(prestamo.id, monto);
      setMontoAbonoCapital('');
      setShowAbonoCapital(false);
      setMensajeExito(`Devolución de capital de ${formatCurrency(monto)} registrada. Interés mensual recalculado.`);
      setTimeout(() => setMensajeExito(''), 3500);
    } catch (err) {
      showNotification('Error en abono', err.response?.data?.message || err.message, 'danger');
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-detail-custom"
        role="dialog"
        aria-modal="true"
      >
        {/* Header sobrio */}
        <div className="modal-header">
          <div>
            <span className="modal-badge-id">Entrega #{prestamo.id.toString().slice(-4)}</span>
            <h2 className="modal-title">{prestamo.referencia || 'Entrega de Capital'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Entregado el: {formatearFecha(prestamo.fechaInicio)}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mensaje de confirmación temporal */}
          {mensajeExito && (
            <div className="modal-success-banner">
              {mensajeExito}
            </div>
          )}

          {/* Resumen financiero sobrio */}
          <div className="loan-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Capital Entregado</span>
              <span className="detail-value">{formatCurrency(prestamo.capitalActual)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Interés Mensual</span>
              <span className="detail-value detail-success">
                {formatCurrency(prestamo.interesMensual)} ({prestamo.tasaInteres}%)
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha de Cobro</span>
              <span className="detail-value" style={{ color: 'var(--color-accent)' }}>
                Todos los días {prestamo.diaCobro}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Para Liquidar (Total)</span>
              <span className="detail-value">
                {prestamo.estado === 'liquidado' ? 'Liquidado' : formatCurrency(totalLiquidacion)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Intereses ya Cobrados</span>
              <span className="detail-value">{formatCurrency(totalInteresesGanados)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <span className={`badge ${prestamo.estado === 'al_dia' ? 'badge-success' : prestamo.estado === 'atrasado' ? 'badge-danger' : 'badge-muted'}`}>
                {prestamo.estado === 'al_dia' ? 'Al día' : prestamo.estado === 'atrasado' ? 'Cobro Atrasado' : 'Liquidado'}
              </span>
            </div>
          </div>

          {/* Indicador de estado de cobro */}
          {prestamo.estado !== 'liquidado' && (
            <div className={`cobro-status-banner ${puedeCobrar ? 'cobro-status-ready' : 'cobro-status-paid'}`}>
              {puedeCobrar ? (
                <>
                  <Clock size={16} />
                  <span>
                    {cobroInfo.esAtrasado
                      ? `⚠️ Cobro atrasado — Pendiente: ${cobroInfo.nombreMesPorCobrar}`
                      : `Cobro disponible — ${cobroInfo.nombreMesPorCobrar} (día ${prestamo.diaCobro})`
                    }
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Cobro de este mes ya registrado — Próximo cobro: {cobroInfo.proximaFechaTexto}</span>
                </>
              )}
            </div>
          )}

          {/* Acciones de Cobro */}
          {prestamo.estado !== 'liquidado' ? (
            <div className="loan-actions-clean">
              <div className="actions-clean-grid">
                <button
                  type="button"
                  className={`btn-cobrar-clean ${!puedeCobrar ? 'btn-cobrar-disabled' : ''}`}
                  onClick={handleCobroInteres}
                  disabled={!puedeCobrar}
                  title={!puedeCobrar ? `Ya cobraste este mes. Próximo cobro: ${cobroInfo.proximaFechaTexto}` : `Cobrar interés de ${cobroInfo.nombreMesPorCobrar}`}
                >
                  {puedeCobrar
                    ? `Cobrar Interés (${formatCurrency(prestamo.interesMensual)})`
                    : `Ya cobrado ✓`
                  }
                </button>

                <button
                  type="button"
                  className="btn-liquidar-clean"
                  onClick={handleLiquidar}
                >
                  Liquidar Entrega ({formatCurrency(totalLiquidacion)})
                </button>
              </div>

              <div className="amortizar-toggle-wrap">
                <button
                  type="button"
                  className="btn-amortizar-toggle"
                  onClick={() => setShowAbonoCapital(!showAbonoCapital)}
                >
                  {showAbonoCapital ? 'Cancelar devolución de capital' : 'Devolver parte del capital (Amortizar)'}
                </button>
              </div>

              {showAbonoCapital && (
                <form className="amortizar-clean-box" onSubmit={handleAbonoCapitalSubmit}>
                  <label className="modal-form-label">
                    Monto de capital a devolver (Máx. {formatCurrency(prestamo.capitalActual)})
                  </label>
                  <div className="amortizar-row">
                    <input
                      type="number"
                      required
                      min="1"
                      max={prestamo.capitalActual}
                      step="any"
                      className="modal-form-input"
                      placeholder="Ej: 200"
                      value={montoAbonoCapital}
                      onChange={(e) => setMontoAbonoCapital(e.target.value)}
                    />
                    <button type="submit" className="btn-confirm-amortizar">
                      Aplicar
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="loan-closed-clean">
              Préstamo totalmente liquidado
            </div>
          )}

          {/* Historial de Cobros */}
          <div className="modal-history-section">
            <div className="modal-history-header">
              <h3 className="modal-history-title">Historial de Cobros</h3>
              <span className="modal-history-count">{prestamo.abonos.length}</span>
            </div>

            {prestamo.abonos.length === 0 ? (
              <p className="modal-history-empty">
                No hay cobros registrados aún.
              </p>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-clean-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th className="text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamo.abonos.map((abono) => (
                      <tr key={abono.id}>
                        <td className="history-date-col">{formatearFecha(abono.fecha)}</td>
                        <td>
                          <span className="history-concept">{abono.descripcion}</span>
                        </td>
                        <td className="text-right font-semibold">
                          {formatCurrency(abono.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Opción para eliminar registro */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-danger)',
                fontSize: '12px',
                cursor: 'pointer',
                opacity: 0.8,
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '1')}
              onMouseLeave={(e) => (e.target.style.opacity = '0.8')}
            >
              Eliminar esta entrega de dinero
            </button>
          </div>
        </div>
      </div>

      {/* Modal estético de confirmación y alerta */}
      <ConfirmModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={dialogState.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}
