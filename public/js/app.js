// =================================================================
// PAWHAVEN GLOBAL CLIENT LOGIC & STATE MANAGEMENT
// =================================================================

const App = {
  // Get stored token
  getToken() {
    return localStorage.getItem('pawhaven_token');
  },

  // Get current user object
  getUser() {
    try {
      const data = localStorage.getItem('pawhaven_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Check login status
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  // Check if current user is admin
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'Admin';
  },

  // Save session
  setSession(token, user) {
    localStorage.setItem('pawhaven_token', token);
    localStorage.setItem('pawhaven_user', JSON.stringify(user));
    this.updateNavbar();
  },

  // Clear session
  logout() {
    localStorage.removeItem('pawhaven_token');
    localStorage.removeItem('pawhaven_user');
    this.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = '/login';
    }, 400);
  },

  // Unified API Fetch wrapper
  async fetchApi(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };

    // Attach token if present and not already provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON body if not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401 or 403, and token was expired
        if (response.status === 401 && this.isAuthenticated()) {
          this.logout();
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';

    let icon = 'bi-info-circle-fill text-info';
    let borderColor = 'var(--info)';
    if (type === 'success') {
      icon = 'bi-check-circle-fill text-success';
      borderColor = 'var(--success)';
    } else if (type === 'danger' || type === 'error') {
      icon = 'bi-exclamation-triangle-fill text-danger';
      borderColor = 'var(--danger)';
    } else if (type === 'warning') {
      icon = 'bi-exclamation-circle-fill text-warning';
      borderColor = 'var(--warning)';
    }

    toast.style.borderLeftColor = borderColor;
    toast.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="bi ${icon} fs-5"></i>
        <div style="font-size: 0.9rem; font-weight: 500; color: #1e293b;">${message}</div>
      </div>
      <button type="button" class="btn-close ms-2" style="font-size: 0.75rem;" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  },

  // Update dynamic navbar according to user state
  updateNavbar() {
    const authArea = document.getElementById('navbar-auth-section');
    if (!authArea) return;

    const user = this.getUser();

    if (this.isAuthenticated() && user) {
      const isAdministrator = user.role === 'Admin';
      authArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          ${
            !isAdministrator
              ? `
              <a href="/dashboard" class="position-relative me-2 text-dark p-2 rounded-circle hover-bg" title="Notifications">
                <i class="bi bi-bell-fill fs-5 text-secondary"></i>
                <span id="nav-notif-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display:none; font-size: 0.65rem;">
                  0
                </span>
              </a>
              `
              : ''
          }
          <div class="dropdown">
            <button class="btn btn-outline-custom dropdown-toggle py-1 px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-1"></i> ${user.fullName.split(' ')[0]} ${isAdministrator ? '<span class="badge bg-warning text-dark ms-1">Admin</span>' : ''}
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
              <li class="px-3 py-2 border-bottom">
                <div class="fw-bold text-dark small">${user.fullName}</div>
                <div class="text-muted text-truncate" style="font-size: 0.75rem;">${user.email}</div>
              </li>
              ${
                isAdministrator
                  ? `<li><a class="dropdown-item py-2" href="/admin"><i class="bi bi-speedometer2 me-2 text-primary"></i>Admin Dashboard</a></li>`
                  : `<li><a class="dropdown-item py-2" href="/dashboard"><i class="bi bi-grid-fill me-2 text-primary"></i>My Dashboard</a></li>`
              }
              <li><hr class="dropdown-divider my-1"></li>
              <li><a class="dropdown-item py-2 text-danger" href="javascript:void(0)" onclick="App.logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
            </ul>
          </div>
        </div>
      `;

      if (!isAdministrator) {
        this.pollUnreadNotifications();
      }
    } else {
      authArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="/login" class="btn btn-outline-custom py-2 px-3">Sign In</a>
          <a href="/register" class="btn btn-primary-custom py-2 px-3">Register</a>
        </div>
      `;
    }
  },

  // Poll for unread notification count
  async pollUnreadNotifications() {
    try {
      const res = await this.fetchApi('/api/notifications/unread-count');
      const badge = document.getElementById('nav-notif-badge');
      if (badge && res.unreadCount > 0) {
        badge.innerText = res.unreadCount;
        badge.style.display = 'inline-block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    } catch (e) {
      // Quiet fail for badge polling
    }
  }
};

// Initialize navbar upon DOM readiness
document.addEventListener('DOMContentLoaded', () => {
  App.updateNavbar();
});
