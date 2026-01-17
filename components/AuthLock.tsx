import React, { useState, useEffect } from 'react';
import { loginWithPassword, isSessionValid } from '../services/apiClient';

interface Props {
  onUnlock: () => void;
  onClearAllData?: () => void;
}

export const AuthLock: React.FC<Props> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already has valid session
    if (isSessionValid()) {
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setMessage('');
    setError(false);

    const result = await loginWithPassword(password);

    if (result.success) {
      onUnlock();
    } else {
      setError(true);
      setMessage(result.error || 'Login gagal');
      setPassword('');
      setTimeout(() => {
        setError(false);
        setMessage('');
      }, 3000);
    }

    setLoading(false);
  };

  return (
    <div className="auth-lock-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-icon">🔐</div>
        <h2 className="auth-title">Dompet Pro</h2>
        <p className="auth-subtitle">Secure Finance Manager</p>
        
        {/* Status message */}
        {message && (
          <div className={`auth-message ${error ? 'error' : ''}`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className={`password-input ${error ? 'shake' : ''}`}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !password.trim()}
          >
            {loading ? '⏳ Verifying...' : '🔓 Login'}
          </button>
        </form>

        <p className="auth-footer">v4.2 • Secure Access</p>
      </div>

      <style>{`
        .auth-lock-container {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #e8eef5 0%, #d5dde8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }
        
        .dark .auth-lock-container {
          background: linear-gradient(135deg, #1a1d21 0%, #0f1114 100%);
        }

        .auth-card {
          background: #e0e5ec;
          border-radius: 28px;
          padding: 32px;
          width: 100%;
          max-width: 340px;
          box-shadow: 
            10px 10px 20px #c8cdd4,
            -10px -10px 20px #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .dark .auth-card {
          background: #1e2227;
          box-shadow: 
            10px 10px 20px #0a0b0d,
            -10px -10px 20px #2a2f36;
        }

        .auth-icon {
          width: 64px;
          height: 64px;
          background: #e0e5ec;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 16px;
          box-shadow: 
            4px 4px 8px #c8cdd4,
            -4px -4px 8px #ffffff;
        }
        
        .dark .auth-icon {
          background: #1e2227;
          box-shadow: 
            4px 4px 8px #0a0b0d,
            -4px -4px 8px #2a2f36;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 800;
          color: #2d3748;
          margin: 0;
        }
        
        .dark .auth-title {
          color: #f7fafc;
        }

        .auth-subtitle {
          font-size: 12px;
          color: #718096;
          margin: 4px 0 20px 0;
        }
        
        .dark .auth-subtitle {
          color: #a0aec0;
        }

        .auth-message {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          width: 100%;
          text-align: center;
        }

        .auth-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .password-field {
          position: relative;
          width: 100%;
        }

        .password-input {
          width: 100%;
          padding: 14px 50px 14px 16px;
          border: none;
          border-radius: 14px;
          background: #e0e5ec;
          color: #2d3748;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 
            inset 3px 3px 6px #c8cdd4,
            inset -3px -3px 6px #ffffff;
          transition: all 0.2s ease;
        }
        
        .dark .password-input {
          background: #1e2227;
          color: #f7fafc;
          box-shadow: 
            inset 3px 3px 6px #0a0b0d,
            inset -3px -3px 6px #2a2f36;
        }

        .password-input::placeholder {
          color: #a0aec0;
        }

        .password-input:focus {
          outline: none;
          box-shadow: 
            inset 3px 3px 6px #c8cdd4,
            inset -3px -3px 6px #ffffff,
            0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .password-input.shake {
          animation: shake 0.4s ease-in-out;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }

        .login-button {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 24px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #a0aec0;
          font-weight: 700;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};
