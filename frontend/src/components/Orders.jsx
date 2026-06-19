/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, X, PlusCircle, MinusCircle, Loader2, ShoppingBag, Calendar, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { apiFetch, API_URL } from '../utils/api';

function Orders({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New order form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([]); // Array of { product_id, quantity, name, sku, price, max_stock }
  
  // Add item state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const fetchData = async () => {
    try {
      
      // Fetch orders
      const ordersRes = await apiFetch(`${API_URL}/orders`);
      if (!ordersRes.ok) throw new Error('Failed to retrieve orders.');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // Fetch customers for dropdown
      const customersRes = await apiFetch(`${API_URL}/customers`);
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData);
      }

      // Fetch products for dropdown and stock reference
      const productsRes = await apiFetch(`${API_URL}/products`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = async (orderId) => {
    try {
      const res = await apiFetch(`${API_URL}/orders/${orderId}`);
      if (!res.ok) throw new Error('Could not retrieve order details.');
      const data = await res.json();
      setSelectedOrder(data);
      setIsDetailModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddItemToOrder = () => {
    if (!selectedProductId) {
      showToast('Please select a product to add.', 'error');
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;

    if (itemQuantity < 1) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }

    if (product.quantity_in_stock < itemQuantity) {
      showToast(`Only ${product.quantity_in_stock} units of "${product.name}" are available in stock.`, 'error');
      return;
    }

    // Check if product is already added in this order draft
    const existingItemIndex = orderItems.findIndex((item) => item.product_id === product.id);
    
    if (existingItemIndex > -1) {
      const newQuantity = orderItems[existingItemIndex].quantity + itemQuantity;
      if (product.quantity_in_stock < newQuantity) {
        showToast(`Cannot add more. Total requested quantity (${newQuantity}) exceeds stock (${product.quantity_in_stock}).`, 'error');
        return;
      }
      
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity = newQuantity;
      setOrderItems(updatedItems);
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          product_id: product.id,
          quantity: itemQuantity,
          name: product.name,
          sku: product.sku,
          price: product.price,
          max_stock: product.quantity_in_stock
        }
      ]);
    }

    // Reset item selector states
    setSelectedProductId('');
    setItemQuantity(1);
  };

  // Helper: Increment/Decrement quantities directly in the builder list draft
  const handleUpdateItemQty = (productId, delta) => {
    const itemIndex = orderItems.findIndex((item) => item.product_id === productId);
    if (itemIndex === -1) return;

    const currentQty = orderItems[itemIndex].quantity;
    const newQty = currentQty + delta;
    const maxStock = orderItems[itemIndex].max_stock;

    if (newQty < 1) {
      // Remove item if quantity falls below 1
      handleRemoveItemFromOrder(productId);
      return;
    }

    if (newQty > maxStock) {
      showToast(`Cannot exceed total available warehouse stock of ${maxStock} units.`, 'error');
      return;
    }

    const updatedItems = [...orderItems];
    updatedItems[itemIndex].quantity = newQty;
    setOrderItems(updatedItems);
  };

  const handleRemoveItemFromOrder = (productId) => {
    setOrderItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('Please select a customer.', 'error');
      return;
    }

    if (orderItems.length === 0) {
      showToast('Please add at least one product item to the order.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const itemsPayload = orderItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const res = await apiFetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(selectedCustomerId),
          items: itemsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not place order.');

      showToast(`Order #${data.id} created successfully!`);
      setIsCreateModalOpen(false);
      
      // Reset form states
      setSelectedCustomerId('');
      setOrderItems([]);
      setSelectedProductId('');
      setItemQuantity(1);
      
      fetchData(); // Refresh all tables (updates product stocks as well!)
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel and delete Order #${order.id}? This will restore its stock levels.`)) {
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/orders/${order.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel order.');

      showToast(`Order #${order.id} cancelled. Stock levels restored.`);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Find currently selected product details to show visual stock limits in builder
  const activeSelectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  return (
    <div>
      {/* Title Header */}
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Orders</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Book new transactions, inspect printable invoice vouchers, and trace balances</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setSelectedCustomerId('');
            setOrderItems([]);
            setSelectedProductId('');
            setItemQuantity(1);
            setIsCreateModalOpen(true);
          }}
          disabled={customers.length === 0 || products.length === 0}
        >
          <Plus size={18} />
          <span>Create Order</span>
        </button>
      </div>

      {/* Orders Table Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem 0', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p style={{ fontWeight: '500' }}>Loading invoice records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShoppingBag size={40} style={{ color: 'var(--text-muted)', opacity: '0.4', marginBottom: '1.25rem', strokeWidth: '1.5' }} />
            <p style={{ fontSize: '1.15rem', fontWeight: '500' }}>No customer orders placed yet.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Click "Create Order" to build a new invoice voucher.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Profile</th>
                  <th>Paid Amount</th>
                  <th>Receipt Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '800', fontFamily: 'monospace', color: 'var(--primary)', letterSpacing: '0.04em' }}>#{order.id}</td>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{order.customer?.full_name}</td>
                    <td style={{ color: 'var(--success)', fontWeight: '700' }}>${order.total_amount.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleOpenDetail(order.id)}
                          title="Inspect Invoice Details"
                          style={{ padding: '0.55rem' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon"
                          onClick={() => handleDeleteOrder(order)}
                          title="Cancel Order & Restore Stock"
                          style={{ padding: '0.55rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal (Redesigned as a Premium Printable Invoice Voucher) */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '680px', padding: '0' }}>
            {/* Voucher Title Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(22, 27, 51, 0.4)', padding: '1.75rem 2.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={22} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.35rem', margin: 0 }}>INVOICE VOUCHER</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="badge badge-success" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                  <CheckCircle2 size={13} /> Paid in Full
                </span>
                <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '2.5rem' }}>
              {/* Split Customer vs Invoice Meta details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>Customer Profile</span>
                  <p style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{selectedOrder.customer.full_name}</p>
                  <p style={{ color: 'var(--primary)', fontSize: '0.875rem', margin: '0 0 0.15rem 0' }}>{selectedOrder.customer.email}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{selectedOrder.customer.phone_number}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>Fulfillment Receipt</span>
                  <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Order ID: #{selectedOrder.id}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    {new Date(selectedOrder.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Items Purchased List */}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.75rem' }}>Line Items Summary</span>
              
              <div className="table-container" style={{ background: 'rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <table className="custom-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>Catalog Item</th>
                      <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Unit Price</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.product?.name || 'Deleted Item'}</td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>{item.product?.sku || 'N/A'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                        <td style={{ padding: '1rem' }}>${item.unit_price.toFixed(2)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Receipt Display */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Paid:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--success)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
                  <DollarSign size={24} style={{ marginRight: '-0.15rem' }} />
                  {selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => window.print()} style={{ fontSize: '0.85rem' }}>
                  Print Receipt
                </button>
                <button className="btn btn-primary" onClick={() => setIsDetailModalOpen(false)} style={{ fontSize: '0.85rem' }}>
                  Close Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShoppingBag size={22} style={{ color: 'var(--primary)' }} />
                <span>Create Customer Order</span>
              </h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit}>
              {/* Select Customer */}
              <div className="form-group">
                <label htmlFor="customer_id">Select Customer Profile</label>
                <select
                  id="customer_id"
                  className="form-input"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Item Panel */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Add Products Catalog
                </h3>
                
                <div className="order-builder-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Product Catalog Item</label>
                    <select
                      className="form-input"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">-- Select product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                          {p.name} - ${p.price.toFixed(2)} {p.quantity_in_stock === 0 ? '(Out of Stock)' : `(${p.quantity_in_stock} left)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddItemToOrder}
                    style={{ height: '45px', padding: '0 1.25rem' }}
                  >
                    Add Item
                  </button>
                </div>

                {/* Stock limit helper indicator */}
                {activeSelectedProduct && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'pageEnter 0.25s' }}>
                    <span 
                      className={`badge ${activeSelectedProduct.quantity_in_stock < 10 ? 'badge-warning' : 'badge-success'}`}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                    >
                      Available Stock: {activeSelectedProduct.quantity_in_stock} units
                    </span>
                    {activeSelectedProduct.quantity_in_stock < 10 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>⚠️ Low stock warning. Reordering suggested.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Order Items Review Draft */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Selected Items Review</h3>
              <div className="order-items-list">
                {orderItems.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.25rem 0' }}>
                    No products added to this order draft yet.
                  </p>
                ) : (
                  <div>
                    {orderItems.map((item) => (
                      <div key={item.product_id} className="order-item-chip">
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
                            SKU: {item.sku} | Price: ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          {/* Quantity adjustment buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.product_id, -1)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <MinusCircle size={18} />
                            </button>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.product_id, 1)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <PlusCircle size={18} />
                            </button>
                          </div>

                          <span style={{ fontWeight: '700', color: 'var(--primary)', width: '70px', textAlign: 'right' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => handleRemoveItemFromOrder(item.product_id)}
                            style={{ padding: '0.35rem', borderRadius: '6px' }}
                            title="Remove Product"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Invoice Total:</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--success)', fontFamily: 'var(--font-display)' }}>
                        ${calculateOrderTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting || orderItems.length === 0}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
