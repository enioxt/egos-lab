import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id?: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  icon,
  title,
  subtitle,
  badge,
  badgeColor = '#13b6ec',
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className="collapsible-section">
      <button
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="collapsible-icon" style={{ color: badgeColor }}>
          {icon}
        </div>
        <div className="collapsible-text">
          <h2 className="collapsible-title">{title}</h2>
          {subtitle && <p className="collapsible-subtitle">{subtitle}</p>}
        </div>
        {badge && (
          <span
            className="collapsible-badge"
            style={{
              background: `${badgeColor}15`,
              color: badgeColor,
              borderColor: `${badgeColor}30`,
            }}
          >
            {badge}
          </span>
        )}
        <motion.div
          className="collapsible-chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="collapsible-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="collapsible-content">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CollapsibleSection;
