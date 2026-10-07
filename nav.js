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

// Check local storage or Supabase user + Auto Cloud Sync + Entête unifié 2 états
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

  // Ne pas considérer comme utilisateur connecté si c'est un profil invité temporaire
  const isRealUser = userEmail && userEmail.includes('@') && !userEmail.includes('non sauvegardé');

  // Auto-sync mobile <-> desktop progression if user is identified
  if (isRealUser && typeof autoSyncCloud === 'function') {
    try {
      await autoSyncCloud(userEmail);
    } catch(e) {}
  }

  const hasDiagnostic = localStorage.getItem('bee_latest_diag') || localStorage.getItem('bee_diagnostic_results');

  // Alignement Mobile Sticky CTA au bas de l'écran
  const stickyLink = document.querySelector('.mobile-sticky-cta a');
  if (stickyLink && (isRealUser || hasDiagnostic)) {
    stickyLink.href = 'dashboard.html';
    stickyLink.innerHTML = '🐝 Reprendre mes entraînements (Mes résultats) →';
  }

  // ── Harmonisation des 2 types d'entête (Connecté vs Non connecté) ──
  applyUnifiedNavbar(isRealUser ? userEmail : null);
}

function applyUnifiedNavbar(userEmail) {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const navLinks = navbar.querySelector('.nav-links');
  const navActions = navbar.querySelector('.nav-actions');

  if (userEmail) {
    // ══════════════════════════════════════════════════════════
    // ÉTAT 2 : UTILISATEUR CONNECTÉ
    // Liens : Accueil | Expérience 7 min | Notre approche | Guilde pratique | Offres & Tarifs | Espace d’entraînement | Profil
    // Actions : 🐝 email | Se déconnecter
    // ══════════════════════════════════════════════════════════
    if (navLinks) {
      navLinks.innerHTML = `
        <li><a href="index.html" class="nav-link">Accueil</a></li>
        <li><a href="experience.html" class="nav-link">Expérience 7 min</a></li>
        <li><a href="approche.html" class="nav-link">Notre approche</a></li>
        <li><a href="articles.html" class="nav-link">Guilde pratique</a></li>
        <li><a href="offres.html" class="nav-link">Offres &amp; Tarifs</a></li>
        <li><a href="dashboard.html" class="nav-link nav-link-training" style="font-weight:700;color:var(--orange,#D97706);">Espace d’entraînement</a></li>
        <li><a href="profil.html" class="nav-link nav-link-profile">Profil</a></li>
      `;
    }

    if (navActions) {
      navActions.innerHTML = `
        <span class="nav-email-badge">🐝 ${userEmail}</span>
        <button class="nav-btn-logout" onclick="handleLogout()">Se déconnecter</button>
      `;
    }
  } else {
    // ══════════════════════════════════════════════════════════
    // ÉTAT 1 : VISITEUR SANS COMPTE
    // Liens : Accueil | Expérience 7 min | Notre approche | Guilde pratique | Offres & Tarifs
    // Actions : Se connecter | Rejoins la ruche
    // ══════════════════════════════════════════════════════════
    if (navLinks) {
      navLinks.innerHTML = `
        <li><a href="index.html" class="nav-link">Accueil</a></li>
        <li><a href="experience.html" class="nav-link">Expérience 7 min</a></li>
        <li><a href="approche.html" class="nav-link">Notre approche</a></li>
        <li><a href="articles.html" class="nav-link">Guilde pratique</a></li>
        <li><a href="offres.html" class="nav-link">Offres &amp; Tarifs</a></li>
      `;
    }

    if (navActions) {
      navActions.innerHTML = `
        <a href="connexion.html" class="btn-outline">Se connecter</a>
        <a href="inscription.html" class="btn-primary">Rejoins la ruche</a>
      `;
    }
  }

  // Réassigner la classe active
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
