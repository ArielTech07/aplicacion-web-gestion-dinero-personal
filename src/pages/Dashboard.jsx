import { useState } from 'react';
import { Plus } from 'lucide-react';
import SummaryCards from '../components/dashboard/SummaryCards';
import LoansTable from '../components/dashboard/LoansTable';
import LoanDetailModal from '../components/modals/LoanDetailModal';
import NewLoanModal from '../components/modals/NewLoanModal';
import { useLoans } from '../context/LoanContext';

export default function Dashboard() {
  const { prestamosList } = useLoans();
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);

  // Filtrar solo las entregas activas (excluir liquidadas o con capital 0)
  const prestamosActivos = prestamosList.filter(
    (p) => p.capitalActual > 0 && p.estado !== 'liquidado'
  );

  const selectedLoan = prestamosList.find((p) => p.id === selectedLoanId) || null;

  return (
    <>
      <SummaryCards />

      <div className="dashboard-actions">
        <button
          className="btn-new-loan"
          onClick={() => setIsNewLoanOpen(true)}
        >
          <Plus size={20} strokeWidth={2} />
          Nueva Entrega de Capital
        </button>
      </div>

      <LoansTable
        prestamos={prestamosActivos}
        title="Entregas Activas al Distribuidor"
        onSelectLoan={(loan) => setSelectedLoanId(loan.id)}
      />

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
    </>
  );
}
