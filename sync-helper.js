// ════════════════════════════════════════════════════════
//  BEE Congruence — Synchronisation Mobile ⇄ Ordinateur
//  Transfère instantanément le profil, les résultats de
//  diagnostic et les scénarios sans repasser le test.
// ════════════════════════════════════════════════════════

const SYNC_STORAGE_KEYS = [
  'bee_user_email',
  'bee_latest_diag',
  'bee_diagnostic_results',
  'bee_user_profile',
  'bee_user_access',
  'bee_user_scenarios',
  'bee_skill_history',
  'bee_unlocked_scenarios',
];

/**
 * Exporte l'état local complet sous forme d'objet compact
 */
function buildSyncPayload() {
  const data = {};
  SYNC_STORAGE_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) {
      try {
        data[k] = JSON.parse(val);
      } catch (e) {
        data[k] = val;
      }
    }
  });
  return data;
}

/**
 * Génère l'URL complète avec le token de synchronisation
 */
function generateSyncUrl() {
  const data = buildSyncPayload();
  const json = JSON.stringify(data);
  const token = btoa(unescape(encodeURIComponent(json)));
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/[^/]*$/, '/dashboard.html');
  return `${origin}${path}?sync=${encodeURIComponent(token)}`;
}

/**
 * Applique les données reçues via le token de synchronisation
 */
function applySyncToken(token) {
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(token))));
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return false;

    let importedCount = 0;
    Object.entries(data).forEach(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      } else if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
      importedCount++;
    });

    // Rétrocompatibilité : s'assurer que bee_latest_diag et bee_diagnostic_results sont cohérents
    if (data.bee_latest_diag && !data.bee_diagnostic_results) {
      localStorage.setItem('bee_diagnostic_results', JSON.stringify([data.bee_latest_diag]));
    }
    if (data.bee_diagnostic_results && Array.isArray(data.bee_diagnostic_results) && !data.bee_latest_diag && data.bee_diagnostic_results.length > 0) {
      localStorage.setItem('bee_latest_diag', JSON.stringify(data.bee_diagnostic_results[0]));
    }

    return importedCount > 0;
  } catch (err) {
    console.error('Erreur import synchronisation:', err);
    return false;
  }
}

/**
 * Vérifie au chargement si un token de synchronisation est présent dans l'URL
 */
function checkAutoSync() {
  const params = new URLSearchParams(window.location.search);
  const syncToken = params.get('sync');
  if (syncToken) {
    const ok = applySyncToken(syncToken);
    if (ok) {
      // Nettoyer l'URL sans recharger
      const cleanUrl = window.location.pathname.replace(/\/[^/]*$/, '/dashboard.html');
      history.replaceState({}, '', cleanUrl);
      if (typeof showToast === 'function') {
        showToast('🎉 Mobile relié avec succès ! Tous vos résultats sont synchronisés.', 'success', 6000);
      }
      return true;
    }
  }
  return false;
}

// ── Modale QR Code (ordinateur) ──
let qrInstance = null;

function openSyncModal() {
  const modal = document.getElementById('syncModal');
  if (!modal) return;

  const url = generateSyncUrl();
  const input = document.getElementById('syncLinkInput');
  if (input) input.value = url;

  const qrContainer = document.getElementById('syncQrCode');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      qrInstance = new QRCode(qrContainer, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#1A1612',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } else {
      qrContainer.innerHTML = '<p style="color:var(--brown-light);font-size:12px;">QR Code non disponible</p>';
    }
  }

  modal.style.display = 'flex';
}

function closeSyncModal() {
  const modal = document.getElementById('syncModal');
  if (modal) modal.style.display = 'none';
}

function copySyncLink() {
  const input = document.getElementById('syncLinkInput');
  if (!input) return;
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    if (typeof showToast === 'function') {
      showToast('📋 Lien de synchronisation copié !', 'success', 3000);
    }
  }).catch(() => {
    document.execCommand('copy');
    if (typeof showToast === 'function') {
      showToast('📋 Lien de synchronisation copié !', 'success', 3000);
    }
  });
}

// ── Modale Coller le lien (mobile) ──
function openPasteSyncModal() {
  const modal = document.getElementById('pasteSyncModal');
  if (modal) modal.style.display = 'flex';
}

function closePasteSyncModal() {
  const modal = document.getElementById('pasteSyncModal');
  if (modal) modal.style.display = 'none';
}

function applyPastedSync() {
  const input = document.getElementById('pasteSyncInput');
  if (!input) return;
  let val = input.value.trim();
  if (!val) return;

  // Si c'est une URL complète, extraire ?sync=...
  if (val.includes('sync=')) {
    try {
      const u = new URL(val);
      val = u.searchParams.get('sync') || val;
    } catch (e) {
      const match = val.match(/sync=([^&]+)/);
      if (match) val = match[1];
    }
  }

  const ok = applySyncToken(val);
  if (ok) {
    closePasteSyncModal();
    if (typeof showToast === 'function') {
      showToast('🎉 Synchronisation réussie ! Chargement de votre profil…', 'success', 2000);
    }
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  } else {
    alert('Le code ou lien de synchronisation est invalide ou corrompu.');
  }
}
