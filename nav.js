// ════════════════════════════════════════════════════════
//  BEE Congruence — Navigation, Session & Toast Helper
// ════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  checkUserSession();
});

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Add mobile toggle button if not exists
  let navActions = navbar.querySelector('.nav-actions');
  let navLinks = navbar.querySelector('.nav-links');

  if (navLinks && !navbar.querySelector('.nav-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle';
    toggleBtn.innerHTML = '☰';
    toggleBtn.setAttribute('aria-label', 'Toggle Menu');
    
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      toggleBtn.innerHTML = navLinks.classList.contains('mobile-open') ? '✕' : '☰';
    });

    navbar.insertBefore(toggleBtn, navActions);
  }

  // Highlight current active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Check local storage or Supabase user
async function checkUserSession() {
  let userEmail = localStorage.getItem('bee_user_email');
  
  if (typeof getUser === 'function') {
    try {
      const sbUser = await getUser();
      if (sbUser && sbUser.email) {
        userEmail = sbUser.email;
      }
    } catch (e) {
      // Supabase credentials placeholder error fallback
    }
  }

  if (userEmail && !window.location.pathname.includes('dashboard')) {
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <span class="nav-email-badge" style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--brown-mid);margin-right:8px;display:inline-flex;align-items:center;gap:4px;">🐝 ${userEmail}</span>
        <a href="dashboard.html" class="btn-primary">Mon Profil</a>
      `;
    }
  }
}

// ── Global Toast Notification UI ──
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `bee-toast toast-${type}`;

  const iconMap = {
    success: '🐝',
    warning: '⚡',
    error: '⚠️',
    info: '💡'
  };

  toast.innerHTML = `
    <span class="bee-toast-icon">${iconMap[type] || '🐝'}</span>
    <span class="bee-toast-message">${message}</span>
    <button class="bee-toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

