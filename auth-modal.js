// ════════════════════════════════════════════════════════
//  BEE Congruence — Post-Diagnostic Auth Modal
// ════════════════════════════════════════════════════════

function beeAuthOpen(scores, axeLabels) {
  // Store latest diagnostic in localStorage for instant offline/demo usage
  const diagData = {
    scores: scores,
    axis_labels: axeLabels,
    completed_at: new Date().toISOString()
  };
  localStorage.setItem('bee_latest_diag', JSON.stringify(diagData));

  // Check if modal container exists or create it
  let modal = document.getElementById('beeAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'beeAuthModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px; padding:36px 32px; background:var(--warm-white, #FDFAF6); border-radius:24px; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:36px; margin-bottom:8px;">🐝</div>
        <h2 style="font-family:'Playfair Display',serif; font-size:24px; color:var(--ink, #1A1612); margin-bottom:8px;">Enregistrez votre profil</h2>
        <p style="font-size:14px; color:var(--brown-mid, #5C5349); line-height:1.6;">
          Vos résultats sont prêts ! Créez votre compte gratuit pour accéder à vos <strong>scénarios d'entraînement interactifs</strong> personnalisés.
        </p>
      </div>

      <form id="beeAuthForm" onsubmit="handleBeeAuthSubmit(event)">
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--brown-mid, #5C5349); margin-bottom:6px;">Adresse Email</label>
          <input type="email" id="beeAuthEmail" required placeholder="votre@email.com" style="width:100%; padding:14px 18px; border-radius:12px; border:1px solid rgba(26,22,18,0.15); background:white; font-family:inherit; font-size:14px; outline:none;" />
        </div>
        <div style="margin-bottom:24px;">
          <label style="display:block; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--brown-mid, #5C5349); margin-bottom:6px;">Mot de passe (optionnel pour la démo)</label>
          <input type="password" id="beeAuthPassword" placeholder="••••••••" style="width:100%; padding:14px 18px; border-radius:12px; border:1px solid rgba(26,22,18,0.15); background:white; font-family:inherit; font-size:14px; outline:none;" />
        </div>

        <button type="submit" class="btn-primary btn-full btn-lg" style="width:100%; justify-content:center; background:var(--orange, #C3651B); color:white; border-radius:50px; padding:14px; font-weight:700; cursor:pointer;">
          Découvrir mon profil de congruence →
        </button>
      </form>

      <div style="text-align:center; margin-top:16px;">
        <button type="button" onclick="closeBeeAuthModal()" style="background:none; border:none; color:var(--brown-light, #8C8275); font-size:13px; cursor:pointer; text-decoration:underline;">
          Continuer sans sauvegarder
        </button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeBeeAuthModal() {
  const modal = document.getElementById('beeAuthModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

async function handleBeeAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('beeAuthEmail').value;
  const password = document.getElementById('beeAuthPassword').value || 'demo123456';

  if (!email || !email.includes('@')) {
    if (typeof showToast === 'function') {
      showToast('Veuillez saisir une adresse email valide.', 'warning');
    } else {
      alert('Veuillez saisir une adresse email valide.');
    }
    return;
  }


  // Save email to localStorage session
  localStorage.setItem('bee_user_email', email);

  // Attempt Supabase save if available
  const storedDiag = localStorage.getItem('bee_latest_diag');
  if (storedDiag && typeof _supabase !== 'undefined' && typeof signUp === 'function') {
    try {
      const diag = JSON.parse(storedDiag);
      let user;
      try {
        user = await signUp(email, password);
      } catch (authErr) {
        user = await signIn(email, password).catch(() => null);
      }
      if (user && user.id) {
        const resultRow = await saveDiagnosticResults(user.id, diag.scores, diag.axis_labels);
        if (resultRow && resultRow.id) {
          await saveUserScenarios(user.id, resultRow.id, diag.scores);
        }
      }
    } catch (e) {
      console.log('Supabase demo mode active (saved locally).');
    }
  }

  closeBeeAuthModal();
  
  // Redirect to dashboard
  if (window.parent && window.parent !== window) {
    window.parent.location.href = 'dashboard.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}
