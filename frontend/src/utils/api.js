export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth_expired'));
  }
  
  return response;
};
