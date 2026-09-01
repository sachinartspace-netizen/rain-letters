import React from 'react';
import { motion } from 'framer-motion';

const MemoriesView: React.FC = () => {
  const placeholders = Array.from({ length: 6 }, (_, i) => i);

  return (
    <motion.div
      className="memories-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
    >
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>
        ✨ Memories
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Coming soon... this is where our story lives.
      </p>

      <div className="memories-grid">
        {placeholders.map((i) => (
          <div key={i} className="memory-card">
            ADD MEMORY HERE
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MemoriesView;
