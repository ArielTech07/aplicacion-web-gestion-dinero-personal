import { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, Percent } from 'lucide-react';
import { useLoans } from '../../context/LoanContext';
import './LoanDetailModal.css';

export default function NewLoanModal({ isOpen, onClose }) {
  const { settings, addLoan, formatCurrency, prestamosList } = useLoans();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTodayDay = () => new Date().getDate().toString();

  const [fechaEntrega, setFechaEntrega] = useState(getTodayStr());
  const [diaCobro, setDiaCobro] = useState(getTodayDay());
  const [capital, setCapital] = useState('1000');
  const [tasaInteres, setTasaInteres] = useState(settings.defaultRate.toString());
  const [referencia, setReferencia] = useState('');

  const overlayRef = useRef(null);
  const capitalInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const today = getTodayStr();
      setFechaEntrega(today);
      setDiaCobro(new Date().getDate().toString());
      setCapital('1000');
      setTasaInteres(settings.defaultRate.toString());
      setReferencia(`Entrega #${prestamosList.length + 1}`);
      setTimeout(() => capitalInputRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, settings.defaultRate, prestamosList.length]);

  if (!isOpen) return null;

  // Al cambiar la fecha de entrega, auto-actualizar el día de cobro mensual
  const handleFechaChange = (e) => {
    const val = e.target.value;
    setFechaEntrega(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const dia = parseInt(parts[2], 10);
        if (!isNaN(dia) && dia >= 1 && dia <= 31) {
          setDiaCobro(dia.toString());
        }
      }
    }
  };

  const capitalNum = parseFloat(capital) || 0;
  const tasaNum = parseFloat(tasaInteres) || 0;
  const interesEstimado = Math.round(capitalNum * (tasaNum / 100));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (capitalNum <= 0) return;

    const nuevaEntrega = {
      referencia: referencia.trim() || `Entrega #${prestamosList.length + 1}`,
      distribuidor: 'Distribuidor',
      capital: capitalNum,
      tasaInteres: tasaNum,
      diaCobro: parseInt(diaCobro, 10) || 21,
      fechaInicio: fechaEntrega || getTodayStr(),
    };

    addLoan(nuevaEntrega);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-animated"
        role="dialog"
        aria-modal="true"
      >
        {/* Header sobrio y limpio */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Nueva Entrega de Capital</h2>
            <p className="modal-subtitle">
              Registra el dinero entregado al distribuidor y su fecha de cobro mensual
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form className="modal-body modal-form" onSubmit={handleSubmit}>
          {/* Fecha de entrega y Día de Cobro */}
          <div className="form-two-columns">
            <div className="modal-form-group">
              <label htmlFor="nueva-fecha" className="modal-form-label">
                Fecha de Entrega
              </label>
              <input
                id="nueva-fecha"
                type="date"
                required
                className="modal-form-input"
                value={fechaEntrega}
                onChange={handleFechaChange}
              />
            </div>

            <div className="modal-form-group">
              <label htmlFor="nuevo-dia" className="modal-form-label">
                Día de Cobro Mensual
              </label>
              <input
                id="nuevo-dia"
                type="number"
                min="1"
                max="31"
                required
                className="modal-form-input"
                placeholder="21"
                value={diaCobro}
                onChange={(e) => setDiaCobro(e.target.value)}
              />
            </div>
          </div>

          {/* Capital entregado */}
          <div className="modal-form-group">
            <label htmlFor="nuevo-capital" className="modal-form-label">
              Capital Entregado ({settings.currency})
            </label>
            <input
              ref={capitalInputRef}
              id="nuevo-capital"
              type="number"
              required
              min="50"
              step="any"
              className="modal-form-input"
              placeholder="1000"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
            />
          </div>

          {/* Tasa y Referencia */}
          <div className="form-two-columns">
            <div className="modal-form-group">
              <label htmlFor="nueva-tasa" className="modal-form-label">
                Tasa Mensual (%)
              </label>
              <input
                id="nueva-tasa"
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                required
                className="modal-form-input"
                placeholder="10"
                value={tasaInteres}
                onChange={(e) => setTasaInteres(e.target.value)}
              />
            </div>

            <div className="modal-form-group">
              <label htmlFor="nueva-referencia" className="modal-form-label">
                Referencia (opcional)
              </label>
              <input
                id="nueva-referencia"
                type="text"
                className="modal-form-input"
                placeholder="Ej: Entrega #1 o Nota"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
            </div>
          </div>

          {/* Botón de acción */}
          <div className="modal-form-actions">
            <button type="submit" className="modal-form-submit">
              Guardar Entrega de Capital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
