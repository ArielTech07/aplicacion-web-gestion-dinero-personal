import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useLoans } from '../../context/LoanContext';
import './SummaryCards.css';

export default function SummaryCards() {
  const { metrics, formatCurrency } = useLoans();

  const cardConfig = [
    {
      key: 'capitalEnLaCalle',
      title: 'Capital Colocado (Distribuidor)',
      icon: DollarSign,
      accentClass: 'accent-indigo',
      value: formatCurrency(metrics.capitalEnLaCalle),
      hint: 'Total entregado pendiente de devolución',
    },
    {
      key: 'interesesDelMes',
      title: 'Ganancia del Mes (Intereses)',
      icon: TrendingUp,
      accentClass: 'accent-green',
      value: formatCurrency(metrics.interesesDelMes),
      hint: 'Rédito mensual acordado a cobrar',
    },
    {
      key: 'proximosCobros',
      title: 'Cobros del Mes',
      icon: Calendar,
      accentClass: 'accent-amber',
      value: `${metrics.proximosCobros} cobro${metrics.proximosCobros !== 1 ? 's' : ''}`,
      hint: 'Pendientes o por vencer en sus fechas',
    },
  ];

  return (
    <div className="summary-cards">
      {cardConfig.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className={`summary-card ${card.accentClass}`}>
            <div className="summary-card-header">
              <div className="summary-card-icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <span className="summary-card-title">{card.title}</span>
            </div>
            <div className="summary-card-value">{card.value}</div>
            <div className="summary-card-hint" style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              {card.hint}
            </div>
          </div>
        );
      })}
    </div>
  );
}
