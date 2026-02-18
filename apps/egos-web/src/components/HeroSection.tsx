import React from 'react';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" style={{ position: 'relative', zIndex: 1 }}>
      <div className="hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-text"
        >
          <div className="hero-badge">
            <span className="hero-pulse" />
            <span>Research Preview</span>
          </div>
          <h1 className="hero-title">EGOS</h1>
          <p className="hero-subtitle">Agentic Platform for Builders</p>
          <p className="hero-desc">
            Plataforma open-source de agentes autônomos que auditam, protegem
            e evoluem codebases. 15 agentes rodando em ~7s — SSOT Auditor,
            Security Scanner, Code Reviewer, UI Designer e mais.
          </p>
          <div className="hero-ctas">
            <button className="cta-primary" onClick={() => scrollToSection('ecosystem')}>
              Explorar Ecossistema
            </button>
            <button className="cta-secondary" onClick={() => scrollToSection('intelligence')}>
              Falar com EGOS
            </button>
          </div>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="hero-stat">
            <span className="stat-value">14</span>
            <span className="stat-label">Agentes</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="stat-value">9</span>
            <span className="stat-label">Módulos</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="stat-value">AGPL-3</span>
            <span className="stat-label">Licença</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
