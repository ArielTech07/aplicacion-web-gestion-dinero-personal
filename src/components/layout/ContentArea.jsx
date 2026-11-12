import { Menu } from 'lucide-react';
import './ContentArea.css';

export default function ContentArea({ title, subtitle, onOpenMobileMenu, children }) {
  return (
    <main className="content-area">
      {/* Barra superior visible solo en móviles */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-topbar-title">
          <span>Gestión Dinero</span>
        </div>
      </div>

      <header className="content-header">
        <h1 className="content-title">{title}</h1>
        {subtitle && <p className="content-subtitle">{subtitle}</p>}
      </header>

      <div className="content-body">{children}</div>
    </main>
  );
}
