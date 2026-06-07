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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', width: '300px' }}>
        <h2 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Login to FlowForge</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '14px' }}>{error}</div>}
        
        <input 
          type="email" placeholder="Email" required 
          value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', background: '#334155', border: 'none', color: 'white', borderRadius: '4px' }} 
        />
        <input 
          type="password" placeholder="Password" required 
          value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', background: '#334155', border: 'none', color: 'white', borderRadius: '4px' }} 
        />
        
        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/signup" style={{ color: '#94a3b8', fontSize: '14px' }}>Need an account? Sign up</Link>
        </div>
      </form>
    </div>
  );
}
