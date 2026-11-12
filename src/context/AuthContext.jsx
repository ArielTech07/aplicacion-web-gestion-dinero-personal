import { createContext, useContext, useState, useEffect } from 'react';
import { usuariosApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Inicializa con el usuario guardado en sesión previa (si existe)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gd_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Sincroniza con localStorage para recordar la sesión al recargar la página
  useEffect(() => {
    if (user) {
      localStorage.setItem('gd_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gd_auth_user');
      localStorage.removeItem('gd_jwt_token');
    }
  }, [user]);

  // Escucha evento global de cierre de sesión (ej: token JWT expirado)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // Iniciar sesión contra el backend (POST /api/usuarios/login) con JWT
  const login = async (email, password) => {
    setLoading(true);
    setAuthError('');
    try {
      const responseData = await usuariosApi.login(email, password);
      // Guardar el token JWT devuelto por Spring Security
      if (responseData.token) {
        localStorage.setItem('gd_jwt_token', responseData.token);
      }
      setUser(responseData);
      return { success: true, user: responseData };
    } catch (err) {
      const mensaje =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Correo o contraseña incorrectos'
          : 'No se pudo conectar con el servidor');
      setAuthError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = () => {
    setUser(null);
    setAuthError('');
    localStorage.removeItem('gd_auth_user');
    localStorage.removeItem('gd_jwt_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        setAuthError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

