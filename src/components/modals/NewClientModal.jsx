import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLoans } from '../../context/LoanContext';
import './LoanDetailModal.css';

export default function NewClientModal({ isOpen, onClose }) {
  const { addClient } = useLoans();
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');

  const overlayRef = useRef(null);
  const inputRef = useRef(null);

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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim()) return;

    const nuevoCliente = {
      id: Date.now(),
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim() || 'No especificado',
    };

    addClient(nuevoCliente);
    onClose();
    setNombre('');
    setCedula('');
    setTelefono('');
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="modal-content modal-animated" role="dialog" aria-modal="true">
        {/* Header sobrio y limpio */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Nuevo Cliente</h2>
            <p className="modal-subtitle">
              Registra un prestatario para asociarle préstamos
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label htmlFor="nombre-cliente" className="modal-form-label">
              Nombre Completo
            </label>
            <input
              ref={inputRef}
              id="nombre-cliente"
              type="text"
              required
              className="modal-form-input"
              placeholder="Ej: Roberto Almonte Quispe"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="modal-form-group">
            <label htmlFor="cedula-cliente" className="modal-form-label">
              DNI / Documento de Identidad
            </label>
            <input
              id="cedula-cliente"
              type="text"
              required
              className="modal-form-input"
              placeholder="Ej: 72345678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <div className="modal-form-group">
            <label htmlFor="tel-cliente" className="modal-form-label">
              Teléfono de Contacto
            </label>
            <input
              id="tel-cliente"
              type="tel"
              className="modal-form-input"
              placeholder="Ej: 987-654-321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="modal-form-actions" style={{ marginTop: '10px' }}>
            <button type="submit" className="modal-form-submit">
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
