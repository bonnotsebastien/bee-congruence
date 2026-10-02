// ════════════════════════════════════════════════════════
//  BEE Congruence — Client Supabase & Offline Demo Fallback
//  v1.02 — Monétisation + Compétences + Scénarios enrichis
// ════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://VOTRE_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'VOTRE_ANON_KEY';

// Verification des identifiants Supabase
const isSupabaseConfigured = () => {
  return (
    typeof window.supabase !== 'undefined' &&
    SUPABASE_URL &&
    !SUPABASE_URL.includes('VOTRE_PROJECT_ID') &&
    SUPABASE_ANON &&
    !SUPABASE_ANON.includes('VOTRE_ANON_KEY')
  );
};

const _supabase = isSupabaseConfigured()
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// ── Auth helpers ──────────────────────────────────────────────────

async function signUp(email, password) {
  if (!_supabase) {
    localStorage.setItem('bee_user_email', email);
    return { id: 'demo_user_' + Date.now(), email };
  }
  const { data, error } = await _supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

async function signIn(email, password) {
  if (!_supabase) {
    localStorage.setItem('bee_user_email', email);
    return { id: 'demo_user_' + Date.now(), email };
  }
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function signOut() {
  if (_supabase) {
    await _supabase.auth.signOut().catch(() => {});
  }
  localStorage.removeItem('bee_user_email');
  window.location.href = 'index.html';
}

async function getUser() {
  if (!_supabase) {
    const email = localStorage.getItem('bee_user_email');
    return email ? { id: 'demo_user', email } : null;
  }
  try {
    const { data: { user } } = await _supabase.auth.getUser();
    return user;
  } catch (e) {
    const email = localStorage.getItem('bee_user_email');
    return email ? { id: 'demo_user', email } : null;
  }
}

// ════════════════════════════════════════════════════════
//  MONÉTISATION — Gestion des accès et abonnements
// ════════════════════════════════════════════════════════

/**
 * Types d'accès possibles :
 * - 'free'        : compte gratuit, accès au scénario 0 uniquement
 * - 'monthly'     : abonnement mensuel (9€/mois), tous les scénarios
 * - 'yearly'      : abonnement annuel (79€/an), tous les scénarios + avantages
 * - 'unit:sX'     : achat unitaire du scénario sX
 */

const ACCESS_PLANS = {
  free:    { label: 'Basique',        icon: '🐝', color: '#6B7B6E' },
  monthly: { label: 'Premium Mensuel', icon: '⭐', color: '#B8935A' },
  yearly:  { label: 'Premium Annuel',  icon: '♛', color: '#8B5E52' },
};

const PRICING = {
  monthly:      9.00,
  yearly:      79.00,   // soit ~6,58€/mois, économie de 12%
  unit_default: 4.90,   // prix unitaire d'un scénario par défaut
};

/**
 * Récupère le niveau d'accès de l'utilisateur.
 * Retourne un objet { plan, expiresAt, unitPurchases: [] }
 */
async function getUserAccess(userId) {
  // Lecture locale en premier (rapide)
  const local = localStorage.getItem('bee_user_access');
  let access = local ? JSON.parse(local) : { plan: 'free', expiresAt: null, unitPurchases: [] };

  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      const { data, error } = await _supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        access = {
          plan: data.plan,
          expiresAt: data.expires_at,
          unitPurchases: data.unit_purchases || [],
        };
        localStorage.setItem('bee_user_access', JSON.stringify(access));
      }
    } catch (e) {
      // Fallback sur local
    }
  }
  return access;
}

/**
 * Vérifie si un utilisateur peut accéder à un scénario donné.
 * @param {string} scenarioId - ex: 's1', 's2'...
 * @param {object} access - résultat de getUserAccess()
 * @param {number} scenarioIndex - position dans la liste (0 = gratuit)
 * @returns {{ allowed: boolean, reason: string }}
 */
function checkScenarioAccess(scenarioId, access, scenarioIndex) {
  // Le 1er scénario (index 0) est toujours gratuit
  if (scenarioIndex === 0) {
    return { allowed: true, reason: 'free' };
  }

  // Abonnement mensuel ou annuel valide → accès total
  if (access.plan === 'monthly' || access.plan === 'yearly') {
    const now = new Date();
    const expiry = access.expiresAt ? new Date(access.expiresAt) : null;
    if (!expiry || expiry > now) {
      return { allowed: true, reason: 'subscription' };
    }
    return { allowed: false, reason: 'subscription_expired' };
  }

  // Achat unitaire
  if (access.unitPurchases && access.unitPurchases.includes(scenarioId)) {
    return { allowed: true, reason: 'unit_purchase' };
  }

  return { allowed: false, reason: 'locked' };
}

/**
 * Sauvegarde un abonnement (appelé après confirmation de paiement Stripe).
 */
async function saveSubscription(userId, plan, stripeSessionId) {
  const expiresAt = plan === 'yearly'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 30  * 24 * 60 * 60 * 1000).toISOString();

  const payload = {
    user_id:          userId,
    plan:             plan,
    expires_at:       expiresAt,
    stripe_session:   stripeSessionId || null,
    unit_purchases:   [],
    created_at:       new Date().toISOString(),
  };

  localStorage.setItem('bee_user_access', JSON.stringify({
    plan, expiresAt, unitPurchases: [],
  }));

  if (_supabase) {
    try {
      await _supabase.from('user_subscriptions').upsert(payload, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Sauvegarde abonnement Supabase ignorée.');
    }
  }
  return payload;
}

/**
 * Enregistre un achat unitaire de scénario.
 */
async function saveUnitPurchase(userId, scenarioId) {
  const access = await getUserAccess(userId);
  if (!access.unitPurchases.includes(scenarioId)) {
    access.unitPurchases.push(scenarioId);
  }
  localStorage.setItem('bee_user_access', JSON.stringify(access));

  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      await _supabase
        .from('user_subscriptions')
        .update({ unit_purchases: access.unitPurchases })
        .eq('user_id', userId);
    } catch (e) {}
  }
  return access;
}

// ════════════════════════════════════════════════════════
//  COMPÉTENCES — Référentiel & Mapping
// ════════════════════════════════════════════════════════

/**
 * Les 6 compétences entraînées, distinctes des 5 axes diagnostiques.
 * Elles évoluent avec les scénarios complétés.
 */
const SKILLS_REFERENCE = [
  { id: 'empathie',       label: 'Empathie active',          icon: '💛', color: '#B8935A' },
  { id: 'cnv',            label: 'Communication non-violente', icon: '🕊️', color: '#6B9BA4' },
  { id: 'limites',        label: 'Poses de limites',          icon: '🛡️', color: '#8B5E52' },
  { id: 'regulation',     label: 'Régulation émotionnelle',   icon: '🌊', color: '#7B748A' },
  { id: 'ancrage',        label: 'Ancrage & assertivité',     icon: '⚓', color: '#6B7B6E' },
  { id: 'confiance',      label: 'Confiance relationnelle',   icon: '🤝', color: '#8B9B6B' },
];

/**
 * Mapping : scénario_id → compétences travaillées (avec poids 1–3)
 */
const SKILLS_MAPPING = {
  s1: { empathie: 2, regulation: 3, cnv: 1 },
  s2: { limites: 3, ancrage: 2, cnv: 1 },
  s3: { cnv: 3, empathie: 2, confiance: 1 },
  s4: { confiance: 3, limites: 2, ancrage: 1 },
  s5: { cnv: 3, regulation: 2, empathie: 1 },
  s6: { limites: 3, ancrage: 3, regulation: 2 },
  s7: { empathie: 3, confiance: 2, cnv: 1 },
  s8: { empathie: 3, cnv: 2, confiance: 2, regulation: 1 },
};

/**
 * Calcule les scores de compétences à partir des scénarios terminés et des réponses réelles de l'utilisateur (réflexions & introspection).
 * @returns {{ empathie: 0–100, cnv: 0–100, ... }}
 */
function computeSkillScores(completedScenarioIds) {
  const raw = {};
  SKILLS_REFERENCE.forEach(s => { raw[s.id] = 0; });

  completedScenarioIds.forEach(sid => {
    const mapping = SKILLS_MAPPING[sid] || {};
    Object.entries(mapping).forEach(([skill, weight]) => {
      raw[skill] = (raw[skill] || 0) + weight * 12;
    });

    // Enriched from real user step reflections
    try {
      const storedRefls = localStorage.getItem(`bee_step_reflections_${sid}`);
      if (storedRefls) {
        const refls = JSON.parse(storedRefls);
        if (Array.isArray(refls)) {
          refls.forEach(r => {
            if (r.relation === 'connexion') {
              raw.empathie = (raw.empathie || 0) + 4;
              raw.ecoute_active = (raw.ecoute_active || 0) + 3;
            }
            if (r.ressenti && r.ressenti.length > 5) {
              raw.gestion_emotions = (raw.gestion_emotions || 0) + 4;
            }
            if (r.corps === 'aucune' || r.corps === 'légère') {
              raw.gestion_emotions = (raw.gestion_emotions || 0) + 3;
            }
            if (r.pense && r.pense.length > 5) {
              raw.prise_recul = (raw.prise_recul || 0) + 4;
            }
            if (r.appris && r.appris.length > 5) {
              raw.congruence = (raw.congruence || 0) + 5;
              raw.affirmation_soi = (raw.affirmation_soi || 0) + 3;
            }
            if (r.envie && r.envie.length > 5) {
              raw.cnv = (raw.cnv || 0) + 3;
            }
          });
        }
      }

      // Enriched from user's pre-scenario introspection
      const storedIntro = localStorage.getItem(`bee_intro_${sid}`);
      if (storedIntro) {
        const intro = JSON.parse(storedIntro);
        if (intro.scores) {
          if (intro.scores.clarte > 60) raw.prise_recul = (raw.prise_recul || 0) + 4;
          if (intro.scores.emotionnel > 60) raw.gestion_emotions = (raw.gestion_emotions || 0) + 4;
          if (intro.scores.corporel > 60) raw.gestion_stress = (raw.gestion_stress || 0) + 4;
        }
      }
    } catch(e) {}
  });

  // Plafonner à 100 et arrondir
  const result = {};
  SKILLS_REFERENCE.forEach(s => {
    result[s.id] = Math.min(100, Math.max(0, Math.round(raw[s.id] || 0)));
  });
  return result;
}

/**
 * Récupère l'historique des compétences pour le graphique d'évolution.
 * Retourne un tableau chronologique de snapshots.
 */
async function getSkillHistory(userId) {
  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      const { data, error } = await _supabase
        .from('skill_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {}
  }

  // Fallback : reconstituer depuis les scénarios locaux
  const stored = localStorage.getItem('bee_user_scenarios');
  if (!stored) return [];
  try {
    const scenarios = JSON.parse(stored);
    const history = [];
    const completed = [];
    scenarios.forEach((s, i) => {
      if (s.statut === 'termine') {
        completed.push(s.scenario_id || s.id);
        history.push({
          recorded_at: s.updated_at || new Date(Date.now() - (scenarios.length - i) * 86400000).toISOString(),
          skills: computeSkillScores([...completed]),
          scenario_label: s.titre,
        });
      }
    });
    return history;
  } catch (e) { return []; }
}

/**
 * Sauvegarde un snapshot de compétences.
 */
async function saveSkillSnapshot(userId, skills, scenarioId) {
  const payload = {
    user_id:     userId,
    skills,
    scenario_id: scenarioId,
    recorded_at: new Date().toISOString(),
  };
  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      await _supabase.from('skill_history').insert(payload);
    } catch (e) {}
  }
}

// ════════════════════════════════════════════════════════
//  BIBLIOTHÈQUE DE SCÉNARIOS — Enrichie (7 sections)
// ════════════════════════════════════════════════════════

const SCENARIOS_LIBRARY = [
  {
    id: 's1',
    index: 0,
    gratuit: true,
    prix_unitaire: 0,
    titre: '"Tu es trop sensible."',
    theme: 'validation_emotionnelle',
    difficulte: 1,
    duree_estimee: '10–15 min',
    description: 'Apprendre à répondre sans se fermer quand vos émotions sont minimisées.',
    reaction_auto: 'Se fermer émotionnellement et éviter le conflit.',
    reponse_saine: '«\u00a0Quand mes émotions sont minimisées, je me sens incompris. J\'aimerais qu\'on puisse en parler autrement.\u00a0»',
    competences: ['empathie', 'regulation', 'cnv'],
    // ── Sections détaillées ──
    introduction: 'La dévalorisation émotionnelle est l\'une des formes les plus courantes et les plus douloureuses d\'incompréhension relationnelle. Lorsque quelqu\'un vous dit «\u00a0tu es trop sensible\u00a0», votre système émotionnel perçoit une double menace : la situation déclenchante ET la négation de votre vécu. Ce scénario vous entraîne à rester présent à vous-même tout en maintenant le lien avec l\'autre.',
    objectifs: [
      'Identifier votre réaction automatique face à la minimisation émotionnelle',
      'Nommer votre vécu sans vous effondrer ni contre-attaquer',
      'Formuler un besoin de reconnaissance sans exiger ni supplier',
      'Rester en lien relationnel malgré la blessure',
    ],
    mise_en_situation: 'Vous rentrez du travail épuisé(e) après une journée difficile. Vous essayez de partager vos frustrations avec votre partenaire ou un proche. Au bout de quelques phrases, l\'autre vous interrompt et dit d\'un ton légèrement agacé :\n\n«\u00a0— Tu es vraiment trop sensible. Tout le monde a des journées difficiles, tu sais.\u00a0»\n\nVous ressentez immédiatement un mouvement intérieur : quelque chose se ferme, ou au contraire monte.',
    deroulé: [
      { etape: 1, titre: 'Observer sans agir', contenu: 'Avant de répondre, prenez 3 secondes. Que se passe-t-il en vous ? Identifiez le sentiment dominant : honte, colère, tristesse, déception ?' },
      { etape: 2, titre: 'Nommer le vécu', contenu: 'Énoncez ce que vous ressentez en «\u00a0je\u00a0» sans accuser. Ex : «\u00a0Je me sens incompris(e) quand tu dis ça.\u00a0»' },
      { etape: 3, titre: 'Exprimer le besoin', contenu: 'Ce dont vous avez besoin n\'est pas que l\'autre change d\'avis, mais qu\'il entende. Ex : «\u00a0J\'aurais besoin qu\'on puisse parler de ce que je vis sans que ça soit minimisé.\u00a0»' },
      { etape: 4, titre: 'Tenir sans forcer', contenu: 'Si l\'autre se braque, vous n\'avez pas à insister. Vous pouvez dire : «\u00a0Ok, c\'est pas le bon moment. Je reviendrai là-dessus plus tard.\u00a0» et partir sans claquer la porte.' },
    ],
    feedback_attendu: 'Une réponse saine dans ce scénario :\n✓ Utilise le «\u00a0je\u00a0» et non le «\u00a0tu\u00a0»\n✓ Ne nie pas les paroles de l\'autre\n✓ Exprime un besoin sans ultimatum\n✓ Reste dans le dialogue sans se soumettre\n\n❌ À éviter :\n— «\u00a0Et toi tu n\'es jamais sensible peut-être ?\u00a0» (contre-attaque)\n— Silence total et retrait (évitement)\n— «\u00a0Tu as raison, désolé(e)\u00a0» (capitulation)',
    conseils_expert: '💡 La minimisation émotionnelle vient souvent d\'une personne qui elle-même a appris à ne pas montrer ses émotions. Ce n\'est pas une intention de blesser — c\'est une limite de son propre répertoire affectif. Nommer votre vécu avec calme crée parfois une ouverture que la plainte ou le retrait ne peuvent pas créer.\n\n🔑 Mot-clé : la reconnaissance n\'est pas la validation. Vous pouvez exprimer votre désaccord sur la forme (je ne suis pas «\u00a0trop\u00a0» sensible) tout en reconnaissant que l\'autre a peut-être lui-même quelque chose à dire.',
  },
  {
    id: 's2',
    index: 1,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Je t\'avais pourtant demandé de ne pas faire ça."',
    theme: 'limites',
    difficulte: 2,
    duree_estimee: '12–18 min',
    description: 'Poser une limite claire sans attaque ni capitulation.',
    reaction_auto: 'S\'excuser excessivement ou contre-attaquer.',
    reponse_saine: '«\u00a0Tu as raison, j\'aurais dû respecter ça. Je comprends ta frustration et je vais faire attention.\u00a0»',
    competences: ['limites', 'ancrage', 'cnv'],
    introduction: 'Quand une limite est franchie, la tendance est double : soit on minimise («\u00a0ce n\'est pas grave\u00a0»), soit on explose («\u00a0je te l\'avais dit !\u00a0»). Ce scénario vous entraîne à tenir votre position avec fermeté et douceur simultanément.',
    objectifs: [
      'Reconnaître une limite franchie sans dramatiser',
      'Exprimer la conséquence sans punir',
      'Réaffirmer la limite pour l\'avenir',
      'Recevoir une excuse ou un refus d\'excuse avec équanimité',
    ],
    mise_en_situation: 'Vous avez clairement demandé à votre partenaire / coloc / ami(e) de ne pas parler de votre situation professionnelle à vos parents. Lors d\'un repas de famille, vous découvrez qu\'il ou elle l\'a quand même mentionné. Après le repas, vous vous retrouvez seul(e) avec cette personne.',
    deroulé: [
      { etape: 1, titre: 'Accueillir la situation', contenu: 'Nommez les faits sans jugement de valeur. «\u00a0Tu as mentionné ma situation au travail ce soir, alors qu\'on avait convenu de ne pas en parler.\u00a0»' },
      { etape: 2, titre: 'Exprimer l\'impact', contenu: 'Dites ce que ça a produit en vous : gêne, sentiment de trahison, embarras. Sans exagérer, sans minimiser.' },
      { etape: 3, titre: 'Réaffirmer la limite', contenu: 'De façon calme et ferme : «\u00a0Je voudrais qu\'à l\'avenir ce sujet reste entre nous.\u00a0»' },
      { etape: 4, titre: 'Gérer la réponse', contenu: 'Si l\'autre s\'excuse : accueillez-le avec sincérité. Si l\'autre se justifie : ne relancez pas le débat. Votre limite reste votre limite.' },
    ],
    feedback_attendu: '✓ Les faits sont énoncés clairement\n✓ La limite est reformulée pour l\'avenir\n✓ Pas de reproches accumulés («\u00a0et en plus tu toujours...\u00a0»)\n\n❌ À éviter :\n— La bouderie silencieuse\n— Le discours moralisateur\n— La capitulation par peur du conflit',
    conseils_expert: '💡 Poser une limite n\'est pas un acte de guerre — c\'est un acte de confiance. Vous signifiez à l\'autre que vous prenez la relation assez au sérieux pour lui dire la vérité sur vos besoins.\n\n🔑 La limite n\'a pas besoin d\'être justifiée. «\u00a0C\'est important pour moi\u00a0» est une raison suffisante.',
  },
  {
    id: 's3',
    index: 2,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Tu ne m\'écoutes jamais."',
    theme: 'communication',
    difficulte: 2,
    duree_estimee: '12–18 min',
    description: 'Désamorcer une généralisation blessante avec empathie et clarté.',
    reaction_auto: 'Se défendre avec des contre-exemples ou se taire.',
    reponse_saine: '«\u00a0Je t\'entends. Raconte-moi ce qui s\'est passé récemment qui t\'a donné ce sentiment.\u00a0»',
    competences: ['cnv', 'empathie', 'confiance'],
    introduction: 'Les généralisations («\u00a0toujours\u00a0», «\u00a0jamais\u00a0») sont des cris déguisés. Derrière «\u00a0tu ne m\'écoutes jamais\u00a0» se cache un besoin d\'être entendu qui n\'a pas été satisfait. Ce scénario vous apprend à ne pas répondre à la généralisation mais à la douleur qui la produit.',
    objectifs: [
      'Ne pas entrer dans le débat des «\u00a0toujours/jamais\u00a0»',
      'Accueillir la douleur derrière la généralisation',
      'Créer un espace d\'écoute authentique',
      'Clarifier votre perception sans vous défendre',
    ],
    mise_en_situation: 'Lors d\'une conversation tendue, votre partenaire ou ami(e) pose les bras, vous regarde et dit avec une pointe de lassitude :\n\n«\u00a0— Tu ne m\'écoutes jamais. J\'ai l\'impression de parler dans le vide.\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Résister à l\'impulsion', contenu: 'Votre premier réflexe est de vous défendre («\u00a0c\'est faux, j\'écoute !\u00a0»). Respirez. La défense ferme la conversation.' },
      { etape: 2, titre: 'Accueillir le sentiment', contenu: '«\u00a0Je t\'entends, et je sens que c\'est important pour toi.\u00a0» Validez sans forcément valider le contenu («\u00a0jamais\u00a0»).' },
      { etape: 3, titre: 'Ouvrir la curiosité', contenu: '«\u00a0Raconte-moi ce qui s\'est passé récemment qui t\'a donné ce sentiment.\u00a0» Passez du général au spécifique.' },
      { etape: 4, titre: 'Clarifier votre intention', contenu: 'Si l\'autre vous donne un exemple, écoutez vraiment. Puis, si pertinent : «\u00a0Je vois ce que tu veux dire. Ce soir-là, j\'aurais pu être plus présent(e).\u00a0»' },
    ],
    feedback_attendu: '✓ Pas de contre-attaque sur «\u00a0jamais\u00a0»\n✓ Curiosité sincère exprimée\n✓ Écoute active (reformulation possible)\n\n❌ À éviter :\n— La liste de preuves du contraire\n— Le silence coupable\n— «\u00a0Tu exagères\u00a0»',
    conseils_expert: '💡 Répondre à une généralisation par des exemples contraires est logiquement juste et émotionnellement désastreux. L\'autre n\'est pas en train de faire un bilan factuel — il ou elle exprime une douleur.\n\n🔑 La question «\u00a0Qu\'est-ce qui s\'est passé récemment ?\u00a0» est l\'une des plus puissantes de la communication non-violente. Elle ramène la conversation du terrain abstrait au terrain concret.',
  },
  {
    id: 's4',
    index: 3,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Je pensais qu\'on était amis."',
    theme: 'attachement',
    difficulte: 3,
    duree_estimee: '15–20 min',
    description: 'Clarifier les attentes émotionnelles et relationnelles sans culpabiliser ni se suradapter.',
    reaction_auto: 'Se sentir coupable et sur-compenser ou se distancer.',
    reponse_saine: '«\u00a0On l\'est. Et justement parce qu\'on l\'est, je veux être honnête sur ce que je peux donner en ce moment.\u00a0»',
    competences: ['confiance', 'limites', 'ancrage'],
    introduction: 'Ce type de phrase active souvent un cocktail : culpabilité, incompréhension, et sentiment d\'être injustement accusé(e). Ce scénario vous entraîne à rester ancré(e) dans votre propre vérité relationnelle tout en reconnaissant celle de l\'autre.',
    objectifs: [
      'Identifier la culpabilisation implicite',
      'Ne pas sur-compenser ni vous défendre',
      'Affirmer la relation sans nier vos limites',
      'Proposer ce qui est possible au lieu de promettre l\'impossible',
    ],
    mise_en_situation: 'Un(e) ami(e) vous reproche de ne pas avoir été disponible lors d\'une période difficile pour lui/elle. Vous avez vos propres raisons (surcharge, distance, besoin de ressourcement). Il/elle vous dit avec une blessure palpable :\n\n«\u00a0— Je pensais qu\'on était amis. Vrais amis.\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Accueillir sans plier', contenu: 'Ni capitulation («\u00a0tu as raison, je suis horrible\u00a0») ni contre-attaque («\u00a0et toi tu as toujours été là ?\u00a0»). Restez debout, restez doux(ce).' },
      { etape: 2, titre: 'Affirmer le lien', contenu: '«\u00a0On l\'est. Cette relation compte vraiment pour moi.\u00a0» C\'est votre vérité — dites-la.' },
      { etape: 3, titre: 'Nommer votre limite sans vous excuser d\'exister', contenu: '«\u00a0En ce moment, je traverse moi-même quelque chose qui m\'a empêché d\'être disponible comme j\'aurais voulu l\'être.\u00a0»' },
      { etape: 4, titre: 'Proposer le possible', contenu: '«\u00a0Je ne veux pas te promettre quelque chose que je ne pourrais pas tenir. Mais je veux qu\'on trouve comment rester connectés.\u00a0»' },
    ],
    feedback_attendu: '✓ Le lien est affirmé sans conditions\n✓ La limite est nommée sans honte\n✓ Une ouverture est proposée\n\n❌ À éviter :\n— «\u00a0Pardon, tu as raison, je suis nul(le)\u00a0» (capitulation)\n— Argumenter sur ce qu\'on a ou n\'a pas fait\n— Se distancer par protection',
    conseils_expert: '💡 L\'ami(e) qui dit «\u00a0je pensais qu\'on était amis\u00a0» a besoin d\'être rassuré(e), pas jugé(e). Mais rassuré sans que vous vous trahissiez.\n\n🔑 Être un ami, ce n\'est pas être disponible 24h/24. C\'est être honnête sur ce qu\'on peut donner.',
  },
  {
    id: 's5',
    index: 4,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Tu fais toujours ça."',
    theme: 'communication',
    difficulte: 2,
    duree_estimee: '10–15 min',
    description: 'Répondre à une généralisation sans entrer dans une logique défensive.',
    reaction_auto: 'Nier ou ressortir des contre-exemples pour se défendre.',
    reponse_saine: '«\u00a0J\'entends que ça t\'arrive souvent de vivre ça avec moi. C\'est quoi le dernier exemple qui t\'a touché ?\u00a0»',
    competences: ['cnv', 'regulation', 'empathie'],
    introduction: 'La généralisation «\u00a0tu fais toujours ça\u00a0» est un signal d\'alarme : quelque chose s\'accumule depuis longtemps. Ce scénario vous entraîne à ouvrir la conversation plutôt qu\'à la refermer.',
    objectifs: [
      'Ne pas entrer dans le débat «\u00a0c\'est vrai / c\'est faux\u00a0»',
      'Identifier ce qui se cache derrière la généralisation',
      'Inviter à l\'exemple concret',
      'Rester disponible sans vous soumettre',
    ],
    mise_en_situation: 'Votre partenaire ou un proche vous reproche quelque chose que vous venez de faire. Après votre explication, il/elle lève les bras :\n\n«\u00a0— Tu fais toujours ça. À chaque fois c\'est la même chose.\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Ne pas relever «\u00a0toujours\u00a0»', contenu: 'Répondre «\u00a0non c\'est faux\u00a0» ferme la conversation immédiatement. Laissez passer le mot.' },
      { etape: 2, titre: 'Valider le ressenti', contenu: '«\u00a0J\'entends que ça t\'arrive souvent de vivre ça avec moi.\u00a0» C\'est sa vérité — elle est valide même si la généralisation est imprécise.' },
      { etape: 3, titre: 'Aller au concret', contenu: '«\u00a0C\'est quoi le dernier exemple qui t\'a touché ?\u00a0» Le concret désarme la spirale.' },
      { etape: 4, titre: 'Écouter vraiment', contenu: 'Quand l\'exemple vient, écoutez sans préparer votre réponse. Reformulez si nécessaire.' },
    ],
    feedback_attendu: '✓ La généralisation n\'est pas combattue\n✓ Un exemple concret est demandé\n✓ Curiosité sincère\n\n❌ À éviter :\n— La liste de contre-preuves\n— «\u00a0Tu exagères comme d\'habitude\u00a0»\n— Le silence hostile',
    conseils_expert: '💡 «\u00a0Toujours\u00a0» et «\u00a0jamais\u00a0» sont des hyperboles émotionnelles. Elles signifient : «\u00a0ça arrive assez souvent pour que je sois épuisé(e)\u00a0». Ce n\'est pas un procès — c\'est une fatigue.\n\n🔑 La question «\u00a0c\'est quoi le dernier exemple ?\u00a0» est un outil magique : elle ramène la conversation du procès au dialogue.',
  },
  {
    id: 's6',
    index: 5,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Si tu m\'aimais vraiment, tu ferais ça pour moi."',
    theme: 'limites',
    difficulte: 3,
    duree_estimee: '15–20 min',
    description: 'Identifier et déjouer la manipulation affective sans rupture.',
    reaction_auto: 'Céder par culpabilité ou se braquer complètement.',
    reponse_saine: '«\u00a0Mon amour pour toi ne dépend pas de cette action. Mais je veux comprendre pourquoi c\'est important pour toi.\u00a0»',
    competences: ['limites', 'ancrage', 'regulation'],
    introduction: 'Le chantage affectif lie la preuve d\'amour à une action spécifique. C\'est une des formes relationnelles les plus difficiles à déjouer car elle active simultanément le désir de prouver qu\'on aime et la peur de perdre l\'autre.',
    objectifs: [
      'Identifier le mécanisme de chantage affectif',
      'Déconstruire le lien «\u00a0amour = compliance\u00a0»',
      'Rester dans le lien sans céder',
      'Comprendre le besoin sous-jacent',
    ],
    mise_en_situation: 'Vous avez refusé quelque chose que votre partenaire ou proche vous demandait (peu importe la nature). Il/elle vous regarde avec une combinaison de douleur et de défi :\n\n«\u00a0— Si tu m\'aimais vraiment, tu ferais ça pour moi.\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Ne pas mordre à l\'hameçon', contenu: 'Le piège est de devoir «\u00a0prouver\u00a0» votre amour en cédant. Résistez à cette logique.' },
      { etape: 2, titre: 'Déconstruire le lien', contenu: '«\u00a0Mon amour pour toi ne dépend pas de cette action.\u00a0» Posez cela clairement, sans agressivité.' },
      { etape: 3, titre: 'Aller vers le besoin réel', contenu: '«\u00a0Mais je veux comprendre pourquoi c\'est si important pour toi.\u00a0» Souvent, derrière le chantage, il y a une peur légitime.' },
      { etape: 4, titre: 'Tenir la limite, garder le lien', contenu: 'Si le refus demeure, il peut être maintenu avec douceur. «\u00a0Je ne peux pas faire ça, mais je suis là pour toi.\u00a0»' },
    ],
    feedback_attendu: '✓ Le lien amour ↔ action est déconstruit\n✓ La limite est maintenue\n✓ La curiosité pour le besoin réel est exprimée\n\n❌ À éviter :\n— Céder par culpabilité\n— «\u00a0C\'est du chantage !\u00a0» (accusation frontale)\n— Se murer dans le silence',
    conseils_expert: '💡 Derrière «\u00a0si tu m\'aimais\u00a0» se cache souvent «\u00a0j\'ai peur que tu ne m\'aimes pas\u00a0». La réassurance directe («\u00a0je t\'aime\u00a0») peut parfois suffire, mais elle ne doit pas être utilisée pour court-circuiter votre propre décision.\n\n🔑 Vous pouvez aimer quelqu\'un et ne pas faire ce qu\'il demande. Ce sont deux choses distinctes.',
  },
  {
    id: 's7',
    index: 6,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Je vais bien." (alors que manifestement non)',
    theme: 'empathie',
    difficulte: 2,
    duree_estimee: '10–15 min',
    description: 'Créer un espace sécurisant pour que l\'autre puisse s\'ouvrir.',
    reaction_auto: 'Prendre la réponse au pied de la lettre ou insister maladroitement.',
    reponse_saine: '«\u00a0Je te crois. Et si un jour tu as envie de parler, je suis là sans jugement.\u00a0»',
    competences: ['empathie', 'confiance', 'cnv'],
    introduction: 'Quand quelqu\'un dit «\u00a0je vais bien\u00a0» alors que tout son corps dit le contraire, deux mauvaises réponses s\'imposent : croire et passer à autre chose, ou insister maladroitement. Ce scénario vous apprend à créer un espace sans forcer l\'entrée.',
    objectifs: [
      'Lire les signaux non-verbaux sans les nommer brutalement',
      'Créer un espace sécurisant sans invasion',
      'Formuler une présence disponible sans pression',
      'Respecter le rythme de l\'autre',
    ],
    mise_en_situation: 'Vous retrouvez un(e) ami(e), un membre de la famille ou votre partenaire. Quelque chose dans son attitude — les yeux, la tension dans les épaules, un silence pesant — vous dit que quelque chose ne va pas. Vous demandez doucement :\n\n«\u00a0— Ça va ?\u00a0»\n\nIl/elle répond avec un sourire qui ne monte pas jusqu\'aux yeux :\n\n«\u00a0— Oui, ça va.\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Ne pas insister sur le diagnostic', contenu: 'Évitez «\u00a0non, tu n\'as pas l\'air bien\u00a0». Ça peut être vécu comme une intrusion.' },
      { etape: 2, titre: 'Valider ce qui a été dit', contenu: '«\u00a0Je te crois.\u00a0» Simple, sans ironie, sans sous-entendus.' },
      { etape: 3, titre: 'Ouvrir une porte sans pousser', contenu: '«\u00a0Et si jamais tu as envie de parler d\'autre chose ou de ce qui se passe, je suis là.\u00a0»' },
      { etape: 4, titre: 'Laisser vivre le silence', contenu: 'Parfois, rien ne se passe. Et c\'est ok. Votre présence a été posée. Ça peut faire son chemin.' },
    ],
    feedback_attendu: '✓ La réponse de l\'autre est respectée\n✓ Une ouverture est proposée sans forcer\n✓ Pas de «\u00a0tu es sûr(e) ?\u00a0» répété\n\n❌ À éviter :\n— «\u00a0Non, je vois bien que ça ne va pas\u00a0»\n— Changer de sujet trop vite\n— Surprotéger ou surinterprêter',
    conseils_expert: '💡 L\'empathie n\'est pas une intrusion. Elle s\'invite, elle ne s\'impose pas. Créer un espace sécurisant, c\'est souvent juste dire «\u00a0je suis là\u00a0» sans exiger que l\'autre entre dans cet espace immédiatement.\n\n🔑 La confiance se construit dans la répétition. Si vous avez dit «\u00a0je suis là\u00a0» cinq fois sans jamais juger, la sixième fois l\'autre ouvrira peut-être la porte.',
  },
  {
    id: 's8',
    index: 7,
    gratuit: false,
    prix_unitaire: 4.90,
    titre: '"Tu m\'as blessé(e) l\'autre jour."',
    theme: 'validation_emotionnelle',
    difficulte: 3,
    duree_estimee: '15–20 min',
    description: 'Accueillir une plainte sans se défendre, s\'effondrer ou minimiser.',
    reaction_auto: 'Justifier son comportement immédiatement ou s\'excuser sans comprendre.',
    reponse_saine: '«\u00a0Merci de me le dire. Je veux comprendre ce que j\'ai fait pour que tu te sentes ainsi.\u00a0»',
    competences: ['empathie', 'cnv', 'confiance', 'regulation'],
    introduction: 'Entendre qu\'on a blessé quelqu\'un active presque immédiatement deux mécanismes de protection : la justification («\u00a0ce n\'était pas mon intention\u00a0») ou l\'effondrement («\u00a0je suis horrible\u00a0»). Ce scénario vous apprend à rester présent(e) et curieux(se) face à la blessure de l\'autre.',
    objectifs: [
      'Accueillir sans se défendre',
      'Remercier pour l\'honnêteté plutôt que de la redouter',
      'Comprendre avant d\'expliquer',
      'Formuler une vraie réparation (pas juste des excuses)',
    ],
    mise_en_situation: 'Lors d\'une conversation calme, votre partenaire, ami(e) ou collègue prend une voix posée et vous dit :\n\n«\u00a0— Je voulais te dire... tu m\'as blessé(e) l\'autre jour. Quand tu as dit [X].\u00a0»',
    deroulé: [
      { etape: 1, titre: 'Résister à la justification immédiate', contenu: 'Votre première impulsion est d\'expliquer pourquoi vous avez fait ou dit ce que vous avez fait. Attendez. Ce n\'est pas le moment.' },
      { etape: 2, titre: 'Remercier pour l\'ouverture', contenu: '«\u00a0Merci de me le dire.\u00a0» Ce n\'est pas anodin de partager une blessure. Accueillez-le.' },
      { etape: 3, titre: 'Comprendre avant tout', contenu: '«\u00a0Je veux comprendre ce que j\'ai fait pour que tu te sentes ainsi.\u00a0» Posez la question. Écoutez vraiment.' },
      { etape: 4, titre: 'Réparer avec intention', contenu: 'Une fois que vous avez compris, une excuse sincère peut venir. «\u00a0Je suis désolé(e). Ce n\'était pas mon intention, mais je comprends l\'effet que ça a eu.\u00a0»' },
    ],
    feedback_attendu: '✓ Pas de justification immédiate\n✓ Remerciement pour l\'honnêteté\n✓ Curiosité authentique avant excuse\n✓ Excuse basée sur la compréhension, pas sur la culpabilité\n\n❌ À éviter :\n— «\u00a0Ce n\'était vraiment pas mon intention\u00a0» (en premier)\n— S\'effondrer : «\u00a0je suis vraiment nul(le)\u00a0»\n— Minimiser : «\u00a0c\'était une blague\u00a0»',
    conseils_expert: '💡 «\u00a0Merci de me le dire\u00a0» est l\'une des phrases les plus désarmantes et les plus puissantes qu\'on puisse dire. Elle transforme une confrontation en invitation.\n\n🔑 L\'intention ne détermine pas l\'impact. Vous pouvez avoir eu la meilleure intention du monde et avoir blessé quelqu\'un. Les deux sont vrais simultanément.',
  },
];

// ── Recommendation engine ──────────────────────────────────────────

function recommendScenarios(scores) {
  const mapping = {
    axe1: ['attachement', 'validation_emotionnelle'],
    axe2: ['limites', 'communication'],
    axe3: ['communication', 'empathie'],
    axe4: ['limites', 'attachement'],
    axe5: ['empathie', 'validation_emotionnelle'],
  };

  let recommended = new Set();
  if (scores) {
    Object.entries(scores).forEach(([axe, pct]) => {
      if (pct > 50 && mapping[axe]) {
        mapping[axe].forEach(theme => {
          SCENARIOS_LIBRARY
            .filter(s => s.theme === theme)
            .forEach(s => recommended.add(s.id));
        });
      }
    });
  }

  if (recommended.size < 3) {
    SCENARIOS_LIBRARY.slice(0, 4).forEach(s => recommended.add(s.id));
  }

  return SCENARIOS_LIBRARY
    .filter(s => recommended.has(s.id))
    .sort((a, b) => a.index - b.index);
}

async function saveUserScenarios(userId, diagnosticId, scores) {
  const recommended = recommendScenarios(scores);
  const rows = recommended.map((s, i) => ({
    id:            'user_scen_' + (i + 1),
    user_id:       userId || 'demo_user',
    diagnostic_id: diagnosticId || 'demo_diag',
    scenario_id:   s.id,
    titre:         s.titre,
    theme:         s.theme,
    difficulte:    s.difficulte,
    description:   s.description,
    reaction_auto: s.reaction_auto,
    reponse_saine: s.reponse_saine,
    competences:   s.competences || [],
    statut:        i === 0 ? 'disponible' : 'verrouille',
    ordre:         i,
  }));

  localStorage.setItem('bee_user_scenarios', JSON.stringify(rows));

  if (_supabase) {
    try {
      const { data, error } = await _supabase
        .from('user_scenarios')
        .insert(rows)
        .select();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Sauvegarde scénarios Supabase ignorée (mode démo local).');
    }
  }

  return rows;
}

async function getUserScenarios(userId) {
  if (_supabase) {
    try {
      const { data, error } = await _supabase
        .from('user_scenarios')
        .select('*')
        .eq('user_id', userId)
        .order('ordre', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {}
  }

  // Fallback local
  const stored = localStorage.getItem('bee_user_scenarios');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

  // Générer des scénarios démo par défaut si aucun n'existe
  const defaultDiag = localStorage.getItem('bee_latest_diag');
  const scores = defaultDiag ? JSON.parse(defaultDiag).scores : { axe1: 65, axe2: 70 };
  return saveUserScenarios(userId, 'demo_diag', scores);
}

async function updateScenarioStatus(scenarioRowId, statut) {
  // Update local storage
  const stored = localStorage.getItem('bee_user_scenarios');
  if (stored) {
    try {
      let scenarios = JSON.parse(stored);
      scenarios = scenarios.map(s => s.id === scenarioRowId
        ? { ...s, statut, updated_at: new Date().toISOString() }
        : s
      );
      localStorage.setItem('bee_user_scenarios', JSON.stringify(scenarios));
    } catch (e) {}
  }

  if (_supabase) {
    try {
      await _supabase
        .from('user_scenarios')
        .update({ statut, updated_at: new Date().toISOString() })
        .eq('id', scenarioRowId);
    } catch (e) {}
  }
}

// ── Diagnostic results ────────────────────────────────────────────

async function saveDiagnosticResults(userId, scores, axisLabels) {
  const payload = {
    id:          'diag_' + Date.now(),
    user_id:     userId || 'demo_user',
    scores:      scores,
    axis_labels: axisLabels,
    completed_at: new Date().toISOString(),
  };

  localStorage.setItem('bee_latest_diag', JSON.stringify(payload));

  if (_supabase) {
    try {
      const { data, error } = await _supabase
        .from('diagnostic_results')
        .insert(payload)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase non joignable, enregistrement en local uniquement.', err);
    }
  }

  return payload;
}

async function getDiagnosticResults(userId) {
  if (_supabase) {
    try {
      const { data, error } = await _supabase
        .from('diagnostic_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('Erreur lecture Supabase, bascule sur les données locales.');
    }
  }

  // Lire les deux sources locales (rétrocompatibilité)
  const results = [];

  // Source 1 : bee_diagnostic_results (nouveau format tableau)
  try {
    const stored = localStorage.getItem('bee_diagnostic_results');
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr) && arr.length > 0) {
        results.push(...arr);
      }
    }
  } catch(e) {}

  // Source 2 : bee_latest_diag (ancien format objet simple)
  if (results.length === 0) {
    try {
      const stored = localStorage.getItem('bee_latest_diag');
      if (stored) {
        const obj = JSON.parse(stored);
        if (obj && obj.scores) results.push(obj);
      }
    } catch(e) {}
  }

  // Trier par date décroissante
  results.sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));

  return results;
}


// ════════════════════════════════════════════════════════
//  v1.03 — PROFIL UTILISATEUR (âge, préférences)
// ════════════════════════════════════════════════════════

async function saveUserProfile(userId, profileData) {
  const payload = {
    user_id: userId,
    ...profileData,
    updated_at: new Date().toISOString(),
  };
  const existing = localStorage.getItem('bee_user_profile');
  const merged   = existing ? { ...JSON.parse(existing), ...payload } : payload;
  localStorage.setItem('bee_user_profile', JSON.stringify(merged));

  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      await _supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('saveUserProfile remote error:', e);
    }
  }
  return merged;
}

async function getUserProfile(userId) {
  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      const { data, error } = await _supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) {
        localStorage.setItem('bee_user_profile', JSON.stringify(data));
        return data;
      }
    } catch (e) {}
  }
  const local = localStorage.getItem('bee_user_profile');
  return local ? JSON.parse(local) : { age_group: 'adulte' };
}

// ════════════════════════════════════════════════════════
//  v1.03 — SESSIONS D'INTROSPECTION
// ════════════════════════════════════════════════════════

async function saveIntroSession(userId, scenarioId, introData) {
  const payload = {
    user_id:     userId,
    scenario_id: scenarioId,
    intro_data:  introData,
    created_at:  new Date().toISOString(),
  };
  localStorage.setItem(`bee_intro_${scenarioId}`, JSON.stringify({ ...introData, scenario_id: scenarioId }));

  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      await _supabase.from('intro_sessions').insert(payload);
    } catch (e) {
      console.warn('saveIntroSession remote error:', e);
    }
  }
  return payload;
}

async function getIntroSession(userId, scenarioId) {
  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      const { data, error } = await _supabase
        .from('intro_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) return data.intro_data;
    } catch (e) {}
  }
  const local = localStorage.getItem(`bee_intro_${scenarioId}`);
  return local ? JSON.parse(local) : null;
}

// ════════════════════════════════════════════════════════
//  v1.03 — RÉFLEXIONS PAR ÉTAPE
// ════════════════════════════════════════════════════════

async function saveStepReflectionDB(userId, scenarioId, stepIndex, reflectionData) {
  const payload = {
    user_id:     userId,
    scenario_id: scenarioId,
    step_index:  stepIndex,
    reflection:  reflectionData,
    created_at:  new Date().toISOString(),
  };
  // Local
  let all = {};
  try {
    const stored = localStorage.getItem(`bee_step_reflections_${scenarioId}`);
    all = stored ? JSON.parse(stored) : {};
  } catch (e) {}
  all[stepIndex] = { ...reflectionData, step: stepIndex, timestamp: new Date().toISOString() };
  localStorage.setItem(`bee_step_reflections_${scenarioId}`, JSON.stringify(all));

  // Remote
  if (_supabase && userId && !userId.startsWith('demo')) {
    try {
      await _supabase.from('step_reflections').insert(payload);
    } catch (e) {
      console.warn('saveStepReflectionDB remote error:', e);
    }
  }
  return all;
}

// ════════════════════════════════════════════════════════
//  v1.03 — SYNCHRONISATION MULTI-APPAREILS
// ════════════════════════════════════════════════════════

async function upsertSyncState(userId, stateData) {
  if (!_supabase || !userId || userId.startsWith('demo')) return;
  try {
    await _supabase.from('user_sync_state').upsert({
      user_id:   userId,
      ...stateData,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('upsertSyncState error:', e);
  }
}

async function getSyncState(userId) {
  if (!_supabase || !userId || userId.startsWith('demo')) return null;
  try {
    const { data, error } = await _supabase
      .from('user_sync_state')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!error && data) return data;
  } catch (e) {}
  return null;
}
