import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useLoans } from '../context/LoanContext';
import { formatearFecha } from '../data/mockData';
import LoanDetailModal from '../components/modals/LoanDetailModal';
import NewLoanModal from '../components/modals/NewLoanModal';
import './Prestamos.css';

const estadoBadge = {
  al_dia: { label: 'Al día', className: 'badge-success' },
  atrasado: { label: 'Cobro Atrasado', className: 'badge-danger' },
  liquidado: { label: 'Liquidado', className: 'badge-muted' },
};

export default function Prestamos() {
  const { prestamosList, formatCurrency } = useLoans();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);

  const filteredPrestamos = prestamosList.filter((p) => {
    const matchesStatus =
      statusFilter === 'todos' ? true : p.estado === statusFilter;

    const ref = (p.referencia || '').toLowerCase();
    const id = p.id.toString();
    const search = searchTerm.toLowerCase();

    const matchesSearch = ref.includes(search) || id.includes(search);

    return matchesStatus && matchesSearch;
  });

  const selectedLoan = prestamosList.find((p) => p.id === selectedLoanId) || null;

  const counts = {
    todos: prestamosList.length,
    al_dia: prestamosList.filter((p) => p.estado === 'al_dia').length,
    atrasado: prestamosList.filter((p) => p.estado === 'atrasado').length,
    liquidado: prestamosList.filter((p) => p.estado === 'liquidado').length,
  };

  return (
    <div className="prestamos-page">
      {/* Barra de herramientas superior */}
      <div className="prestamos-toolbar">
        {/* Pestañas de estado */}
        <div className="status-tabs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'al_dia', label: 'Al día' },
            { id: 'atrasado', label: 'Cobros Atrasados' },
            { id: 'liquidado', label: 'Liquidados' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`status-tab ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="tab-count">{counts[tab.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* Botón nueva entrega de capital */}
        <button
          className="btn-new-loan"
          onClick={() => setIsNewLoanOpen(true)}
        >
          <Plus size={18} strokeWidth={2} />
          Nueva Entrega de Capital
        </button>
      </div>

      {/* Buscador */}
      <div className="prestamos-search-row">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla detallada de préstamos */}
      <div className="loans-table-wrapper">
        <div className="loans-table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Entrega / Referencia</th>
                <th>Capital Entregado</th>
                <th>Interés Mensual</th>
                <th>Día de Cobro</th>
                <th>Intereses Cobrados</th>
                <th>Total Liquidación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestamos.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No se encontraron entregas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPrestamos.map((prestamo) => {
                  const badge = estadoBadge[prestamo.estado] || estadoBadge.al_dia;
                  const totalLiquidacion = prestamo.capitalActual + prestamo.interesMensual;
                  const interesesCobrados = prestamo.abonos
                    .filter((a) => a.tipo === 'interes')
                    .reduce((sum, a) => sum + a.monto, 0);

                  return (
                    <tr
                      key={prestamo.id}
                      className="loans-table-row"
                      onClick={() => setSelectedLoanId(prestamo.id)}
                    >
                      <td className="cell-id">
                        <span className="loan-id-tag">#{prestamo.id.toString().slice(-4)}</span>
                      </td>
                      <td className="cell-cliente">
                        <span className="cliente-nombre">
                          {prestamo.referencia || `Entrega #${prestamo.id.toString().slice(-4)}`}
                        </span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Entregado: {formatearFecha(prestamo.fechaInicio)}
                        </span>
                      </td>
                      <td className="cell-monto">
                        {formatCurrency(prestamo.capitalActual)}
                      </td>
                      <td className="cell-interes" style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                        {formatCurrency(prestamo.interesMensual)}
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                          ({prestamo.tasaInteres}%)
                        </span>
                      </td>
                      <td className="cell-dia" style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                        Todos los {prestamo.diaCobro}
                      </td>
                      <td className="cell-ganado" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {formatCurrency(interesesCobrados)}
                      </td>
                      <td className="cell-saldo" style={{ fontWeight: 600 }}>
                        {prestamo.estado === 'liquidado' ? (
                          <span style={{ color: 'var(--color-text-muted)' }}>Liquidado</span>
                        ) : (
                          formatCurrency(totalLiquidacion)
                        )}
                      </td>
                      <td className="cell-estado">
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {selectedLoan && (
        <LoanDetailModal
          prestamo={selectedLoan}
          onClose={() => setSelectedLoanId(null)}
        />
      )}

      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => setIsNewLoanOpen(false)}
      />
    </div>
  );
}
