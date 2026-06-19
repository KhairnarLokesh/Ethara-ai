/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Grid, List, Package } from 'lucide-react';
import { apiFetch, API_URL } from '../utils/api';

function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch(`${API_URL}/products`);
      if (!res.ok) throw new Error('Failed to retrieve products.');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required.';
    if (!formData.sku.trim()) return 'SKU/Code is required.';
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      return 'Price must be a valid non-negative number.';
    }
    if (isNaN(parseInt(formData.quantity_in_stock)) || parseInt(formData.quantity_in_stock) < 0) {
      return 'Quantity in stock must be a non-negative integer.';
    }
    return null;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          price: parseFloat(formData.price),
          quantity_in_stock: parseInt(formData.quantity_in_stock)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not save product.');

      showToast(`Product "${data.name}" added successfully.`);
      setIsAddModalOpen(false);
      setFormData({ name: '', sku: '', price: '', quantity_in_stock: '' });
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity_in_stock: product.quantity_in_stock.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch(`${API_URL}/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          price: parseFloat(formData.price),
          quantity_in_stock: parseInt(formData.quantity_in_stock)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not update product.');

      showToast(`Product "${data.name}" updated successfully.`);
      setIsEditModalOpen(false);
      setFormData({ name: '', sku: '', price: '', quantity_in_stock: '' });
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (product) => {
    if (!window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete product.');
      
      showToast(`Product "${product.name}" deleted.`);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Helper: Search Match Highlighting
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="search-highlight">{part}</span> 
            : part
        )}
      </span>
    );
  };

  // Helper: Visual gradient generator for card thumbnails
  const getThumbnailGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, rgba(9, 9, 11, 0.75) 0%, rgba(163, 230, 53, 0.08) 100%)',
      'linear-gradient(135deg, rgba(9, 9, 11, 0.75) 0%, rgba(230, 227, 224, 0.08) 100%)',
      'linear-gradient(135deg, rgba(9, 9, 11, 0.75) 0%, rgba(163, 230, 53, 0.12) 100%)',
      'linear-gradient(135deg, rgba(9, 9, 11, 0.75) 0%, rgba(230, 227, 224, 0.12) 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Title Header */}
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Products</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage catalog supplies, stock replenishment levels, and SKUs</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ name: '', sku: '', price: '', quantity_in_stock: '' });
          setIsAddModalOpen(true);
        }}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Layout Toggle row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass-panel" style={{ flexGrow: 1, padding: '0.9rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search items by product name, SKU codes..."
            className="form-input"
            style={{ border: 'none', background: 'none', width: '100%', padding: 0 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Grid / Table layout switcher */}
        <div className="view-toggle">
          <button 
            onClick={() => setViewMode('grid')}
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid View"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            title="List Table View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Main Grid/Table Content Container */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '6rem 0', gap: '1rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ fontWeight: '500' }}>Loading product catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Package size={45} style={{ color: 'var(--text-muted)', opacity: '0.4', marginBottom: '1.25rem', strokeWidth: '1.5' }} />
          <p style={{ fontSize: '1.15rem', fontWeight: '500' }}>No products match your search.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Create a new product to load items into the active catalog.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Card Grid View Mode */
        <div className="product-grid" style={{ animation: 'pageEnter 0.4s' }}>
          {filteredProducts.map((product) => {
            // Determine stock status details
            const qty = product.quantity_in_stock;
            const isOutOfStock = qty === 0;
            const isLowStock = qty > 0 && qty < 10;
            
            let badgeClass = 'badge-success';
            let badgeText = 'In Stock';
            let fillCol = 'var(--success)';
            if (isOutOfStock) {
              badgeClass = 'badge-danger';
              badgeText = 'Out of Stock';
              fillCol = 'var(--danger-hover)';
            } else if (isLowStock) {
              badgeClass = 'badge-warning';
              badgeText = 'Low Stock';
              fillCol = 'var(--warning)';
            }
            
            // Gauge fill percentage (cap at 100 units max base)
            const gaugePct = Math.min(100, Math.round((qty / 100) * 100));

            return (
              <div key={product.id} className="product-card">
                {/* Stock Status Tag */}
                <div className="product-card-status-badge">
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.65rem' }}>
                    {qty < 10 && <span className="low-stock-pulse" style={{ margin: '0 0.25rem 0 0' }}></span>}
                    {badgeText}
                  </span>
                </div>

                {/* Simulated Thumbnail */}
                <div className="product-card-thumbnail" style={{ background: getThumbnailGradient(product.name) }}>
                  <Package size={36} />
                </div>

                <div className="product-card-info">
                  <div className="product-card-sku">{highlightMatch(product.sku, searchQuery)}</div>
                  <div className="product-card-name" title={product.name}>
                    {highlightMatch(product.name, searchQuery)}
                  </div>
                  
                  <div className="product-card-price">${product.price.toFixed(2)}</div>
                  
                  {/* Gauge bar */}
                  <div style={{ marginTop: 'auto', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                      <span>In Stock Count:</span>
                      <span style={{ fontWeight: '700', color: isOutOfStock ? 'var(--danger-hover)' : 'var(--text-primary)' }}>{qty} units</span>
                    </div>
                    <div className="product-card-stock-gauge">
                      <div 
                        className="product-card-stock-fill"
                        style={{ 
                          width: `${isOutOfStock ? 100 : Math.max(8, gaugePct)}%`, 
                          backgroundColor: fillCol 
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions overlay buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.85rem' }}
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="btn btn-danger btn-icon" 
                      style={{ padding: '0.5rem' }}
                      onClick={() => handleDeleteClick(product)}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Classic List Table View Mode */
        <div className="glass-panel" style={{ padding: '1.5rem', animation: 'pageEnter 0.4s' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU / Code</th>
                  <th>Unit Price</th>
                  <th>Quantity In Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const qty = product.quantity_in_stock;
                  const isOutOfStock = qty === 0;
                  const isLowStock = qty > 0 && qty < 10;
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{highlightMatch(product.name, searchQuery)}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.04em' }}>{highlightMatch(product.sku, searchQuery)}</td>
                      <td style={{ fontWeight: '500' }}>${product.price.toFixed(2)}</td>
                      <td style={{ fontWeight: '700' }}>
                        {isLowStock || isOutOfStock ? <span className="low-stock-pulse"></span> : null}
                        {qty}
                      </td>
                      <td>
                        <span className={`badge ${
                          isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'
                        }`} style={{ fontSize: '0.75rem' }}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleEditClick(product)}
                            title="Edit Details"
                            style={{ padding: '0.55rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDeleteClick(product)}
                            title="Delete Product"
                            style={{ padding: '0.55rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Package size={22} style={{ color: 'var(--primary)' }} />
                <span>Add Product SKU</span>
              </h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Logitech MX Master 3S"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sku">SKU / Unique Code</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  className="form-input"
                  placeholder="e.g. LOGI-MX3S-GRY"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    className="form-input"
                    placeholder="99.99"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quantity_in_stock">Initial Supply Count</label>
                  <input
                    type="number"
                    id="quantity_in_stock"
                    name="quantity_in_stock"
                    className="form-input"
                    placeholder="50"
                    value={formData.quantity_in_stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit2 size={20} style={{ color: 'var(--primary)' }} />
                <span>Edit Product details</span>
              </h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-name">Product Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-sku">SKU / Unique Code</label>
                <input
                  type="text"
                  id="edit-sku"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-price">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit-price"
                    name="price"
                    className="form-input"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-quantity">Supply Quantity</label>
                  <input
                    type="number"
                    id="edit-quantity"
                    name="quantity_in_stock"
                    className="form-input"
                    value={formData.quantity_in_stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
