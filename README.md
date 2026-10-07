# 🐝 BEE Congruence — Équilibre & Harmonie Relationnelle

Plateforme interactive d'évaluation et d'entraînement émotionnel et relationnel fondée sur 3 piliers : **Poser ses limites**, **Communiquer avec clarté**, et **Créer des connexions sincères**.

---

## 📁 Structure des Fichiers du Site Statique

Le site statique repose sur la structure de fichiers HTML/CSS/JS suivante :

| Fichier | Rôle & Contenu |
| :--- | :--- |
| **`index.html`** | Page d'accueil avec refonte éditoriale, clarification des promesses, hiérarchie visuelle des CTA orientée vers le diagnostic gratuit et preuve sociale. |
| **`questionnaire.html`** | Questionnaire d'auto-évaluation pleine page (5 axes & 14 compétences relationnelles) avec affichage du modal d'authentification post-diagnostic. |
| **`connexion.html`** | Page de connexion dédiée permettant d'accéder directement à son espace profil et à ses scénarios d'entraînement. |
| **`inscription.html`** | Page d'inscription pour créer un compte gratuit et rejoindre la ruche. |
| **`approche.html`** | Présentation pédagogique de la méthode de la ruche, des 3 piliers et du positionnement pour toute la famille (dès 6 ans). |
| **`offres.html`** | Présentation détaillée des formules et tarifs (Découverte, Essentiel, Intégral). |
| **`dashboard.html`** | Espace profil / tableau de bord utilisateur intégrant la carte du profil, la visualisation du graphique **Radar SVG** à 5 axes et les cartes de scénarios d'entraînement interactifs. |
| **`auth-modal.js`** | Composant modal JavaScript réutilisable pour la création de compte / connexion post-diagnostic, avec synchronisation cloud et fallback local. |
| **`nav.js`** | Gestion dynamique de la barre de navigation, du menu responsive mobile et des états actifs des pages. |
| **`supabase.js`** | Client Supabase d'authentification et de stockage des diagnostics/scénarios, avec bascule automatique en **mode démo offline (`localStorage`)**. |
| **`styles.css`** | Feuille de style globale unifiée (variables HSL, typographie Playfair/Lora/Nunito, carte des compétences, responsive layout, animations). |
| **`logo.svg`** | Logo officiel vectoriel BEE Congruence. |
| **`vercel.json`** | Fichier de configuration Vercel gérant les URL propres (Clean URLs) et les alias de domaine (`www.beecongruence.com` & `beecongruence.com`). |
| **`README.md`** | Le présent document de synthèse et guide d'administration / déploiement. |

---

## 🔑 Placeholders et Configuration des Services (À Configurer)

Le site est conçu pour fonctionner immédiatement en **mode démo autonome** sans aucune configuration préalable. Pour connecter vos services cloud de production, remplacez les identifiants en placeholder dans les fichiers suivants :

### 1. Supabase (Base de données & Authentification)
Dans le fichier [`supabase.js`](file:///Users/sebastienbonnot/CloudStation/Documents/Pro/CONSULTANT%20-%20gestion%20de%20projet%20-%20societe%20et%20humain/1%20-%20BEE%20Congruence%20-%20Interactif%20relation%20saine/site%20bee-congruence/BEE_Congruence.1.01/supabase.js#L5-L6) :
```javascript
// Lignes 5 et 6 de supabase.js
const SUPABASE_URL  = 'https://VOTRE_PROJECT_ID.supabase.co'; // Remplacez par l'URL de votre projet Supabase
const SUPABASE_ANON = 'VOTRE_ANON_KEY';                        // Remplacez par la clé anonyme/publique API Supabase
```

> **Mode Offline / Démo** : Tant que ces deux constantes contiennent `VOTRE_PROJECT_ID` ou `VOTRE_ANON_KEY`, le script bascule automatiquement sur `localStorage`. Les utilisateurs peuvent faire le diagnostic, enregistrer leur email et consulter leur profil sans blocage.

### 2. EmailJS (Optionnel - Formulaires de Contact & Waitlist)
Si vous utilisez EmailJS pour recevoir les emails de la liste d'attente ou du formulaire de contact :
- Insérez vos identifiants `SERVICE_ID`, `TEMPLATE_ID` et `PUBLIC_KEY` dans le script d'envoi de `index.html` ou `offres.html`.

---

## 🗄️ Fichiers de Base de Données (Côté Supabase)

Les scripts de base de données s'exécutent **uniquement côté Supabase** et sont indépendants du déploiement du site statique :

1. **`schema.sql`** : À exécuter dans l'éditeur SQL de votre projet Supabase (`SQL Editor`) pour créer les tables :
   - `diagnostic_results` (scores par axe, axis_labels, completed_at)
   - `scenarios` & `user_scenarios` (progression et déblocage des scénarios)
   - Policies RLS (Row Level Security) pour la sécurité des accès utilisateur.
2. **`scenarios_batch_1.json`** : Batch des scénarios rédigés et pondérés à importer dans la table `scenarios` via l'interface Supabase ou via un script d'import.

---

## 🚀 Déploiement du Site Web Statique (Vercel)

Le déploiement sur Vercel à destination de `https://www.beecongruence.com/` est configuré via [`vercel.json`](file:///Users/sebastienbonnot/CloudStation/Documents/Pro/CONSULTANT%20-%20gestion%20de%20projet%20-%20societe%20et%20humain/1%20-%20BEE%20Congruence%20-%20Interactif%20relation%20saine/site%20bee-congruence/BEE_Congruence.1.01/vercel.json).

Pour déployer manuellement via le terminal :
```bash
npx vercel --prod --yes
```

Les routes sont automatiquement gérées de manière propre (`cleanUrls: true`) :
- `https://www.beecongruence.com/` → `index.html`
- `https://www.beecongruence.com/connexion` → `connexion.html`
- `https://www.beecongruence.com/inscription` → `inscription.html`
- `https://www.beecongruence.com/questionnaire` → `questionnaire.html`
- `https://www.beecongruence.com/approche` → `approche.html`
- `https://www.beecongruence.com/offres` → `offres.html`
- `https://www.beecongruence.com/dashboard` → `dashboard.html`

---
© BEE Congruence — Équilibre & Harmonie Relationnelle
