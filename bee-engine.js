// ════════════════════════════════════════════════════════
//  BEE Congruence — Engine v1.03
//  Moteur partagé : TTS · Adaptation âge · Sync · Diagnostic
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
//  1. ADAPTATION ÂGE
// ════════════════════════════════════════════════════════

const AGE_CONFIG = {
  enfant: {
    label: '🐣 Enfant',
    ttsRate: 0.8,
    ttsPitch: 1.2,
    fontSize: 'large',
    bodyClass: 'age-enfant',
    // Variantes de texte simplifiées
    texts: {
      'Mise en situation': 'Voici ce qui se passe',
      'Déroulé complet': 'Ce qu\'on va faire',
      'Feedback attendu': 'Ce qu\'on aurait pu dire',
      'Conseils d\'expert': 'Le conseil du jour',
      'Qu\'as-tu ressenti ?': 'Comment tu t\'es senti(e) ?',
      'Qu\'as-tu pensé ?': 'À quoi tu as pensé ?',
      'Qu\'as-tu appris sur toi-même ?': 'Qu\'est-ce que tu as découvert sur toi ?',
    },
  },
  ado: {
    label: '🌱 Adolescent',
    ttsRate: 0.9,
    ttsPitch: 1.0,
    bodyClass: 'age-ado',
    texts: {},
  },
  adulte: {
    label: '🌿 Adulte',
    ttsRate: 1.0,
    ttsPitch: 1.0,
    bodyClass: 'age-adulte',
    texts: {},
  },
  senior: {
    label: '🌳 Senior',
    ttsRate: 0.85,
    ttsPitch: 0.95,
    bodyClass: 'age-senior',
    texts: {},
  },
};

/**
 * Applique la classe d'âge sur le body.
 */
function applyAgeClass() {
  const profile = getUserProfileLocal();
  const group   = profile.age_group || 'adulte';
  const config  = AGE_CONFIG[group] || AGE_CONFIG.adulte;

  // Retirer les classes existantes
  Object.values(AGE_CONFIG).forEach(c => document.body.classList.remove(c.bodyClass));
  document.body.classList.add(config.bodyClass);

  return config;
}

/**
 * Retourne le profil utilisateur depuis le localStorage (synchrone).
 */
function getUserProfileLocal() {
  try {
    const stored = localStorage.getItem('bee_user_profile');
    return stored ? JSON.parse(stored) : { age_group: 'adulte' };
  } catch (e) {
    return { age_group: 'adulte' };
  }
}

/**
 * Remplace les textes d'un élément selon la tranche d'âge.
 * Parcourt les data-age-key pour substituer si nécessaire.
 */
function adaptTextsForAge() {
  const profile = getUserProfileLocal();
  const group   = profile.age_group || 'adulte';
  const config  = AGE_CONFIG[group] || AGE_CONFIG.adulte;
  if (!config.texts || Object.keys(config.texts).length === 0) return;

  document.querySelectorAll('[data-age-key]').forEach(el => {
    const key = el.getAttribute('data-age-key');
    if (config.texts[key]) el.textContent = config.texts[key];
  });
}

// ════════════════════════════════════════════════════════
//  2. TTS — TEXT TO SPEECH ENGINE
// ════════════════════════════════════════════════════════

let ttsUtterance = null;
let ttsCurrentText = '';
let ttsIsPaused = false;

const TTS = {
  /**
   * Lance la lecture d'un texte.
   * @param {string} text - Texte à lire
   * @param {object} [opts] - Options (rate, pitch, lang)
   */
  speak(text, opts = {}) {
    if (!window.speechSynthesis) return;
    this.stop();

    const profile = getUserProfileLocal();
    const group   = profile.age_group || 'adulte';
    const config  = AGE_CONFIG[group] || AGE_CONFIG.adulte;

    ttsUtterance = new SpeechSynthesisUtterance(text);
    ttsUtterance.lang  = opts.lang  || 'fr-FR';
    ttsUtterance.rate  = opts.rate  || config.ttsRate  || 1.0;
    ttsUtterance.pitch = opts.pitch || config.ttsPitch || 1.0;

    ttsUtterance.onstart = () => {
      ttsCurrentText = text;
      ttsIsPaused    = false;
      document.querySelectorAll('.tts-btn[data-action="play"]').forEach(b => b.classList.add('playing'));
    };
    ttsUtterance.onend = () => {
      ttsIsPaused = false;
      document.querySelectorAll('.tts-btn[data-action="play"]').forEach(b => b.classList.remove('playing'));
      localStorage.setItem('bee_tts_position', '');
    };
    ttsUtterance.onerror = () => {
      console.warn('TTS error');
    };

    window.speechSynthesis.speak(ttsUtterance);
  },

  pause() {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      ttsIsPaused = true;
    }
  },

  resume() {
    if (window.speechSynthesis && ttsIsPaused) {
      window.speechSynthesis.resume();
      ttsIsPaused = false;
    }
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      ttsIsPaused = false;
      ttsCurrentText = '';
      document.querySelectorAll('.tts-btn[data-action="play"]').forEach(b => b.classList.remove('playing'));
    }
  },

  toggle(text) {
    if (!window.speechSynthesis) {
      alert('La synthèse vocale n\'est pas supportée par votre navigateur.');
      return;
    }
    if (window.speechSynthesis.speaking && !ttsIsPaused) {
      if (ttsCurrentText === text) {
        this.pause();
        return;
      }
      this.stop();
    } else if (ttsIsPaused) {
      this.resume();
      return;
    }
    this.speak(text);
  },

  isSupported() {
    return 'speechSynthesis' in window;
  },
};

/**
 * Crée le widget TTS persistant (injecté dans le DOM).
 * @param {function} getTextFn - Fonction retournant le texte de la section courante
 */
function createTTSPlayer(getTextFn) {
  if (!TTS.isSupported()) return;

  const player = document.createElement('div');
  player.className = 'tts-player';
  player.id = 'ttsPlayer';
  player.innerHTML = `
    <span class="tts-label">🔊 Audio</span>
    <button class="tts-btn" data-action="play" title="Écouter / Pause"
            onclick="TTSPlayerToggle()">▶</button>
    <button class="tts-btn" title="Arrêter"
            onclick="TTS.stop()">⏹</button>
  `;
  document.body.appendChild(player);

  window.TTSPlayerToggle = function() {
    const text = typeof getTextFn === 'function' ? getTextFn() : '';
    if (text) TTS.toggle(text);
  };
}

// ════════════════════════════════════════════════════════
//  3. SYNCHRONISATION MULTI-APPAREILS
// ════════════════════════════════════════════════════════

/**
 * Gestionnaire de synchronisation.
 * Utilise Supabase Realtime si disponible, sinon localStorage.
 */
const SyncManager = {
  channel: null,

  /**
   * Démarre la synchronisation en temps réel pour un utilisateur.
   * @param {string} userId
   */
  async start(userId) {
    // Uploader l'état local vers Supabase au démarrage
    await this.pushLocalState(userId);

    // Écouter les changements distants (Supabase Realtime)
    if (typeof _supabase !== 'undefined' && _supabase) {
      try {
        this.channel = _supabase
          .channel(`bee-user-${userId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_sync_state',
            filter: `user_id=eq.${userId}`,
          }, payload => {
            this.onRemoteChange(payload);
          })
          .subscribe();
      } catch (e) {
        console.warn('Supabase Realtime non disponible, mode local.');
      }
    }
  },

  /**
   * Appelé quand un changement distant est détecté.
   */
  onRemoteChange(payload) {
    const data = payload.new;
    if (!data) return;

    // Mettre à jour le localStorage avec les données distantes
    if (data.scenarios) {
      localStorage.setItem('bee_user_scenarios', JSON.stringify(data.scenarios));
    }
    if (data.skill_scores) {
      localStorage.setItem('bee_skill_scores', JSON.stringify(data.skill_scores));
    }
    if (data.user_profile) {
      localStorage.setItem('bee_user_profile', JSON.stringify(data.user_profile));
    }

    // Notifier l'UI si on est sur le dashboard
    const evt = new CustomEvent('bee:sync', { detail: data });
    document.dispatchEvent(evt);
  },

  /**
   * Pousse l'état local vers Supabase.
   */
  async pushLocalState(userId) {
    if (typeof _supabase === 'undefined' || !_supabase) return;
    if (!userId || userId.startsWith('demo')) return;

    try {
      const scenarios   = JSON.parse(localStorage.getItem('bee_user_scenarios') || '[]');
      const profile     = JSON.parse(localStorage.getItem('bee_user_profile') || '{}');
      const skillScores = JSON.parse(localStorage.getItem('bee_skill_scores') || '{}');
      const audioPrefs  = JSON.parse(localStorage.getItem('bee_audio_prefs') || '{}');

      await _supabase.from('user_sync_state').upsert({
        user_id:    userId,
        scenarios,
        user_profile: profile,
        skill_scores: skillScores,
        audio_prefs:  audioPrefs,
        synced_at:    new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Sync push failed:', e);
    }
  },

  /**
   * Pull l'état depuis Supabase (reprise multi-appareils).
   */
  async pullRemoteState(userId) {
    if (typeof _supabase === 'undefined' || !_supabase) return null;
    if (!userId || userId.startsWith('demo')) return null;

    try {
      const { data, error } = await _supabase
        .from('user_sync_state')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        // Fusionner avec l'état local (remote gagne sur les conflits)
        if (data.scenarios?.length) {
          localStorage.setItem('bee_user_scenarios', JSON.stringify(data.scenarios));
        }
        if (data.user_profile) {
          localStorage.setItem('bee_user_profile', JSON.stringify(data.user_profile));
        }
        if (data.skill_scores) {
          localStorage.setItem('bee_skill_scores', JSON.stringify(data.skill_scores));
        }
        if (data.audio_prefs) {
          localStorage.setItem('bee_audio_prefs', JSON.stringify(data.audio_prefs));
        }
        return data;
      }
    } catch (e) {}
    return null;
  },

  stop() {
    if (this.channel && typeof _supabase !== 'undefined' && _supabase) {
      _supabase.removeChannel(this.channel);
      this.channel = null;
    }
  },

  /**
   * Affiche l'indicateur de sync dans le DOM.
   */
  showIndicator(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="sync-indicator">
        <span class="sync-dot"></span>
        Synchronisé
      </div>
    `;
  },
};

// ════════════════════════════════════════════════════════
//  4. MOTEUR DIAGNOSTIC DYNAMIQUE
// ════════════════════════════════════════════════════════

/**
 * Génère un diagnostic personnalisé à partir des données utilisateur.
 * @param {object} params
 * @returns {object} Diagnostic complet
 */
function generateDynamicDiagnostic(params = {}) {
  const {
    diagScores = {},         // Scores des 5 axes (0–100)
    skillScores = {},        // Scores des 6 compétences
    stepReflections = [],    // Réponses d'introspection par étape
    introData = null,        // Données d'introspection initiale
    completedScenarios = [], // Scénarios terminés
  } = params;

  const profile = getUserProfileLocal();
  const ageGroup = profile.age_group || 'adulte';

  // ── Identifier les points forts ──
  const strengths = [];
  const growthAreas = [];
  const patterns = [];

  // Analyser les compétences
  Object.entries(skillScores).forEach(([skill, score]) => {
    const skillRef = (typeof SKILLS_REFERENCE !== 'undefined' ? SKILLS_REFERENCE : [])
      .find(s => s.id === skill);
    const label = skillRef ? skillRef.label : skill;

    if (score >= 65) {
      strengths.push({ skill, label, score, type: 'strength' });
    } else if (score <= 35) {
      growthAreas.push({ skill, label, score, type: 'growth' });
    }
  });

  // Analyser les réponses d'introspection (patterns récurrents)
  const allTexts = stepReflections.map(r =>
    [r.ressenti, r.pensee, r.apprentissage].filter(Boolean).join(' ')
  ).join(' ').toLowerCase();

  if (allTexts.includes('colère') || allTexts.includes('frustrat')) {
    patterns.push({ type: 'pattern', label: 'Expression émotionnelle',
      text: 'Des émotions intenses comme la colère ou la frustration apparaissent régulièrement dans vos réponses. C\'est un signal important de votre vivant intérieur.' });
  }
  if (allTexts.includes('peur') || allTexts.includes('anxieu') || allTexts.includes('stres')) {
    patterns.push({ type: 'pattern', label: 'Gestion de l\'anxiété',
      text: 'L\'anxiété semble être un compagnon fréquent. Explorer vos mécanismes de régulation peut être une priorité.' });
  }
  if (allTexts.includes('confian') || allTexts.includes('asserti')) {
    patterns.push({ type: 'pattern', label: 'Affirmation de soi',
      text: 'Les thèmes de confiance et d\'affirmation de soi ressortent souvent. C\'est une compétence en développement chez vous.' });
  }

  // ── Analyser l'évolution émotionnelle ──
  let emotionalEvolution = null;
  if (introData && stepReflections.length > 0) {
    const startIntensity = introData.intensite || 5;
    const avgReflectionScore = stepReflections.reduce((acc, r) => {
      const bodyScore = r.corps === 'aucune' ? 8 : r.corps === 'legere' ? 5 : 3;
      return acc + bodyScore;
    }, 0) / (stepReflections.length || 1);

    emotionalEvolution = {
      start: startIntensity * 10,
      end: Math.min(100, Math.round(avgReflectionScore * 10)),
      trend: avgReflectionScore > 5 ? 'positive' : 'stable',
    };
  }

  // ── Construire le rapport final ──
  const rapport = {
    generated_at: new Date().toISOString(),
    age_group: ageGroup,
    strengths: strengths.slice(0, 3),
    growth_areas: growthAreas.slice(0, 3),
    patterns,
    emotional_evolution: emotionalEvolution,
    scenarios_completed: completedScenarios.length,
    overall_score: Object.values(skillScores).length
      ? Math.round(Object.values(skillScores).reduce((a, b) => a + b, 0) / Object.values(skillScores).length)
      : 0,
  };

  // Sauvegarder
  localStorage.setItem('bee_dynamic_diagnostic', JSON.stringify(rapport));
  return rapport;
}

/**
 * Génère le HTML des cartes de diagnostic dynamique.
 * @param {object} diagnostic - Résultat de generateDynamicDiagnostic()
 * @returns {string} HTML
 */
function renderDiagnosticCards(diagnostic) {
  if (!diagnostic) return '<p style="color:var(--brown-light);font-family:\'Nunito\',sans-serif;">Terminez un scénario pour voir votre diagnostic personnalisé.</p>';

  let html = '';

  // Points forts
  diagnostic.strengths.forEach(s => {
    html += `
      <div class="diag-card strength">
        <div class="diag-card-label">✨ Point fort</div>
        <div class="diag-card-value">${s.label}</div>
        <div class="diag-card-text">
          Cette compétence est bien développée chez vous (${s.score}%). 
          Continuez à l'exercer — elle est un vrai atout relationnel.
        </div>
      </div>
    `;
  });

  // Axes de développement
  diagnostic.growth_areas.forEach(g => {
    html += `
      <div class="diag-card growth">
        <div class="diag-card-label">🎯 Axe de développement</div>
        <div class="diag-card-value">${g.label}</div>
        <div class="diag-card-text">
          Cette dimension mérite votre attention (${g.score}% actuellement). 
          Les prochains scénarios cibleront particulièrement cette compétence.
        </div>
      </div>
    `;
  });

  // Schémas récurrents
  diagnostic.patterns.forEach(p => {
    html += `
      <div class="diag-card pattern">
        <div class="diag-card-label">🔄 Schéma observé — ${p.label}</div>
        <div class="diag-card-text">${p.text}</div>
      </div>
    `;
  });

  // Si aucune donnée encore
  if (!html) {
    html = `
      <div class="diag-card">
        <div class="diag-card-label">🌱 En construction</div>
        <div class="diag-card-value">Votre diagnostic se construit</div>
        <div class="diag-card-text">
          Complétez les étapes d'introspection et terminez des scénarios 
          pour obtenir un diagnostic entièrement personnalisé, basé sur vos réponses réelles.
        </div>
      </div>
    `;
  }

  return html;
}

// ════════════════════════════════════════════════════════
//  5. PRÉFÉRENCES AUDIO
// ════════════════════════════════════════════════════════

const AudioPrefs = {
  get() {
    try { return JSON.parse(localStorage.getItem('bee_audio_prefs') || '{}'); } catch { return {}; }
  },
  set(prefs) {
    const current = this.get();
    const merged  = { ...current, ...prefs };
    localStorage.setItem('bee_audio_prefs', JSON.stringify(merged));
    return merged;
  },
  isEnabled() { return this.get().enabled !== false; },
  setEnabled(val) { this.set({ enabled: val }); },
};

// ════════════════════════════════════════════════════════
//  6. INTROSPECTION DATA HELPERS
// ════════════════════════════════════════════════════════

/**
 * Sauvegarde les données d'introspection initiale.
 */
function saveIntroData(scenarioId, data) {
  localStorage.setItem(`bee_intro_${scenarioId}`, JSON.stringify({
    ...data,
    scenario_id: scenarioId,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Récupère les données d'introspection initiale.
 */
function getIntroData(scenarioId) {
  try {
    const stored = localStorage.getItem(`bee_intro_${scenarioId}`);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

/**
 * Sauvegarde les réponses d'introspection par étape.
 */
function saveStepReflection(scenarioId, stepIndex, data) {
  let reflections = getStepReflections(scenarioId);
  reflections[stepIndex] = { ...data, step: stepIndex, timestamp: new Date().toISOString() };
  localStorage.setItem(`bee_step_reflections_${scenarioId}`, JSON.stringify(reflections));
  return reflections;
}

/**
 * Récupère toutes les réflexions par étape.
 */
function getStepReflections(scenarioId) {
  try {
    const stored = localStorage.getItem(`bee_step_reflections_${scenarioId}`);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

/**
 * Calcule les scores "après" à partir des réflexions d'étape.
 */
function computeAfterScores(scenarioId, introData) {
  const reflections = Object.values(getStepReflections(scenarioId));
  if (!reflections.length) return null;

  // Relationnel : basé sur les choix "relation avec les autres"
  const relScores = reflections.map(r =>
    r.relation === 'connexion' ? 80 : r.relation === 'neutre' ? 55 : 35
  );
  const relationnel = Math.round(relScores.reduce((a, b) => a + b, 0) / relScores.length);

  // Engagement : basé sur le nombre de réponses remplies
  const filledCount = reflections.filter(r => r.ressenti || r.pensee || r.apprentissage).length;
  const engagement  = Math.round((filledCount / Math.max(reflections.length, 1)) * 100);

  // Corps : basé sur les réponses corps
  const corpsScores = reflections.map(r =>
    r.corps === 'aucune' ? 80 : r.corps === 'legere' ? 60 : 35
  );
  const corporel = Math.round(corpsScores.reduce((a, b) => a + b, 0) / corpsScores.length);

  // Mental & émotionnel : si introData disponible → comparer avec estimé final
  const mental     = introData ? Math.min(100, (introData.mental?.clarte || 5) * 10 + 10) : 65;
  const emotionnel = introData ? Math.min(100, (introData.intensite || 5) * 10) : 60;
  const confiance  = Math.round((engagement + relationnel) / 2);

  return { emotionnel, corporel, mental, relationnel, confiance, engagement };
}

// ════════════════════════════════════════════════════════
//  7. INIT GLOBAL
// ════════════════════════════════════════════════════════

/**
 * Initialise le moteur BEE sur chaque page.
 */
function beeEngineInit() {
  // Appliquer la classe d'âge
  applyAgeClass();
  adaptTextsForAge();

  // Synchronisation (si utilisateur connecté)
  const email = localStorage.getItem('bee_user_email');
  if (email) {
    SyncManager.pullRemoteState('demo_user').then(() => {
      console.log('[BEE Engine] State pulled from remote.');
    });
  }
}

// Auto-init dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', beeEngineInit);
} else {
  beeEngineInit();
}
