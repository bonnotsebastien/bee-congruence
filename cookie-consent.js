// ════════════════════════════════════════════════════════
//  BEE Congruence — Gestionnaire de Consentement Cookies RGPD
// ════════════════════════════════════════════════════════

(function () {
  const CONSENT_STORAGE_KEY = 'bee_cookie_consent';
  const CONSENT_COOKIE_NAME = 'bee_cookie_consent';
  // Durée légale maximale de conservation du consentement (13 mois selon la CNIL / RGPD)
  const CONSENT_MAX_AGE_SECONDS = 395 * 24 * 60 * 60; // ~13 mois

  // ── Utilitaires de cookies navigateur (persistance multi-sessions / Safari / mobile) ──
  function setCookie(name, val, maxAgeSeconds) {
    try {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(val)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${secure}`;
    } catch (e) {}
  }

  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    } catch (e) {
      return null;
    }
  }

  // Vérifie si le consentement n'a pas dépassé la durée légale de 13 mois
  function isConsentExpired(savedAt) {
    if (!savedAt) return false;
    const diffMs = Date.now() - new Date(savedAt).getTime();
    return diffMs > (CONSENT_MAX_AGE_SECONDS * 1000);
  }

  function getConsent() {
    let raw = null;

    // 1. Source primaire : localStorage
    try {
      raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (e) {}

    // 2. Source secondaire : Cookie navigateur (secours Safari ITP / navigation mobile)
    if (!raw) {
      raw = getCookie(CONSENT_COOKIE_NAME);
      if (raw) {
        try { localStorage.setItem(CONSENT_STORAGE_KEY, raw); } catch(e) {}
      }
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.savedAt && isConsentExpired(parsed.savedAt)) {
            // Expiré, doit être redemandé
            return null;
          }
          return parsed;
        }
      } catch (e) {}
    }

    // 3. Rétrocompatibilité avec l'ancien flag rgpd_done
    try {
      if (localStorage.getItem('rgpd_done') === '1' || sessionStorage.getItem('rgpd_done') === '1') {
        const fallback = {
          necessary: true,
          analytics: false,
          personalization: false,
          savedAt: new Date().toISOString(),
        };
        saveConsent(fallback);
        return fallback;
      }
    } catch(e) {}

    return null;
  }

  function saveConsent(consentObj) {
    const data = {
      necessary: true,
      analytics: Boolean(consentObj.analytics),
      personalization: Boolean(consentObj.personalization),
      savedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data);

    // Sauvegarde synchrone dans localStorage
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, json);
      localStorage.setItem('rgpd_done', '1');
      sessionStorage.setItem('rgpd_done', '1');
    } catch (e) {}

    // Sauvegarde dans le cookie pour persistance inter-domaines et Safari / iOS
    setCookie(CONSENT_COOKIE_NAME, json, CONSENT_MAX_AGE_SECONDS);

    window.dispatchEvent(new CustomEvent('bee_consent_updated', { detail: data }));
    hideBanner();
    closeModal();
  }

  function hideBanner() {
    const banner = document.getElementById('rgpdBanner');
    if (banner) {
      banner.classList.remove('show');
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      banner.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 320);
    }
  }

  function showBanner() {
    // Si consentement déjà présent et valide, ne jamais afficher
    if (getConsent()) {
      hideBanner();
      return;
    }

    let banner = document.getElementById('rgpdBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'rgpdBanner';
      banner.className = 'rgpd-banner';
      document.body.appendChild(banner);
    }

    banner.innerHTML = `
      <div class="rgpd-text">
        <div class="rgpd-title" style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:var(--gold,#C3651B);margin-bottom:6px;">
          <span>🍪</span> Respect de votre vie privée &amp; RGPD
        </div>
        <div class="rgpd-desc" style="font-size:12px;color:rgba(255,255,255,0.85);line-height:1.55;">
          BEE Congruence utilise des traceurs essentiels pour assurer le bon fonctionnement de votre compte, la sécurité de vos tests et la synchronisation de vos progrès. Avec votre accord, nous mesurons l'audience pour perfectionner nos scénarios. Aucun traceur publicitaire intrusif.
        </div>
      </div>
      <div class="rgpd-actions" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center;margin-top:10px;">
        <button type="button" class="rgpd-refuse" id="btnRgpdRefuse" style="background:transparent;border:1px solid rgba(255,255,255,0.3);color:rgba(255,255,255,0.85);padding:7px 14px;border-radius:20px;font-size:12px;font-family:'Nunito',sans-serif;cursor:pointer;transition:all 0.2s;">
          Refuser non-essentiels
        </button>
        <button type="button" class="rgpd-customize" id="btnRgpdCustomize" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);color:white;padding:7px 14px;border-radius:20px;font-size:12px;font-family:'Nunito',sans-serif;cursor:pointer;transition:all 0.2s;">
          Personnaliser
        </button>
        <button type="button" class="rgpd-accept" id="btnRgpdAccept" style="background:var(--orange,#C3651B);border:none;color:white;font-weight:700;padding:7px 18px;border-radius:20px;font-size:12px;font-family:'Nunito',sans-serif;cursor:pointer;transition:all 0.2s;">
          Accepter tout
        </button>
      </div>
    `;

    banner.style.display = 'flex';
    banner.classList.add('show');
    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';
    });

    document.getElementById('btnRgpdAccept')?.addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: true, personalization: true });
    });

    document.getElementById('btnRgpdRefuse')?.addEventListener('click', () => {
      saveConsent({ necessary: true, analytics: false, personalization: false });
    });

    document.getElementById('btnRgpdCustomize')?.addEventListener('click', () => {
      openModal();
    });
  }

  function openModal() {
    let modal = document.getElementById('rgpdModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rgpdModal';
      modal.className = 'rgpd-modal-overlay';
      document.body.appendChild(modal);
    }

    const current = getConsent() || { necessary: true, analytics: false, personalization: false };

    modal.innerHTML = `
      <div class="rgpd-modal-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <h3 style="font-family:'Playfair Display',serif; font-size:20px; margin:0; color:var(--orange,#C3651B);">
            🍪 Préférences de cookies &amp; traceurs
          </h3>
          <button type="button" onclick="window.closeCookiePreferences()" style="background:none; border:none; font-size:22px; cursor:pointer; color:var(--brown-light,#8C8275);">&times;</button>
        </div>

        <p style="font-size:13px; color:var(--brown-mid,#5C5349); line-height:1.55; margin-bottom:20px;">
          Vous pouvez choisir ci-dessous les catégories de traceurs que vous acceptez. Vos choix sont conservés pendant 13 mois conformément aux recommandations CNIL et modifiables à tout moment depuis le pied de page.
        </p>

        <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:24px;">
          <!-- Essentiels -->
          <div style="background:var(--warm-white,#FDFAF6); border:1px solid var(--border,rgba(26,22,18,0.1)); border-radius:12px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:14px;">Cookies essentiels (obligatoires)</strong>
                <p style="font-size:12px; color:var(--brown-mid,#5C5349); margin:4px 0 0;">Nécessaires à la sécurité, à l'accès à votre compte et à la sauvegarde de vos diagnostics.</p>
              </div>
              <span style="font-size:11px; font-weight:700; color:var(--green,#3d6b27); background:rgba(61,107,39,0.12); padding:4px 10px; border-radius:12px; white-space:nowrap;">Toujours actif</span>
            </div>
          </div>

          <!-- Mesure d'audience -->
          <div style="background:var(--warm-white,#FDFAF6); border:1px solid var(--border,rgba(26,22,18,0.1)); border-radius:12px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:14px;">Mesure d'audience &amp; ergonomie</strong>
                <p style="font-size:12px; color:var(--brown-mid,#5C5349); margin:4px 0 0;">Nous permet d'analyser anonymement l'usage des pages pour perfectionner la fluidité des exercices.</p>
              </div>
              <label style="position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; margin-left:14px;">
                <input type="checkbox" id="cookieAnalyticsToggle" ${current.analytics ? 'checked' : ''} style="opacity:0; width:0; height:0;">
                <span class="cookie-switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- Personnalisation & rappels -->
          <div style="background:var(--warm-white,#FDFAF6); border:1px solid var(--border,rgba(26,22,18,0.1)); border-radius:12px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:14px;">Personnalisation &amp; rappels d'entraînement</strong>
                <p style="font-size:12px; color:var(--brown-mid,#5C5349); margin:4px 0 0;">Mémorise vos préférences de rythme d'entraînement et d'affichage.</p>
              </div>
              <label style="position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; margin-left:14px;">
                <input type="checkbox" id="cookiePersonalizationToggle" ${current.personalization ? 'checked' : ''} style="opacity:0; width:0; height:0;">
                <span class="cookie-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="rgpd-modal-footer" style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:20px;">
          <button type="button" onclick="window.saveCustomPreferences(false, false)" style="flex:1; min-width:130px; background:transparent; border:1px solid var(--border,rgba(26,22,18,0.2)); color:var(--brown-mid,#5C5349); padding:11px 18px; border-radius:50px; font-size:13px; font-weight:700; cursor:pointer; text-align:center;">
            Tout refuser
          </button>
          <button type="button" onclick="window.saveCurrentModalPreferences()" style="flex:1; min-width:160px; background:var(--orange,#C3651B); border:none; color:white; padding:11px 22px; border-radius:50px; font-size:13px; font-weight:800; cursor:pointer; text-align:center;">
            Enregistrer mes choix
          </button>
        </div>
      </div>
    `;

    // Injecter style du curseur toggle si non présent
    if (!document.getElementById('cookieSwitchStyle')) {
      const style = document.createElement('style');
      style.id = 'cookieSwitchStyle';
      style.textContent = `
        .cookie-switch-slider {
          position: absolute; cursor: pointer; inset: 0; background-color: #ccc;
          transition: .25s; border-radius: 24px;
        }
        .cookie-switch-slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: white; transition: .25s; border-radius: 50%;
        }
        input:checked + .cookie-switch-slider { background-color: var(--orange, #C3651B); }
        input:checked + .cookie-switch-slider:before { transform: translateX(20px); }
      `;
      document.head.appendChild(style);
    }

    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('rgpdModal');
    if (modal) modal.style.display = 'none';
  }

  // Fermeture du modal au clic sur l'arrière-plan
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('rgpdModal');
    if (modal && e.target === modal) {
      closeModal();
    }
  });

  // ── Objet global BeeCookieConsent ──
  const BeeCookieConsent = {
    getConsent,
    saveConsent,
    showBanner,
    hideBanner,
    openModal,
    closeModal,
    showModal: openModal,
  };

  window.BeeCookieConsent = BeeCookieConsent;
  window.openCookiePreferences = openModal;
  window.closeCookiePreferences = closeModal;
  window.saveCustomPreferences = function (analytics, personalization) {
    saveConsent({ necessary: true, analytics, personalization });
  };
  window.saveCurrentModalPreferences = function () {
    const analytics = Boolean(document.getElementById('cookieAnalyticsToggle')?.checked);
    const personalization = Boolean(document.getElementById('cookiePersonalizationToggle')?.checked);
    saveConsent({ necessary: true, analytics, personalization });
  };

  // ── Initialisation sécurisée (résistant au chargement asynchrone) ──
  function initConsentModule() {
    const consent = getConsent();
    if (consent) {
      // Déjà validé : masquer fermement toute bannière présente dans le DOM
      const existingBanner = document.getElementById('rgpdBanner');
      if (existingBanner) {
        existingBanner.style.display = 'none';
        existingBanner.classList.remove('show');
      }
    } else {
      // Non consenti : afficher la bannière
      showBanner();
    }

    // Lier tous les liens de footer existants vers la gestion des cookies
    document.querySelectorAll('a[href="#cookies"], .btn-cookie-settings, .btn-cookie-manage, a[href="#gestion-cookies"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsentModule);
  } else {
    initConsentModule();
  }
})();
