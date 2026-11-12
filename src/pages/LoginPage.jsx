import { useState, useRef, useEffect } from 'react';
import { Banknote, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loading, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Limpiar error al escribir
  useEffect(() => {
    if (authError) setAuthError('');
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await login(email.trim(), password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo y título */}
        <div className="login-header">
          <div className="login-logo">
            <Banknote size={32} strokeWidth={1.8} />
          </div>
          <h1 className="login-title">GestiónDinero</h1>
          <p className="login-subtitle">Inicia sesión para acceder a tu panel</p>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Error */}
          {authError && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          {/* Campo Email */}
          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón de Login */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="login-spinner" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

