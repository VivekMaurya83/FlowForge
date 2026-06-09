import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success } = await login(email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="landing-bg">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="bg-grid-overlay" />
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo" style={{ width: 48, height: 48, margin: '0 auto 1.25rem' }}>
              <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#dbLogoGrad)" />
                <path d="M8 14 L12 10 L16 14 L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 18 L12 14 L16 18 L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
            </div>
            <h2>Welcome back</h2>
            <p>Log in to your FlowForge account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">⚠ {error}</div>}
            
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" placeholder="you@example.com" required 
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" placeholder="••••••••" required 
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <button type="submit" className="cta-primary auth-submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up for free</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
