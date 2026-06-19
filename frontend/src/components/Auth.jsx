/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect } from 'react';
import { Package, Lock, Mail, User, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../utils/api';

function Auth({ onLoginSuccess, showToast, onBackToHome, initialView = 'signin' }) {
  const [view, setView] = useState(initialView); // signin, signup, forgot, reset
  const [loading, setLoading] = useState(false);
  
  // Forms state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if a reset token is present in URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset-token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  // Calculate Password Strength (0 to 4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return { label: 'None', color: 'var(--text-muted)' };
      case 1: return { label: 'Weak', color: 'var(--danger-hover)' };
      case 2: return { label: 'Fair', color: 'var(--warning)' };
      case 3: return { label: 'Good', color: 'var(--primary)' };
      case 4: return { label: 'Strong', color: 'var(--success)' };
      default: return { label: 'None', color: 'var(--text-muted)' };
    }
  };

  const pwdStrength = getPasswordStrength(password);
  const strengthInfo = getStrengthLabel(pwdStrength);

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed.');

      showToast('Logged in successfully!');
      onLoginSuccess(data.access_token);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      showToast('All fields are required.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed.');

      showToast('Registration successful! Please sign in.');
      setView('signin');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed.');

      showToast(data.message || 'Verification email has been sent.');
      setView('signin');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      showToast('Both fields are required.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          new_password: password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed.');

      showToast(data.message || 'Password reset successfully.');
      // Remove query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setView('signin');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginCallback = async (response) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_token: response.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google Login failed.');

      showToast('Logged in with Google successfully!');
      onLoginSuccess(data.access_token);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = () => {
    showToast('Bypassing Google OAuth via simulated mock token...');
    handleGoogleLoginCallback({ credential: 'mock_token' });
  };

  // Google OAuth2 Button rendering
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (clientId && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginCallback
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
        );
      } catch (err) {
        console.error('Google ID initialization failed:', err);
      }
    }
  }, [view]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2.5rem 1.5rem',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.08) 0px, transparent 50%)',
      position: 'relative'
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '25%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 60%)',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '3rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg), 0 25px 50px -12px rgba(0,0,0,0.7)',
        background: 'rgba(12, 15, 29, 0.8)',
        zIndex: 1,
        border: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        {onBackToHome && (
          <button 
            type="button" 
            onClick={onBackToHome}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.85rem', 
              marginBottom: '2rem',
              padding: 0,
              transition: 'color var(--transition-fast)'
            }}
            className="sidebar-link-back"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        )}
        
        {/* Logo/Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div className="kpi-icon-wrapper primary" style={{ width: '52px', height: '52px', borderRadius: '12px', marginBottom: '0.85rem', boxShadow: 'var(--shadow-glow)' }}>
            <Package size={26} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem', fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '-0.03em' }}>Ethara Stock</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Secure Inventory & Order Manager</p>
        </div>

        {/* View switching logic */}

        {view === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="auth-username">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  id="auth-username"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', width: '100%' }}
                  placeholder="admin or email@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label htmlFor="auth-password" style={{ margin: 0 }}>Password</label>
                <button type="button" onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-password"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', paddingRight: '2.85rem', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="reg-username">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  id="reg-username"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', width: '100%' }}
                  placeholder="Choose username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  id="reg-email"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', width: '100%' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="reg-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="reg-password"
                    className="form-input"
                    style={{ paddingLeft: '2.85rem', paddingRight: '2.5rem', width: '100%' }}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="reg-confirm">Confirm</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="reg-confirm"
                    className="form-input"
                    style={{ paddingLeft: '2.85rem', paddingRight: '2.5rem', width: '100%' }}
                    placeholder="Repeat pwd"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', animation: 'pageEnter 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                  <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 1 ? 'var(--danger-hover)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 2 ? 'var(--warning)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 3 ? 'var(--primary)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 4 ? 'var(--success)' : 'rgba(255,255,255,0.08)' }} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'center' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="forgot-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  id="forgot-email"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', width: '100%' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
            </button>

            <button type="button" onClick={() => setView('signin')} className="btn btn-secondary" style={{ width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'center' }}>
              Enter a new secure password for your account.
            </p>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="reset-pass">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="reset-pass"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', paddingRight: '2.5rem', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="reset-confirm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="reset-confirm"
                  className="form-input"
                  style={{ paddingLeft: '2.85rem', paddingRight: '2.5rem', width: '100%' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Strength indicator */}
            {password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                  <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 1 ? 'var(--danger-hover)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 2 ? 'var(--warning)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 3 ? 'var(--primary)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="pwd-strength-bar" style={{ backgroundColor: pwdStrength >= 4 ? 'var(--success)' : 'rgba(255,255,255,0.08)' }} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}

        {/* Google sign-in and dividers for login/signup */}
        {(view === 'signin' || view === 'signup') && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '2.25rem 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 1rem' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {googleClientId ? (
              <div id="google-signin-btn" style={{ width: '100%' }}></div>
            ) : (
              <button
                type="button"
                onClick={handleMockGoogleLogin}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  fontSize: '0.95rem',
                  padding: '0.85rem'
                }}
                disabled={loading}
              >
                {/* SVG for Google Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google Account (Simulated)</span>
              </button>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
              {view === 'signin' ? (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setView('signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Sign Up
                  </button>
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setView('signin')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
