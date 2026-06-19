/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Users, Package, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Auth from './components/Auth';
import Landing from './components/Landing';
import { API_URL } from './utils/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getInitials = (name) => {
    if (!name) return '??';
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const palette = ['#a3e635', '#e6e3e0', '#10b981', '#f59e0b', '#ef4444', '#71717a', '#bef264', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  };
  const [toasts, setToasts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!token);
  const [showAuth, setShowAuth] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState('signin');

  // Show a visual notification toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Verify token and fetch profile
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    const loadUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Session expired');
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        showToast('Your session has expired. Please sign in again.', 'error');
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [token]);

  // Global auth expiration listener
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      showToast('Your session has expired. Please sign in again.', 'error');
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth_expired', handleAuthExpired);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setShowAuth(false);
    showToast('Logged out successfully.');
  };

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading session profiles...</p>
      </div>
    );
  }

  if (!token) {
    if (showAuth) {
      return (
        <>
          <Auth
            initialView={initialAuthTab}
            onBackToHome={() => setShowAuth(false)}
            onLoginSuccess={(newToken) => {
              localStorage.setItem('token', newToken);
              setToken(newToken);
            }}
            showToast={showToast}
          />
          {/* Toast Drawer for Auth */}
          <div className="toast-container">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`toast toast-${toast.type}`}
                onClick={() => removeToast(toast.id)}
                style={{ cursor: 'pointer' }}
              >
                {toast.type === 'error' && <AlertCircle size={18} />}
                <span>{toast.message}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    return (
      <Landing
        onGetStarted={() => {
          setInitialAuthTab('signup');
          setShowAuth(true);
        }}
        onSignIn={() => {
          setInitialAuthTab('signin');
          setShowAuth(true);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/inventory-management-app_hero-img.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain' }} />
          <span className="gradient-text" style={{ fontSize: '1.4rem' }}>Ethara Stock</span>
        </div>

        <nav>
          <ul className="sidebar-menu">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('products')}
                className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <Package size={20} />
                <span>Products</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('customers')}
                className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <Users size={20} />
                <span>Customers</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('orders')}
                className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <ShoppingCart size={20} />
                <span>Orders</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* User Profile & Sign Out Panel */}
        <div className="sidebar-profile-panel" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <div
              className="crm-avatar"
              style={{
                width: '36px',
                height: '36px',
                fontSize: '0.8rem',
                backgroundColor: getAvatarColor(user?.username || 'user'),
                flexShrink: 0
              }}
            >
              {getInitials(user?.username || 'US')}
            </div>
            <div className="sidebar-profile-info" style={{ minWidth: 0, flexGrow: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {user?.username || 'Loading...'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {user?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-signout-btn"
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', gap: '1rem', color: 'var(--danger)', cursor: 'pointer', padding: '0.75rem 1.25rem' }}
          >
            <LogOut size={20} />
            <span className="sidebar-signout-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard showToast={showToast} setActiveTab={setActiveTab} />}
        {activeTab === 'products' && <Products showToast={showToast} />}
        {activeTab === 'customers' && <Customers showToast={showToast} />}
        {activeTab === 'orders' && <Orders showToast={showToast} />}
      </main>

      {/* Toast Alert Drawer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            {toast.type === 'error' && <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
