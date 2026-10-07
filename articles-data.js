// ════════════════════════════════════════════════════════════════
// BEE Congruence — Base centralisée des Articles du Blog / Guilde
// ════════════════════════════════════════════════════════════════

const BEE_ARTICLES_CATALOG = [
  {
    id: 'est-ce-vraiment-ma-reaction-histoire-familiale-relations',
    url: '/articles/est-ce-vraiment-ma-reaction-histoire-familiale-relations',
    title: 'Est-ce vraiment ma réaction ? Quand notre histoire familiale continue d’agir dans nos relations',
    excerpt: 'Quelqu’un vous reproche quelque chose et, en quelques secondes, votre réaction s\'enflamme. Découvrez comment les schémas et habitudes relationnelles apprises dans l\'enfance influencent nos automatismes, et comment retrouver votre liberté de choix.',
    category: 'Parentalité & Famille',
    date: '5 octobre 2026',
    dateIso: '2026-10-05',
    readTime: '4 min',
    featured: true,
    image: '/histoire-familiale-relations.jpg',
    tags: ['Histoire familiale', 'Transgénérationnel', 'Réflexes relationnels', 'Relations saines', 'Congruence']
  },
  {
    id: 'pourquoi-je-reagis-plus-fort-que-la-situation-ne-le-merite',
    url: '/articles/pourquoi-je-reagis-plus-fort-que-la-situation-ne-le-merite',
    title: 'Pourquoi je réagis plus fort que la situation ne le mérite ?',
    excerpt: 'Une remarque banale, un message qui tarde, un ton différent… et soudain tout s’allume. Découvrez comment distinguer le fait de l’interprétation et retrouver l’espace du choix avant de réagir.',
    category: 'Intelligence émotionnelle',
    date: '30 septembre 2026',
    dateIso: '2026-09-30',
    readTime: '2 min',
    featured: false,
    image: '/pourquoi-je-reagis-plus-fort.jpg',
    tags: ['Intelligence émotionnelle', 'Réflexes relationnels', 'Automatisme', 'Pause consciente', 'Congruence']
  },
  {
    id: 'piliers-dev-perso',
    url: '/articles.html#piliers-dev-perso',
    title: 'Les 7 piliers du développement personnel : la clé d’une vie alignée',
    excerpt: 'Le développement personnel est souvent perçu comme une quête complexe, un idéal lointain vers lequel on avance à tâtons. Pourtant, son efficacité repose sur des bases simples et structurées.',
    category: 'Développement personnel',
    date: '28 septembre 2026',
    dateIso: '2026-09-28',
    readTime: '6 min',
    featured: false,
    image: '/pourquoi-je-reagis-plus-fort.jpg',
    tags: ['Connaissance de soi', 'Émotions', 'Objectifs', 'Discipline', 'Corps & Esprit', 'Relations', 'Action'],
    content: `
      <p>Le développement personnel est souvent perçu comme une quête complexe, un idéal lointain vers lequel on avance à tâtons. Pourtant, son efficacité repose sur des bases simples et structurées. Pour transformer sa vie de manière durable et trouver un véritable équilibre, il s’avère essentiel de s’appuyer sur des fondations solides.</p>
      <p>Découvrez les 7 piliers incontournables du développement personnel et comment les activer pour vivre en parfaite cohérence avec vous-même.</p>

      <h2>1. La connaissance de soi</h2>
      <p>Impossible de savoir où l'on va si l'on ignore qui l'on est. Ce premier pilier consiste à explorer ses forces, ses vulnérabilités, ses besoins fondamentaux et ses valeurs motrices. Mieux se connaître permet de faire des choix conscients et de ne plus vivre en mode automatique.</p>

      <h2>2. La gestion et la compréhension des émotions</h2>
      <p>Les émotions ne sont pas des obstacles, mais des messagères. Apprendre à identifier et accueillir ses réactions émotionnelles permet de décoder ce qu'elles tentent de nous dire (comme un besoin non satisfait). C'est en développant cette intelligence émotionnelle que l’on évite les réactions disproportionnées : pour approfondir cette dynamique, consultez notre guide <a href="/articles/pourquoi-je-reagis-plus-fort-que-la-situation-ne-le-merite" class="seo-context-link" title="Comprendre pourquoi on réagit plus fort que la situation ne le mérite">pourquoi je réagis plus fort que la situation ne le mérite ?</a>.</p>

      <h2>3. La vision et la clarté des objectifs</h2>
      <p>L’ambition sans direction s'éparpille. Ce pilier demande de définir des buts précis, mesurables et surtout alignés avec vos valeurs profondes. Avoir une vision claire donne un sens à chaque action quotidienne.</p>

      <h2>4. La motivation et la discipline</h2>
      <p>Si la motivation est l'étincelle qui fait démarrer le moteur, la discipline est le carburant qui permet de tenir sur la distance. Cultiver de bonnes habitudes et une régularité, même les jours sans inspiration, est le secret de toute transformation durable.</p>

      <h2>5. L'équilibre du corps et de l'esprit</h2>
      <p>Le développement personnel est une approche globale. Prendre soin de sa santé physique, de son sommeil, de son alimentation et s'accorder des moments de reconnexion mentale est indispensable. Un esprit serein ne peut s'épanouir durablement que dans un corps respecté.</p>

      <h2>6. La qualité des relations et l'harmonie relationnelle</h2>
      <p>Nous sommes des êtres de lien. Le sixième pilier concerne notre capacité à interagir avec le monde. Il s’agit d’apprendre à exprimer ses besoins avec clarté, à poser des limites fermes mais bienveillantes, et à désamorcer les conflits latents. Lorsque l'on sait interagir sainement avec les autres, on crée des connexions sincères et profondes. Or, nos réflexes de communication sont souvent imprégnés par nos transmissions invisibles : découvrez notre analyse sur <a href="/articles/est-ce-vraiment-ma-reaction-histoire-familiale-relations" class="seo-context-link" title="Quand notre histoire familiale continue d'agir dans nos relations">l'impact de l'histoire familiale dans nos réactions relationnelles</a>.</p>

      <h2>7. L'action et l'amélioration continue</h2>
      <p>La théorie ne remplace jamais l’expérience. Ce dernier pilier invite à oser passer à l'action au présent, à accepter de faire des erreurs et à ajuster sa trajectoire en permanence. C'est l’art d’avancer pas à pas vers une amélioration continue.</p>

      <h2>Passer de la théorie à la congruence</h2>
      <p>Le point commun entre tous ces piliers ? <strong>L’alignement</strong>. Lorsque vos pensées, vos émotions et vos actions avancent dans la même direction, vous atteignez un état de congruence indispensable à votre paix intérieure.</p>
      <p>Si vous ressentez le besoin d'explorer plus particulièrement les dimensions émotionnelles et relationnelles de votre vie, une approche pas à pas basée sur des outils concrets d'entraînement et d'écoute de soi s'avère souvent le meilleur déclic pour débloquer votre potentiel.</p>

      <!-- Cluster de maillage sémantique UnveilSEO -->
      <div class="seo-cluster-box" style="margin-top:36px;">
        <div class="seo-cluster-header">
          <h3 class="seo-cluster-title">🔍 Approfondir par thématique</h3>
          <span class="seo-cluster-badge">Maillage sémantique</span>
        </div>
        <div class="seo-cluster-list">
          <a href="/articles/pourquoi-je-reagis-plus-fort-que-la-situation-ne-le-merite" class="seo-cluster-item">
            <div>
              <div class="seo-cluster-item-title">Pourquoi je réagis plus fort que la situation ne le mérite ?</div>
              <div class="seo-cluster-item-desc">Distinguer fait et interprétation pour désamorcer l'emballement relationnel en 30 secondes.</div>
            </div>
            <div class="seo-cluster-item-meta">Intelligence émotionnelle · 2 min →</div>
          </a>
          <a href="/articles/est-ce-vraiment-ma-reaction-histoire-familiale-relations" class="seo-cluster-item">
            <div>
              <div class="seo-cluster-item-title">Est-ce vraiment ma réaction ? Histoire familiale</div>
              <div class="seo-cluster-item-desc">Comprendre comment les réflexes appris dans l'enfance influencent nos automatismes d'adulte.</div>
            </div>
            <div class="seo-cluster-item-meta">Parentalité &amp; Famille · 4 min →</div>
          </a>
        </div>
      </div>
    `
  }
];

// Helper global pour récupérer tous les articles
function getBeeArticlesCatalog() {
  // Récupérer d'éventuels articles publiés dynamiquement dans localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const custom = JSON.parse(window.localStorage.getItem('bee_custom_articles') || '[]');
      if (Array.isArray(custom) && custom.length > 0) {
        const merged = [...custom, ...BEE_ARTICLES_CATALOG];
        // Dédupliquer par id
        const seen = new Set();
        return merged.filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
      }
    }
  } catch (e) {}
  return BEE_ARTICLES_CATALOG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BEE_ARTICLES_CATALOG, getBeeArticlesCatalog };
}
