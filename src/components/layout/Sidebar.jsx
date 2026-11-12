import {
  LayoutDashboard,
  Banknote,
  Sun,
  Moon,
  CircleUserRound,
  LogOut,
  X,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLoans } from "../../context/LoanContext";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "prestamos", label: "Préstamos Activos", icon: Banknote },
];

export default function Sidebar({
  activePage,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) {
  const { theme, toggleTheme } = useTheme();
  const { settings } = useLoans();
  const { user, logout } = useAuth();

  const handleItemClick = (id) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop overlay para móviles */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Banknote size={26} strokeWidth={2} />
            </div>
            <span className="sidebar-brand">Gestión Dinero</span>
          </div>
          {/* Botón de cierre para móviles */}
          <button
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === "light" ? "Modo oscuro" : "Modo claro"}</span>
          </button>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <CircleUserRound size={34} strokeWidth={1.5} />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.nombre || settings.adminName}
              </span>
              <span className="sidebar-user-role">{settings.adminRole}</span>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
