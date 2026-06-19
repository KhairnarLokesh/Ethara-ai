/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, Users, Mail, Phone, Calendar, Loader2, User } from 'lucide-react';
import { apiFetch, API_URL } from '../utils/api';

function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });

  const fetchCustomers = async () => {
    try {
      const res = await apiFetch(`${API_URL}/customers`);
      if (!res.ok) throw new Error('Failed to retrieve customers.');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return 'Customer full name is required.';
    if (!formData.email.trim()) return 'Email address is required.';
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    
    if (!formData.phone_number.trim() || formData.phone_number.trim().length < 5) {
      return 'Phone number must be at least 5 digits.';
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
      const res = await apiFetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phone_number.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not register customer.');

      showToast(`Customer "${data.full_name}" registered successfully.`);
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', phone_number: '' });
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (customer) => {
    const confirmMsg = `Are you sure you want to delete customer "${customer.full_name}"?\n\nWARNING: This will automatically CANCEL all orders associated with this customer and restore their products back to stock!`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/customers/${customer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete customer.');
      
      showToast(`Customer "${customer.full_name}" and all associated orders deleted.`);
      fetchCustomers();
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

  // Helper: Initials generator
  const getInitials = (name) => {
    if (!name) return '??';
    const tokens = name.trim().split(/\s+/);
    if (tokens.length >= 2) {
      return (tokens[0][0] + tokens[1][0]).toUpperCase().slice(0, 2);
    }
    return tokens[0].slice(0, 2).toUpperCase();
  };

  // Helper: Hash Color generator
  const getAvatarColor = (name) => {
    const palette = [
      '#6366f1', // Indigo
      '#06b6d4', // Teal/Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#ec4899', // Pink
      '#8b5cf6', // Purple
      '#14b8a6'  // Teal
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Title Header */}
      <div className="page-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Customers</h1>
          <p style={{ color: 'var(--text-secondary)' }}>CRM directory: manage customer accounts and purchase logs</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ full_name: '', email: '', phone_number: '' });
          setIsAddModalOpen(true);
        }}>
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1.1rem', alignItems: 'center', marginBottom: '2rem', background: 'rgba(12, 15, 29, 0.4)' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Filter customer names, emails, contacts..."
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

      {/* Customers Table Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem 0', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={30} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p style={{ fontWeight: '500' }}>Loading customer profiles...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', opacity: '0.4', marginBottom: '1rem', strokeWidth: '1.5' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No customer accounts match your criteria.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Create a new customer account to initiate invoices.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Email Channel</th>
                  <th>Phone Line</th>
                  <th>Onboard Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Colorful Initials Avatar */}
                        <div 
                          className="crm-avatar" 
                          style={{ backgroundColor: getAvatarColor(customer.full_name) }}
                        >
                          {getInitials(customer.full_name)}
                        </div>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {highlightMatch(customer.full_name, searchQuery)}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} style={{ color: 'var(--primary)', opacity: '0.7' }} />
                        <span>{highlightMatch(customer.email, searchQuery)}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{customer.phone_number}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <Calendar size={14} />
                        <span>{new Date(customer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger btn-icon"
                        onClick={() => handleDeleteClick(customer)}
                        title="Delete CRM Profile"
                        style={{ padding: '0.55rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={22} style={{ color: 'var(--primary)' }} />
                <span>Add Customer CRM</span>
              </h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    style={{ width: '100%', paddingLeft: '2.75rem' }}
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="e.g. john@example.com"
                    style={{ width: '100%', paddingLeft: '2.75rem' }}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    className="form-input"
                    placeholder="e.g. +971 50 123 4567"
                    style={{ width: '100%', paddingLeft: '2.75rem' }}
                    value={formData.phone_number}
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
                  {submitting ? 'Registering...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
