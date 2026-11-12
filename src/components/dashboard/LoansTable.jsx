import { useLoans } from '../../context/LoanContext';
import { formatearFecha } from '../../data/mockData';
import './LoansTable.css';

const estadoBadge = {
  al_dia: { label: 'Al día', className: 'badge-success' },
  atrasado: { label: 'Cobro Atrasado', className: 'badge-danger' },
  liquidado: { label: 'Liquidado', className: 'badge-muted' },
};

export default function LoansTable({ prestamos, onSelectLoan, title = 'Entregas de Capital Activas' }) {
  const { prestamosList, formatCurrency } = useLoans();
  const data = prestamos || prestamosList.filter((p) => p.capitalActual > 0 && p.estado !== 'liquidado');

  return (
    <div className="loans-table-wrapper">
      <div className="loans-table-header">
        <h2 className="loans-table-title">{title}</h2>
        <span className="loans-table-count">
          {data.length} entrega{data.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="loans-table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th>Entrega / Referencia</th>
              <th>Capital Entregado</th>
              <th>Interés Mensual</th>
              <th>Día de Cobro</th>
              <th>Total Liquidación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  No hay entregas de capital registradas.
                </td>
              </tr>
            ) : (
              data.map((prestamo) => {
                const badge = estadoBadge[prestamo.estado] || estadoBadge.al_dia;
                const totalLiquidacion = prestamo.capitalActual + prestamo.interesMensual;

                return (
                  <tr
                    key={prestamo.id}
                    className="loans-table-row"
                    onClick={() => onSelectLoan(prestamo)}
                  >
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
                    <td className="cell-saldo" style={{ fontWeight: 600 }}>
                      {prestamo.estado === 'liquidado' ? (
                        <span style={{ color: 'var(--color-text-muted)' }}>Liquidado</span>
                      ) : (
                        formatCurrency(totalLiquidacion)
                      )}
                    </td>
                    <td className="cell-estado">
                      <span className={`badge ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
