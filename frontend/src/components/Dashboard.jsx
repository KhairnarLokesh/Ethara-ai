/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, ArrowUpRight, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { apiFetch, API_URL } from '../utils/api';

function Dashboard({ showToast, setActiveTab }) {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null); // Chart tooltip details

  // Fetch Stats from database
  const fetchStats = async () => {
    try {
      const res = await apiFetch(`${API_URL}/dashboard?low_stock_threshold=10`);
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics.');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        <p style={{ fontWeight: '500' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  // Stock breakdown statistics for Donut chart
  const outOfStockCount = stats.low_stock_products.filter(p => p.quantity_in_stock === 0).length;
  const lowStockCount = stats.low_stock_products.filter(p => p.quantity_in_stock > 0).length;
  const totalAlertStock = stats.low_stock_products.length;
  const healthyStockCount = Math.max(0, stats.total_products - totalAlertStock);
  const totalStockSum = stats.total_products || 1; // avoid division by 0

  const healthyPct = Math.round((healthyStockCount / totalStockSum) * 100);
  const lowStockPct = Math.round((lowStockCount / totalStockSum) * 100);
  const outStockPct = Math.round((outOfStockCount / totalStockSum) * 100);

  // SVG Donut Calculations
  const radius = 50;
  const circ = 2 * Math.PI * radius; // ~314
  
  const healthyStroke = (healthyStockCount / totalStockSum) * circ;
  const lowStroke = (lowStockCount / totalStockSum) * circ;
  const outStroke = (outOfStockCount / totalStockSum) * circ;

  const healthyOffset = circ;
  const lowOffset = circ - healthyStroke;
  const outOffset = circ - healthyStroke - lowStroke;

  // SVG Area Chart points (simulated weekly orders revenue)
  const chartData = [
    { label: 'Week 1', value: 4200, count: 12 },
    { label: 'Week 2', value: 8900, count: 28 },
    { label: 'Week 3', value: 6500, count: 19 },
    { label: 'Week 4', value: 11400, count: 35 },
    { label: 'Week 5', value: 14200, count: 48 }
  ];

  // Map value to Y coordinate (height is 140 max, chart bounds Y: 20 to 160)
  const getY = (val) => 160 - ((val - 2000) / 13000) * 130;
  const getX = (idx) => 50 + idx * 95;

  // Path coordinates
  const areaPoints = chartData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPath = `M ${getX(0)},180 L ${areaPoints} L ${getX(chartData.length - 1)},180 Z`;
  const linePath = `M ${areaPoints}`;

  return (
    <div>
      {/* Page Title Header */}
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Inventory operations and order trends analytics</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchStats(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="card-grid">
        <div className="glass-panel kpi-card" onClick={() => setActiveTab('products')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <h3>Total Catalog</h3>
            <p>{stats.total_products}</p>
            <span className="kpi-trend" style={{ background: 'var(--success-glow)', color: 'var(--success)' }}>
              <TrendingUp size={12} style={{ marginRight: '0.25rem' }} /> Active SKUs
            </span>
          </div>
          <div className="kpi-icon-wrapper primary">
            <Package size={28} />
          </div>
        </div>

        <div className="glass-panel kpi-card" onClick={() => setActiveTab('customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <h3>CRM Customers</h3>
            <p>{stats.total_customers}</p>
            <span className="kpi-trend" style={{ background: 'var(--success-glow)', color: 'var(--success)' }}>
              <ArrowUpRight size={12} style={{ marginRight: '0.25rem' }} /> Registered Profiles
            </span>
          </div>
          <div className="kpi-icon-wrapper secondary">
            <Users size={28} />
          </div>
        </div>

        <div className="glass-panel kpi-card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <h3>Invoiced Orders</h3>
            <p>{stats.total_orders}</p>
            <span className="kpi-trend" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
              <TrendingUp size={12} style={{ marginRight: '0.25rem' }} /> Order Receipts
            </span>
          </div>
          <div className="kpi-icon-wrapper success">
            <ShoppingCart size={28} />
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Sales Volume Area Chart */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={20} style={{ color: 'var(--primary)' }} />
              Simulated Weekly Sales Revenue
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trend: +32.4%</span>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 480 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grids */}
              <line x1="50" y1="160" x2="450" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="50" y1="120" x2="450" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="50" y1="80" x2="450" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="50" y1="40" x2="450" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Area path */}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#areaGrad)" style={{ transition: 'all 0.5s' }} />

              {/* Line path */}
              <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />

              {/* Grid Values Labels */}
              <text x="15" y="163" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">$2.0k</text>
              <text x="15" y="123" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">$6.0k</text>
              <text x="15" y="83" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">$10k</text>
              <text x="15" y="43" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">$14k</text>

              {/* Point Markers */}
              {chartData.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={i === hoveredPoint?.index ? "6" : "4"}
                    fill={i === hoveredPoint?.index ? "var(--primary-hover)" : "var(--bg-secondary)"}
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer', transition: 'r 0.15s, fill 0.15s' }}
                    onMouseEnter={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      setHoveredPoint({
                        index: i,
                        x: rect.left - rect.width / 2,
                        y: rect.top - 45,
                        label: d.label,
                        value: `$${d.value.toLocaleString()}`,
                        orders: `${d.count} orders placed`
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text x={getX(i)} y="195" fill="var(--text-muted)" fontSize="9.5" textAnchor="middle" fontWeight="500">{d.label}</text>
                </g>
              ))}
            </svg>

            {/* Float Tooltip */}
            {hoveredPoint && (
              <div 
                className="chart-tooltip" 
                style={{ 
                  position: 'fixed', 
                  left: `${hoveredPoint.x}px`, 
                  top: `${hoveredPoint.y}px`, 
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 200,
                  pointerEvents: 'none'
                }}
              >
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{hoveredPoint.value}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{hoveredPoint.orders}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Allocation Donut Chart */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--secondary-hover)' }} />
            Stock Allocations
          </h2>

          {/* SVG Donut Circle */}
          <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1.5rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 120 120">
              <g transform="rotate(-90 60 60)">
                {/* Background Ring */}
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="11" />
                
                {/* Healthy portion */}
                {healthyStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--success)"
                    strokeWidth="11"
                    strokeDasharray={`${healthyStroke} ${circ - healthyStroke}`}
                    strokeDashoffset={healthyOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}

                {/* Low stock portion */}
                {lowStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--warning)"
                    strokeWidth="11"
                    strokeDasharray={`${lowStroke} ${circ - lowStroke}`}
                    strokeDashoffset={lowOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}

                {/* Out of stock portion */}
                {outStroke > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--danger-hover)"
                    strokeWidth="11"
                    strokeDasharray={`${outStroke} ${circ - outStroke}`}
                    strokeDashoffset={outOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}
              </g>
            </svg>

            {/* Inner Ring stats overlay text */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{stats.total_products}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</span>
            </div>
          </div>

          {/* Color Guides list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Healthy</span>
              </div>
              <span style={{ fontWeight: '700' }}>{healthyPct}% ({healthyStockCount})</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Low Stock</span>
              </div>
              <span style={{ fontWeight: '700' }}>{lowStockPct}% ({lowStockCount})</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger-hover)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Out of Stock</span>
              </div>
              <span style={{ fontWeight: '700' }}>{outStockPct}% ({outOfStockCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts table section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)', animation: 'float 4s infinite' }} />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Inventory Alerts (Low Stock)</h2>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', background: 'rgba(245, 158, 11, 0.08)' }}>
            Reorder Level &lt; 10 units
          </span>
        </div>

        {stats.low_stock_products.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }} className="glass-panel">
            <p style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--success)' }}>🎉 Excellent! All product catalog supplies are healthy.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>SMTP notification alerts will trigger automatically when items run low.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Unit Price</th>
                  <th>Units In Stock</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{product.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.04em' }}>{product.sku}</td>
                    <td style={{ fontWeight: '500' }}>${product.price.toFixed(2)}</td>
                    <td style={{ fontWeight: '800' }}>
                      <span className="low-stock-pulse"></span>
                      <span style={{ color: product.quantity_in_stock === 0 ? 'var(--danger-hover)' : 'var(--warning)' }}>
                        {product.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                        {product.quantity_in_stock === 0 ? 'Out of Stock' : 'Reorder Needed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
