/**
 * Hilib Delivery - Web Client API Bridge
 * Connects the static HTML pages (home.html, login.html, cart.html, etc.)
 * directly to the Node.js / Express Backend API & WebSockets.
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

const HilibAPI = {
  getToken() {
    return localStorage.getItem('hilib_token');
  },

  setToken(token) {
    localStorage.setItem('hilib_token', token);
  },

  getUser() {
    const u = localStorage.getItem('hilib_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    localStorage.setItem('hilib_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('hilib_token');
    localStorage.removeItem('hilib_user');
    window.location.href = 'login.html';
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error occurred');
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth Methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
      this.setUser(data.data.user);
    }
    return data;
  },

  async register(fullName, email, phone, password, role = 'CUSTOMER') {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phone, password, role }),
    });
    if (data.token) {
      this.setToken(data.token);
      this.setUser(data.data.user);
    }
    return data;
  },

  // Catalog & Products
  async getProducts(category = '') {
    return await this.request(`/products${category ? `?category=${category}` : ''}`);
  },

  // Orders
  async createOrder(shippingAddressId, items, paymentMethod) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddressId, items, paymentMethod }),
    });
  },

  async getMyOrders() {
    return await this.request('/orders/my-orders');
  },

  // Cart Local Storage Helper
  getCart() {
    return JSON.parse(localStorage.getItem('hilib_cart') || '[]');
  },

  addToCart(product, weightKg = 1.0) {
    const cart = this.getCart();
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      existing.weightKg += weightKg;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        pricePerKg: product.pricePerKg,
        weightKg,
        imageUrl: product.imageUrl,
      });
    }
    localStorage.setItem('hilib_cart', JSON.stringify(cart));
    return cart;
  },

  clearCart() {
    localStorage.removeItem('hilib_cart');
  }
};

window.HilibAPI = HilibAPI;

