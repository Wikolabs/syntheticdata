export default function Home() {
  return (
    <main style={{ fontFamily: "var(FONTBODY)" }}>
      {/* NAVBAR */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #cffafe", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: "var(FONTDISPLAY)", fontWeight: 700, fontSize: "1.25rem", color: "#06b6d4" }}>SyntheticData</span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href="#features" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem" }}>Fonctionnalites</a>
          <a href="#how" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem" }}>Comment ca marche</a>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" style={{ background: "#06b6d4", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Demo gratuite</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)", padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "#06b6d4", color: "#fff", borderRadius: "999px", padding: "0.4rem 1.2rem", fontSize: "0.8rem", fontWeight: 600, marginBottom: "1.5rem", letterSpacing: "0.05em" }}>Donnees synthetiques · RGPD</span>
        <h1 style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15, color: "#0f172a", marginBottom: "1.5rem", maxWidth: "800px", margin: "0 auto 1.5rem" }}>
          Des donnees illimitees.<br /><span style={{ color: "#06b6d4" }}>Conformes RGPD. Statistiquement fideles.</span>
        </h1>
        <p style={{ color: "#475569", fontSize: "1.15rem", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          Generation de donnees synthetiques statistiquement fideles &mdash; entrainez vos modeles sans exposer vos donnees sensibles.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" style={{ background: "#06b6d4", color: "#fff", padding: "0.85rem 2rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "1rem" }}>Demander une demo</button>
          <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20SyntheticData%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer" style={{ background: "#25d366", color: "#fff", padding: "0.85rem 2rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "1rem" }}>WhatsApp</a>
        </div>
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          {[{ value: "100%", label: "RGPD" }, { value: "99%", label: "fidelite stat." }, { value: "x100", label: "volume" }, { value: "Zero PII", label: "garanti" }].map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "2rem", fontWeight: 800, color: "#06b6d4" }}>{m.value}</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.25rem" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "5rem 2rem", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "2rem", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: "0.75rem" }}>Ce que SyntheticData genere</h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: "3rem", fontSize: "1rem" }}>Tous les types de donnees, tous les volumes, conformite RGPD garantie.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "&#x1F4CA;", title: "Generation tabular et texte", desc: "Donnees tabulaires (clients, transactions, logs), textes (emails, tickets, notes) et sequences temporelles — tous les types supportes." },
              { icon: "✅", title: "Validation statistique rigoureuse", desc: "Chaque dataset synthetique est valide automatiquement : distribution, correlations, valeurs extremes — garantie de fidelite statistique > 99%." },
              { icon: "&#x1F512;", title: "Conformite RGPD certifiee", desc: "Aucun individu reel ne peut etre re-identifie. Rapport de conformite RGPD genere automatiquement a chaque dataset." },
            ].map((f) => (
              <div key={f.title} style={{ background: "#ecfeff", borderRadius: "16px", padding: "2rem", border: "1px solid #cffafe" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(FONTDISPLAY)", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", marginBottom: "0.75rem" }}>{f.title}</h3>
                <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "5rem 2rem", background: "#ecfeff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "2rem", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: "0.75rem" }}>Comment ca marche</h2>
          <p style={{ color: "#64748b", textAlign: "center", marginBottom: "3rem", fontSize: "1rem" }}>De l&apos;echantillon au dataset certifie en quelques minutes.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {[
              { step: "01", title: "Uploadez un echantillon", desc: "Quelques centaines de lignes de vos donnees reelles suffisent. SyntheticData apprend leur structure, leurs distributions et leurs correlations." },
              { step: "02", title: "Generation et validation", desc: "Generez autant de lignes que vous souhaitez. Chaque batch est valide statistiquement et certifie RGPD avant livraison." },
              { step: "03", title: "Exportez et entrainez", desc: "CSV, Parquet, JSON ou connexion directe a votre plateforme ML. Entrainez vos modeles sans aucune restriction legale ni risque de fuite." },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", background: "#fff", borderRadius: "16px", padding: "1.75rem", border: "1px solid #cffafe" }}>
                <span style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "2rem", fontWeight: 800, color: "#06b6d4", minWidth: "3rem" }}>{s.step}</span>
                <div>
                  <h3 style={{ fontFamily: "var(FONTDISPLAY)", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", marginBottom: "0.5rem" }}>{s.title}</h3>
                  <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 2rem", background: "#06b6d4", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(FONTDISPLAY)", fontSize: "2.25rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>Donnees illimitees, zero risque RGPD</h2>
        <p style={{ color: "#cffafe", fontSize: "1.1rem", marginBottom: "2rem" }}>Premier dataset de 10 000 lignes offert.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: "#06b6d4", padding: "0.9rem 2.25rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "1rem" }}>Planifier une demo</button>
          <a href="https://wa.me/261386626100?text=Bonjour%2C%20je%20souhaite%20discuter%20de%20SyntheticData%20avec%20Wikolabs." target="_blank" rel="noopener noreferrer" style={{ background: "#25d366", color: "#fff", padding: "0.9rem 2.25rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "1rem" }}>WhatsApp</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "2.5rem 2rem", textAlign: "center" }}>
        <div style={{ fontFamily: "var(FONTDISPLAY)", fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: "0.5rem" }}>SyntheticData by Wikolabs</div>
        <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          <a href="mailto:team@wikolabs.com" style={{ color: "#94a3b8", textDecoration: "none" }}>team@wikolabs.com</a>
          {" · "}
          <a href="https://wikolabs.com" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>wikolabs.com</a>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.5rem", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:team@wikolabs.com" style={{ color: "#94a3b8", textDecoration: "none" }}>team@wikolabs.com</a>
          <span>·</span>
          <a href="tel:+261386626100" style={{ color: "#94a3b8", textDecoration: "none" }}>+261 38 66 261 00</a>
          <span>·</span>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}' type="button" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "none" }}>Prendre RDV</button>
        </div>        <div style={{ fontSize: "0.8rem", color: "#475569" }}>c 2026 Wikolabs. Tous droits reserves.</div>
      </footer>
    </main>
  );
}