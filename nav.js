// ════════════════════════════════════════════════════════
//  BEE Congruence — Navigation, Session & Toast Helper
// ════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  checkUserSession();
  ensureSyncHelperLoaded();
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
    toggleBtn.setAttribute('aria-label', 'Menu de navigation');
    toggleBtn.style.minWidth = '44px';
    toggleBtn.style.minHeight = '44px';
    
    toggleBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      toggleBtn.innerHTML = isOpen ? '✕' : '☰';
    });

    navbar.insertBefore(toggleBtn, navActions);
  }

  // Highlight current active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html') || (href === '/' && currentPath === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Check local storage or Supabase user + Auto Cloud Sync + Mobile CTA alignment
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
      // Fallback local
    }
  }

  // Auto-sync mobile <-> desktop progression if user is identified
  if (userEmail && typeof autoSyncCloud === 'function') {
    try {
      await autoSyncCloud(userEmail);
    } catch(e) {}
  }

  const hasDiagnostic = localStorage.getItem('bee_latest_diag') || localStorage.getItem('bee_diagnostic_results');
  const isProfileOrDash = window.location.pathname.includes('dashboard') || window.location.pathname.includes('profil');

  // Alignement Mobile CTA (ne jamais reproposer de faire le test s'il est déjà fait ou si utilisateur connecté)
  const stickyLink = document.querySelector('.mobile-sticky-cta a');
  if (stickyLink && (userEmail || hasDiagnostic)) {
    stickyLink.href = 'dashboard.html';
    stickyLink.innerHTML = '🐝 Reprendre mes entraînements (Mes résultats) →';
  }

  // Header desktop actions
  if (userEmail) {
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !isProfileOrDash) {
      navActions.innerHTML = `
        <span class="nav-email-badge" style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--brown-mid,#6B4C2A);margin-right:8px;display:inline-flex;align-items:center;gap:4px;">🐝 ${userEmail}</span>
        <a href="dashboard.html" class="btn-outline" style="margin-right:6px;font-size:13px;padding:8px 16px;">Mes Scénarios</a>
        <a href="profil.html" class="btn-primary" style="font-size:13px;padding:8px 18px;">Mon Profil</a>
      `;
    }

    // Header mobile menu (garantit que l'utilisateur mobile a accès à ses scénarios et son profil)
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !navLinks.querySelector('.nav-link-mobile-account')) {
      const divider = document.createElement('li');
      divider.className = 'nav-link-mobile-account';
      divider.style.borderTop = '1px solid var(--border, #EDE0CC)';
      divider.style.marginTop = '10px';
      divider.style.paddingTop = '10px';
      divider.innerHTML = `
        <a href="dashboard.html" class="nav-link" style="color:var(--orange,#D97706);font-weight:700;">📊 Mes Scénarios &amp; Progrès</a>
      `;
      navLinks.appendChild(divider);

      const profileLi = document.createElement('li');
      profileLi.className = 'nav-link-mobile-account';
      profileLi.innerHTML = `
        <a href="profil.html" class="nav-link">👤 Mon Profil &amp; Rappels</a>
      `;
      navLinks.appendChild(profileLi);
    }
  }
}

// ── Sync Helper Injector (pour synchro multi-écrans sur toutes les pages) ──
function ensureSyncHelperLoaded() {
  if (typeof window.checkAutoSync === 'undefined') {
    const s = document.createElement('script');
    s.src = 'sync-helper.js';
    s.async = true;
    s.onload = () => {
      if (typeof window.checkAutoSync === 'function') {
        window.checkAutoSync();
      }
    };
    document.head.appendChild(s);
  } else {
    window.checkAutoSync();
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
      } else if (typeof window.openCookiePreferences === 'function') {
        window.openCookiePreferences();
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

window.handleLogout = function() {
  if (typeof signOut === 'function') {
    try { signOut(); } catch(e) {}
  }
  localStorage.removeItem('bee_user_email');
  window.location.href = 'index.html';
};
