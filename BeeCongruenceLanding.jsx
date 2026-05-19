import { useState, useEffect, useRef, useCallback } from "react";

const colors = {
  cream: "#FFFDF5",
  honey: "#F5C842",
  honeyLight: "#FFF3B0",
  honeyDeep: "#C99A0A",
  dark: "#1A1208",
  darkMid: "#2E2210",
  gray: "#6B6252",
  grayLight: "#EDE8DC",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${colors.cream};
    color: ${colors.dark};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .serif { font-family: 'Playfair Display', serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 0.6; }
    50%  { transform: scale(1.1); opacity: 0.2; }
    100% { transform: scale(0.9); opacity: 0.6; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(26, 18, 8, 0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 24px 16px;
    animation: overlayIn 0.25s ease forwards;
    overflow-y: auto;
  }
  .modal-box {
    background: #FFFDF5;
    border-radius: 24px;
    width: 100%; max-width: 880px;
    overflow: hidden;
    animation: modalIn 0.3s cubic-bezier(.4,0,.2,1) forwards;
    display: flex; flex-direction: column;
    flex-shrink: 0;
    margin: auto;
  }
  .modal-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.grayLight};
    background: ${colors.dark};
    color: white;
    flex-shrink: 0;
  }
  .modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: transparent; color: white;
    font-size: 20px; cursor: pointer; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.1); }

  .fade-up { animation: fadeUp 0.7s ease forwards; }
  .float-anim { animation: float 5s ease-in-out infinite; }

  .cta-btn {
    background: ${colors.honey};
    color: ${colors.dark};
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 16px;
    padding: 16px 32px;
    border-radius: 100px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .cta-btn:hover {
    transform: scale(1.04);
    box-shadow: 0 8px 32px rgba(245,200,66,0.4);
  }
  .ghost-btn {
    background: transparent;
    color: ${colors.dark};
    border: 1.5px solid ${colors.dark};
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    font-size: 15px;
    padding: 14px 28px;
    border-radius: 100px;
    transition: background 0.2s, color 0.2s;
  }
  .ghost-btn:hover {
    background: ${colors.dark};
    color: ${colors.cream};
  }

  .section-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${colors.honeyLight};
    border: 1px solid ${colors.honey};
    color: ${colors.honeyDeep};
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 100px;
    margin-bottom: 24px;
  }

  input[type="email"] {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 16px 22px;
    border: 1.5px solid ${colors.grayLight};
    border-radius: 100px;
    outline: none;
    background: white;
    transition: border-color 0.2s;
    width: 100%;
  }
  input[type="email"]:focus { border-color: ${colors.honey}; }

  .progress-bar-bg {
    width: 100%;
    height: 6px;
    background: ${colors.grayLight};
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: ${colors.honey};
    transition: width 1.4s cubic-bezier(.4,0,.2,1);
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${colors.grayLight}; border-radius: 3px; }
`;

function AnimOnScroll({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? undefined : 0, animation: visible ? `fadeUp 0.65s ease ${delay}s forwards` : "none", ...style }}>
      {children}
    </div>
  );
}

function HeroCard() {
  const bars = [
    { label: "Évitement émotionnel", pct: 78, color: colors.dark },
    { label: "Besoin de validation",  pct: 62, color: colors.honey },
    { label: "Communication saine",   pct: 41, color: "#B4B2A9" },
  ];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 600); return () => clearTimeout(t); }, []);
  return (
    <div style={{ background: colors.honeyLight, borderRadius: 32, padding: 28, border: `1px solid ${colors.honey}`, boxShadow: "0 24px 80px rgba(197,154,10,0.15)" }} className="float-anim">
      <div style={{ background: "white", borderRadius: 22, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: colors.gray, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Votre profil relationnel</p>
            <h3 style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Protecteur émotionnel</h3>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: colors.honeyLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🐝</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {bars.map((b, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: colors.gray }}>{b.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{b.pct}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: animated ? `${b.pct}%` : "0%", background: b.color }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: "14px 18px", background: colors.honeyLight, borderRadius: 16, border: `1px solid ${colors.honey}` }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: colors.honeyDeep, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Exercice recommandé</p>
          <p style={{ fontSize: 13, color: colors.dark, lineHeight: 1.5 }}>Apprendre à exprimer un besoin sans peur du rejet.</p>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard() {
  return (
    <div style={{ background: colors.dark, borderRadius: 28, padding: 32, color: "white" }}>
      <p style={{ fontSize: 11, letterSpacing: "0.14em", color: colors.honey, textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Scénario interactif</p>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>"Tu es trop sensible."</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 11, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Réaction automatique</p>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Se fermer émotionnellement et éviter le conflit.</p>
        </div>
        <div style={{ background: colors.honey, borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 11, color: colors.honeyDeep, marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>Réponse saine proposée</p>
          <p style={{ fontSize: 14, color: colors.dark, lineHeight: 1.55 }}>"Quand mes émotions sont minimisées, je me sens incompris. J'aimerais qu'on puisse en parler autrement."</p>
        </div>
      </div>
      <button className="ghost-btn" style={{ width: "100%", borderColor: "rgba(255,255,255,0.25)", color: "white" }}>Tester ce scénario →</button>
    </div>
  );
}

function WaitlistForm({ label = "Rejoindre la liste d'attente" }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [count] = useState(247);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSent(true);
  }

  if (sent) return (
    <div style={{ textAlign: "center", padding: "24px 0", animation: "countUp 0.5s ease" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🐝</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Vous êtes sur la liste !</p>
      <p style={{ fontSize: 14, color: colors.gray }}>On vous contacte en priorité dès l'ouverture.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: "1 1 220px", minWidth: 0 }} required />
        <button className="cta-btn" type="submit" style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}>{label}</button>
      </div>
      <p style={{ fontSize: 12, color: colors.gray }}><span style={{ color: colors.honeyDeep, fontWeight: 500 }}>{count} personnes</span> déjà inscrites · Pas de spam · Accès prioritaire</p>
    </form>
  );
}

function DiagnosticModal({ onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🐝</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700 }}>Diagnostic relationnel</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>BEE Congruence · Questionnaire gratuit</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <iframe
          src="questionnaire_diagnostique_relationnel.html"
          style={{ width: "100%", border: "none", minHeight: "82vh", display: "block", flex: 1 }}
          title="Questionnaire Diagnostique Relationnel"
        />
      </div>
    </div>
  );
}


export default function BeeCongruenceLanding() {
  const [diagOpen, setDiagOpen] = useState(false);

  const problems = [
    { icon: "💔", title: "Vous attirez toujours le même type de relation", desc: "Dépendance affective, évitement, suradaptation… les mêmes schémas reviennent encore et encore." },
    { icon: "⚡", title: "Vos réactions prennent le contrôle", desc: "Colère, fermeture, besoin de validation, anxiété… vous réagissez avant même de comprendre pourquoi." },
    { icon: "🔄", title: "La théorie seule ne suffit pas", desc: "Comprendre ses blessures ne change pas automatiquement les comportements. Il faut aussi s'entraîner." },
  ];

  const steps = [
    { n: "01", title: "Identifiez vos schémas", desc: "Découvrez vos blessures émotionnelles, vos réactions sous stress et vos mécanismes de protection grâce à un diagnostic personnalisé." },
    { n: "02", title: "Entraînez-vous avec des scénarios", desc: "Gérez des conversations difficiles, posez des limites, exprimez vos besoins et recevez un feedback immédiat par l'IA." },
    { n: "03", title: "Mesurez votre évolution", desc: "Suivez votre progression émotionnelle et développez des comportements relationnels plus sains dans le temps." },
  ];

  const testimonials = [
    { quote: "Je me suis reconnu immédiatement dans les scénarios. C'est la première fois qu'une plateforme me montre concrètement comment réagir autrement.", author: "Utilisateur bêta" },
    { quote: "On comprend enfin pourquoi certaines conversations déclenchent autant d'émotions.", author: "Test utilisateur" },
    { quote: "C'est comme un simulateur de relations humaines. Troublant de précision.", author: "Feedback early access" },
  ];

  return (
    <>
      <style>{globalStyles}</style>

      {/* DIAGNOSTIC MODAL */}
      {diagOpen && <DiagnosticModal onClose={() => setDiagOpen(false)} />}

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: `${colors.cream}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${colors.grayLight}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🐝</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18 }}>BEE Congruence</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="#comment" style={{ fontSize: 14, color: colors.gray, textDecoration: "none" }}>Comment ça marche</a>
          <button className="cta-btn" style={{ padding: "10px 22px", fontSize: 14 }} onClick={() => setDiagOpen(true)}>Faire le diagnostic</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 32px 72px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div style={{ animation: "fadeUp 0.7s ease forwards" }}>
            <div className="section-tag">
              <span>🐝</span> Plateforme d'entraînement relationnel
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4.5vw, 58px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.01em" }}>
              Arrêtez de répéter les mêmes <em style={{ color: colors.honeyDeep, fontStyle: "italic" }}>schémas relationnels.</em>
            </h1>
            <p style={{ fontSize: 18, color: colors.gray, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              BEE Congruence vous aide à comprendre vos réactions émotionnelles, identifier vos mécanismes de protection et vous entraîner à créer des relations plus saines grâce à des scénarios interactifs.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <button className="cta-btn" onClick={() => setDiagOpen(true)}>Faire le diagnostic gratuit</button>
              <button className="ghost-btn">Voir une démonstration</button>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 13, color: colors.gray, flexWrap: "wrap" }}>
              {["Diagnostic relationnel", "Exercices interactifs", "Scénarios réalistes"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: colors.honey, fontSize: 16 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ animation: "fadeUp 0.7s ease 0.2s both" }}>
            <HeroCard />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BANNER */}
      <div style={{ background: colors.dark, padding: "20px 32px", display: "flex", justifyContent: "center", gap: "clamp(24px, 5vw, 80px)", flexWrap: "wrap" }}>
        {[["247", "inscrits en liste d'attente"], ["3 blessures", "relationnelles identifiées"], ["12 scénarios", "interactifs prévus"]].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: colors.honey, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* PROBLEM */}
      <section style={{ padding: "96px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <AnimOnScroll>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="section-tag">Le problème</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, maxWidth: 620, margin: "0 auto 16px", lineHeight: 1.2 }}>
              Pourquoi répétons-nous toujours les mêmes relations ?
            </h2>
            <p style={{ fontSize: 17, color: colors.gray, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Nos réactions émotionnelles sont souvent automatiques, inconscientes et construites à partir de blessures anciennes.
            </p>
          </div>
        </AnimOnScroll>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {problems.map((p, i) => (
            <AnimOnScroll key={i} delay={i * 0.12}>
              <div style={{ background: "white", borderRadius: 24, padding: 32, border: `1px solid ${colors.grayLight}`, height: "100%", transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 36, marginBottom: 18 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            </AnimOnScroll>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment" style={{ background: colors.honeyLight, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
          <AnimOnScroll>
            <div className="section-tag">Comment ça marche</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 900, marginBottom: 40, lineHeight: 1.25 }}>
              BEE Congruence transforme la psychologie en entraînement concret.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: colors.honey, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: colors.dark, flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <h3 style={{ fontWeight: 500, fontSize: 17, marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimOnScroll>
          <AnimOnScroll delay={0.15}>
            <ScenarioCard />
          </AnimOnScroll>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "96px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <AnimOnScroll>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-tag">Premiers retours</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 900, lineHeight: 1.25 }}>
              Pour les personnes qui veulent enfin <br />comprendre leurs relations.
            </h2>
          </div>
        </AnimOnScroll>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {testimonials.map((t, i) => (
            <AnimOnScroll key={i} delay={i * 0.1}>
              <div style={{ background: "white", borderRadius: 24, padding: 32, border: `1px solid ${colors.grayLight}`, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <p style={{ fontSize: 36, color: colors.honey, lineHeight: 1, marginBottom: 16 }}>"</p>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: colors.dark, flex: 1, fontStyle: "italic", marginBottom: 24 }}>{t.quote}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.honeyLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐝</div>
                  <span style={{ fontSize: 13, color: colors.gray }}>— {t.author}</span>
                </div>
              </div>
            </AnimOnScroll>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "40px 32px 96px", maxWidth: 1200, margin: "0 auto" }}>
        <AnimOnScroll>
          <div style={{ background: colors.dark, borderRadius: 40, padding: "72px 48px", textAlign: "center", color: "white", position: "relative", overflow: "hidden" }}>
            {/* decorative rings */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", border: `1px solid rgba(245,200,66,0.15)`, animation: "pulse-ring 5s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", border: `1px solid rgba(245,200,66,0.1)`, animation: "pulse-ring 6s ease-in-out 1s infinite" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", background: colors.honey, color: colors.dark, borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 28 }}>
                Accès anticipé · Gratuit
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 3.5vw, 50px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
                Rejoignez les premiers utilisateurs de BEE Congruence.
              </h2>
              <p style={{ fontSize: 17, color: "#AAA", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Recevez un accès prioritaire à la plateforme, aux scénarios interactifs et au diagnostic relationnel complet.
              </p>
              <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
                <WaitlistForm label="Rejoindre la liste d'attente" />
                <button className="ghost-btn" onClick={() => setDiagOpen(true)} style={{ borderColor: "rgba(255,255,255,0.25)", color: "white" }}>
                  Faire le diagnostic maintenant →
                </button>
              </div>
            </div>
          </div>
        </AnimOnScroll>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${colors.grayLight}`, padding: "32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🐝</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>BEE Congruence</span>
          </div>
          <p style={{ fontSize: 13, color: colors.gray }}>Plateforme d'entraînement relationnel et émotionnel.</p>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13, color: colors.gray }}>
          <a href="#" style={{ color: colors.gray, textDecoration: "none" }}>Instagram</a>
          <a href="#" style={{ color: colors.gray, textDecoration: "none" }}>Contact</a>
          <a href="#" style={{ color: colors.gray, textDecoration: "none" }}>Mentions légales</a>
        </div>
      </footer>
    </>
  );
}
