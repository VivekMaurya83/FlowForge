import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Sparkles, History, Download, GitPullRequest } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  useEffect(() => {
    // If user is already logged in, seamlessly redirect them to dashboard
    // No need to show landing page if they are returning active users
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="landing-page">
      {/* Dynamic Background */}
      <div className="landing-bg">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
        <div className="bg-grid-overlay" />
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <div className="brand-logo" style={{ width: 32, height: 32 }}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#dbLogoGrad)" />
              <path d="M8 14 L12 10 L16 14 L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 18 L12 14 L16 18 L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <defs>
                <linearGradient id="dbLogoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name" style={{ color: 'white' }}>FlowForge</span>
          <span className="brand-ai">AI</span>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-login-btn" onClick={() => navigate('/login')}>Log In</button>
          <button className="landing-signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Architect the <br/>
              <span className="text-gradient">Future with AI</span>
            </h1>
            <p className="hero-subtitle">
              Describe your system architecture in plain English. Watch as Gemini 3 Flash instantly generates, connects, and arranges complex technical diagrams.
            </p>
            <div className="hero-cta-group">
              <button className="cta-primary" onClick={() => navigate('/signup')}>
                Get Started Free
                <span className="cta-arrow">→</span>
              </button>
              <button className="cta-secondary" onClick={() => navigate('/login')}>
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Floating Mockup Preview */}
          <div className="hero-mockup-wrapper">
            <div className="floating-mockup">
              <div className="mockup-header">
                <span className="dot dot-r"></span>
                <span className="dot dot-y"></span>
                <span className="dot dot-g"></span>
              </div>
              <div className="mockup-body">
                <div className="mock-node node-a" />
                <div className="mock-node node-b" />
                <div className="mock-node node-c" />
                <svg className="mock-lines" width="100%" height="100%">
                  <path d="M 60 70 C 100 70, 100 40, 140 40" stroke="#6366f1" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                  <path d="M 60 70 C 100 70, 100 100, 140 100" stroke="#6366f1" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                </svg>
              </div>
              <div className="mockup-prompt">
                <Sparkles size={14} className="sparkle-icon" />
                <span>"Add a Redis caching layer between API and DB"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="section-header">
            <h2>Everything you need to design systems</h2>
            <p>Built for engineers, powered by Gemini.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Sparkles size={24} /></div>
              <h3>AI Generation</h3>
              <p>Type your requirements and let Gemini 3 Flash generate the nodes, edges, and layouts automatically.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper"><GitPullRequest size={24} /></div>
              <h3>Iterative Editing</h3>
              <p>Chat with your diagram. Ask AI to "Add auth" and it updates the canvas without destroying your manual layout.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper"><History size={24} /></div>
              <h3>Version History</h3>
              <p>Never lose work. Travel back in time through unlimited saved versions of your architecture.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Download size={24} /></div>
              <h3>Instant Exports</h3>
              <p>Export pixel-perfect PNGs for presentations, scalable SVGs for docs, or raw JSON data.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
