// ════════════════════════════════════════════════════════
//  BEE Congruence — Navigation, Session & Toast Helper
// ════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  checkUserSession();
  ensureCookieConsentLoaded();
  ensureFooterCookieLink();
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
    toggleBtn.style.minWidth = '44px';
    toggleBtn.style.minHeight = '44px';
    
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

// Check local storage or Supabase user + Auto Cloud Sync
async function checkUserSession() {
  let userEmail = localStorage.getItem('bee_user_email');
  
  if (typeof getUser === 'function') {
    try {
      const sbUser = await getUser();
      if (sbUser && sbUser.email) {
        userEmail = sbUser.email;
        localStorage.setItem('bee_user_email', userEmail);
      }
    } catch (e) {
      // Supabase credentials placeholder error fallback
    }
  }

  // Auto-sync mobile <-> desktop progression if user is logged in
  if (userEmail && typeof autoSyncCloud === 'function') {
    try {
      await autoSyncCloud(userEmail);
    } catch(e) {}
  }

  if (userEmail) {
    const navActions = document.querySelector('.nav-actions');
    const isProfileOrDash = window.location.pathname.includes('dashboard') || window.location.pathname.includes('profil');
    
    if (navActions && !isProfileOrDash) {
      navActions.innerHTML = `
        <span class="nav-email-badge" style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--brown-mid,#6B4C2A);margin-right:8px;display:inline-flex;align-items:center;gap:4px;">🐝 ${userEmail}</span>
        <a href="dashboard.html" class="btn-outline" style="margin-right:6px;font-size:13px;padding:8px 16px;">Mes Scénarios</a>
        <a href="profil.html" class="btn-primary" style="font-size:13px;padding:8px 18px;">Mon Profil</a>
      `;
    }
  }
}

// ── Cookie Consent Injector ──
function ensureCookieConsentLoaded() {
  if (typeof window.BeeCookieConsent === 'undefined') {
    const s = document.createElement('script');
    s.src = 'cookie-consent.js';
    s.async = true;
    document.head.appendChild(s);
  }
}

// ── Footer Cookie Consent Link Injector ──
function ensureFooterCookieLink() {
  const footerNav = document.querySelector('.footer-nav');
  if (footerNav && !footerNav.querySelector('.btn-cookie-manage')) {
    const cookieLink = document.createElement('a');
    cookieLink.href = '#';
    cookieLink.className = 'btn-cookie-manage';
    cookieLink.textContent = 'Gestion des cookies';
    cookieLink.onclick = (e) => {
      e.preventDefault();
      if (window.BeeCookieConsent && typeof window.BeeCookieConsent.showModal === 'function') {
        window.BeeCookieConsent.showModal();
      }
    };
    footerNav.appendChild(cookieLink);
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
