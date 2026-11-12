import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoanProvider } from './context/LoanContext';
import Sidebar from './components/layout/Sidebar';
import ContentArea from './components/layout/ContentArea';
import Dashboard from './pages/Dashboard';
import Prestamos from './pages/Prestamos';
import LoginPage from './pages/LoginPage';

const pageConfig = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Resumen de capital entregado al distribuidor e intereses a cobrar',
  },
  prestamos: {
    title: 'Préstamos Activos',
    subtitle: 'Control de entregas de capital y fechas de cobro mensual',
  },
};

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePageChange = (pageId) => {
    setActivePage(pageId);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'prestamos':
        return <Prestamos />;
      default:
        return <Dashboard />;
    }
  };

  const { title, subtitle } = pageConfig[activePage] || pageConfig.dashboard;

  return (
    <>
      <Sidebar
        activePage={activePage}
        onNavigate={handlePageChange}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <ContentArea
        title={title}
        subtitle={subtitle}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      >
        {renderPage()}
      </ContentArea>
    </>
  );
}

// Componente que decide si mostrar Login o la App principal
function AppRouter() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <LoanProvider>
      <AppContent />
    </LoanProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
