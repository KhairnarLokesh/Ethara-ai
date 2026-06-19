import { useState } from 'react';
import { 
  Package, ShieldCheck, Zap, Mail, LayoutDashboard, ShoppingCart, 
  Users, ArrowRight, Check, Search, AlertTriangle, ArrowUpRight, ChevronDown
} from 'lucide-react';

function Landing({ onGetStarted, onSignIn }) {
  // Simulated Interactive States
  const [activeMockupTab, setActiveMockupTab] = useState('overview'); // overview, alerts, catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, annual
  const [activeFaq, setActiveFaq] = useState(null);

  const FAQ_ITEMS = [
    { 
      q: 'How do SMTP Low Stock alerts function?', 
      a: 'Once configured with your SMTP server, the system monitors sales. The moment an order reduces a product\'s stock count below your threshold (e.g. 10 units), an automated notification is instantly dispatched to your operations email.' 
    },
    { 
      q: 'Can I import and export my customer and product list?', 
      a: 'Absolutely. The platform supports clean JSON/CSV payloads via standard API routes, allowing integrations with your existing storefronts, ERPs, or custom fulfillment pipelines.' 
    },
    { 
      q: 'Does it support Single Sign-On (SSO)?', 
      a: 'Yes. Secure authentication can be done using standard email accounts hashed with bcrypt, or directly in one click using Google OAuth2 integration.' 
    },
    { 
      q: 'Is there a limit on transactions or users?', 
      a: 'The Starter package is perfect for up to 1,000 SKUs. Our Growth and Enterprise plans support unlimited inventory items, advanced batch allocations, and multiple operations accounts.' 
    }
  ];

  const SIMULATED_PRODUCTS = [
    { name: 'Logitech MX Master 3S', sku: 'LOGI-MX3S', price: 99.99, quantity: 4 },
    { name: 'Keychron K2 Mechanical Keyboard', sku: 'KEY-K2-RGB', price: 89.99, quantity: 15 },
    { name: 'Dell UltraSharp 27" 4K Monitor', sku: 'DELL-U2720Q', price: 449.99, quantity: 8 },
    { name: 'Anker USB-C Multi-Port Hub', sku: 'ANK-HUB-7IN1', price: 34.99, quantity: 32 },
    { name: 'Apple Magic Trackpad 2', sku: 'APL-MAGTRACK', price: 129.99, quantity: 3 }
  ];

  const filteredMockupProducts = SIMULATED_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-primary)',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navigation Bar */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderRadius: 0,
        borderWidth: '0 0 1px 0',
        padding: '1.25rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5, 7, 15, 0.7)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="kpi-icon-wrapper primary" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
            <Package size={22} />
          </div>
          <span className="gradient-text" style={{ fontSize: '1.45rem', fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '-0.02em' }}>Ethara Stock</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={onSignIn} className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
            Sign In
          </button>
          <button onClick={onGetStarted} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '7rem 2rem 5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="badge badge-success" style={{ marginBottom: '2rem', fontSize: '0.85rem', padding: '0.45rem 1.25rem', display: 'inline-flex', gap: '0.6rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)' }}>
          <ShieldCheck size={16} />
          <span>v1.2.0 Active: Google OAuth SSO & SMTP Low Stock Notifications</span>
        </div>

        <h1 className="gradient-text" style={{
          fontSize: '4.25rem',
          lineHeight: '1.15',
          maxWidth: '900px',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          letterSpacing: '-0.04em'
        }}>
          Next-Gen Inventory Control & Order Fulfillment
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.3rem',
          maxWidth: '720px',
          marginBottom: '3rem',
          lineHeight: '1.65',
          fontWeight: '400'
        }}>
          Track real-time supply balances, automate low-stock emails, organize CRM profiles, and generate customer receipts instantly through a clean, blazing-fast dashboard interface.
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginBottom: '5rem' }}>
          <button onClick={onGetStarted} className="btn btn-primary" style={{ padding: '1rem 2.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Start Free Trial</span>
            <ArrowRight size={18} />
          </button>
          <button onClick={onSignIn} className="btn btn-secondary" style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}>
            Sign In Portal
          </button>
        </div>

        {/* Live-looking interactive Preview Dashboard Mockup */}
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '1000px',
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg), 0 35px 70px -15px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(12, 15, 29, 0.75)',
          textAlign: 'left'
        }}>
          {/* Header of Mockup */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ marginLeft: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>terminal_preview_client_v1.2</span>
            </div>

            {/* Simulated Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setActiveMockupTab('overview')}
                className={`landing-tab-btn ${activeMockupTab === 'overview' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                KPI Metrics
              </button>
              <button 
                onClick={() => setActiveMockupTab('alerts')}
                className={`landing-tab-btn ${activeMockupTab === 'alerts' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Alerts Box
              </button>
              <button 
                onClick={() => setActiveMockupTab('catalog')}
                className={`landing-tab-btn ${activeMockupTab === 'catalog' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Live Catalog Search
              </button>
            </div>
          </div>

          {/* Tab 1: KPI overview */}
          {activeMockupTab === 'overview' && (
            <div style={{ animation: 'pageEnter 0.4s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Catalog</span>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0.25rem 0 0 0' }}>148 SKUs</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '600' }}>+8 new this week</span>
                  </div>
                  <div className="kpi-icon-wrapper primary" style={{ width: '42px', height: '42px', borderRadius: '8px' }}><Package size={20} /></div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Registered CRM</span>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0.25rem 0 0 0' }}>92 Clients</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '600' }}>+14 active logins</span>
                  </div>
                  <div className="kpi-icon-wrapper secondary" style={{ width: '42px', height: '42px', borderRadius: '8px' }}><Users size={20} /></div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Invoiced Orders</span>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0.25rem 0 0 0' }}>310 Invoices</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>$42,850.40 total</span>
                  </div>
                  <div className="kpi-icon-wrapper success" style={{ width: '42px', height: '42px', borderRadius: '8px' }}><ShoppingCart size={20} /></div>
                </div>
              </div>

              {/* Sparkline chart visualization */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Simulated Sales Volume (Last 5 Months)</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ArrowUpRight size={14} /> +24% growth</span>
                </div>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                  <div style={{ height: '30%', flex: 1, background: 'rgba(6, 182, 212, 0.2)', border: '1px solid var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '45%', flex: 1, background: 'rgba(6, 182, 212, 0.2)', border: '1px solid var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '40%', flex: 1, background: 'rgba(6, 182, 212, 0.2)', border: '1px solid var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '65%', flex: 1, background: 'rgba(99, 102, 241, 0.2)', border: '1px solid var(--secondary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '90%', flex: 1, background: 'rgba(99, 102, 241, 0.4)', border: '1px solid var(--secondary)', borderRadius: '4px', boxShadow: '0 0 15px rgba(99,102,241,0.2)' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Alerts Box */}
          {activeMockupTab === 'alerts' && (
            <div style={{ animation: 'pageEnter 0.4s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span className="low-stock-pulse"></span>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--danger-hover)', fontWeight: '700', letterSpacing: '0.05em' }}>Stock Depleted Warning</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: '500', margin: '0.1rem 0 0 0' }}>Logitech MX Master 3S (SKU: LOGI-MX3S) left with <strong>4 units</strong>.</p>
                  </div>
                </div>
                <div className="badge badge-danger" style={{ fontSize: '0.75rem' }}>SMTP Dispatched</div>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--warning)', animation: 'float 3s infinite' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--warning)', fontWeight: '700', letterSpacing: '0.05em' }}>Low Supply Reorder Alert</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: '500', margin: '0.1rem 0 0 0' }}>Apple Magic Trackpad 2 (SKU: APL-MAGTRACK) left with <strong>3 units</strong>.</p>
                  </div>
                </div>
                <div className="badge badge-warning" style={{ fontSize: '0.75rem' }}>SMTP Queued</div>
              </div>
            </div>
          )}

          {/* Tab 3: Catalog Search */}
          {activeMockupTab === 'catalog' && (
            <div style={{ animation: 'pageEnter 0.4s' }}>
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Simulate search (e.g. type 'MX', 'Apple', 'Keyboard')..."
                  style={{ width: '100%', paddingLeft: '2.75rem', background: 'rgba(0,0,0,0.2)' }}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMockupProducts.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No simulated items found.</td>
                      </tr>
                    ) : (
                      filteredMockupProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{p.name}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{p.sku}</td>
                          <td>${p.price.toFixed(2)}</td>
                          <td style={{ fontWeight: '700' }}>{p.quantity}</td>
                          <td>
                            <span className={`badge ${p.quantity < 10 ? 'badge-warning' : 'badge-success'}`}>
                              {p.quantity < 10 ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid Section */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.75rem' }}>Fully Loaded Core Operations</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Everything your warehouse and logistics teams need to stay coordinated in one streamlined package.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Feature 1 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper primary" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <LayoutDashboard size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Real-time Operations</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                An elegant dashboard displaying warehouse KPIs, active order lists, and real-time inventory counts instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper secondary" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <Package size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Catalog Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Quickly edit items, track specific SKUs, check unit pricing, and modify stock counts in a fluid, search-filtered catalog.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper success" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>CRM Customer Accounts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Manage customer directory cards, view phone/email contact information, and audit purchase logs chronologically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper secondary" style={{ width: '48px', height: '48px', borderRadius: '12px', color: 'var(--accent)', backgroundColor: 'var(--accent-glow)', border: '1px solid rgba(217, 70, 239, 0.2)' }}>
                <ShoppingCart size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Order Processing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Create invoice lists, build order drafts item-by-item, and verify stock reservation instantly with double-allocation safety check loops.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper warning" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>SMTP Stock Alerts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Fires email notifications directly to your admin address as soon as any product level drops below 10 units during order placement.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="kpi-icon-wrapper primary" style={{ width: '48px', height: '48px', borderRadius: '12px', color: '#10b981', backgroundColor: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Secure SSO Onboarding</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Sign up local accounts safely via bcrypt hashes or onboard instantly in one click with the secure Google Sign-In SDK.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '6rem 2rem',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.75rem' }}>Simple, Transparent Pricing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>Choose the scale that fits your warehouse operations.</p>
          
          {/* Custom Billing Cycle Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.3rem', borderRadius: '99px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setBillingCycle('monthly')}
              style={{
                background: billingCycle === 'monthly' ? 'var(--primary)' : 'transparent',
                color: billingCycle === 'monthly' ? '#040814' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '99px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)'
              }}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('annual')}
              style={{
                background: billingCycle === 'annual' ? 'var(--primary)' : 'transparent',
                color: billingCycle === 'annual' ? '#040814' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '99px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Yearly</span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Save 20%</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Card 1 */}
          <div className="glass-panel pricing-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(12, 15, 29, 0.4)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Starter</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For small businesses starting inventory tracking.</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                ${billingCycle === 'monthly' ? '29' : '23'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ month</span>
            </div>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', flexGrow: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Up to 1,000 SKUs</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> 2 Operations Accounts</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Standard SMTP Alerts</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> API Sandbox Access</li>
            </ul>

            <button onClick={onGetStarted} className="btn btn-secondary" style={{ width: '100%' }}>Choose Starter</button>
          </div>

          {/* Card 2 */}
          <div className="glass-panel pricing-card premium" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--secondary-hover)' }}>Growth</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For growing organizations requiring speed and scale.</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                ${billingCycle === 'monthly' ? '79' : '63'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ month</span>
            </div>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', flexGrow: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--secondary)' }} /> **Unlimited SKUs**</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--secondary)' }} /> 10 Operations Accounts</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--secondary)' }} /> Priority SMTP & Email Support</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--secondary)' }} /> Google SSO Integration</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--secondary)' }} /> Advanced Order Analytics</li>
            </ul>

            <button onClick={onGetStarted} className="btn btn-primary" style={{ width: '100%' }}>Choose Growth</button>
          </div>

          {/* Card 3 */}
          <div className="glass-panel pricing-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(12, 15, 29, 0.4)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Enterprise</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For heavy volume distribution and multi-warehouse setups.</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                ${billingCycle === 'monthly' ? '199' : '159'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ month</span>
            </div>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem', flexGrow: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Everything in Growth</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Unlimited Staff Accounts</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Multi-Warehouse Routing</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> Dedicated Account rep</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} style={{ color: 'var(--primary)' }} /> 99.9% API Uptime SLA</li>
            </ul>

            <button onClick={onGetStarted} className="btn btn-secondary" style={{ width: '100%' }}>Choose Enterprise</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: '4rem 2rem 6rem 2rem',
        maxWidth: '850px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '0.5rem' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Got questions? We have answers.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQ_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="faq-question">
                <span>{item.q}</span>
                <ChevronDown size={18} className="faq-arrow" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Try Portal CTA */}
      <section style={{
        padding: '6rem 2rem 8rem 2rem',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: '1.25rem' }}>Ready to Streamline Your Storage?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '3rem', lineHeight: '1.65' }}>
          Onboard in less than 30 seconds and start tracking products, clients, and receipts immediately. Free simulated testing accounts are available.
        </p>
        <button onClick={onGetStarted} className="btn btn-primary" style={{ padding: '1.1rem 3rem', fontSize: '1.1rem', fontWeight: '800' }}>
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '3rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#03050a'
      }}>
        <p>© 2026 Ethara Stock Inc. All rights reserved. Powered by FastAPI, React & SQLite database engine.</p>
      </footer>
    </div>
  );
}

export default Landing;
