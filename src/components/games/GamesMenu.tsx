import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/games.css';

interface GamesMenuProps {
  onSelectGame: (game: 'tictactoe') => void;
  onBack: () => void;
}

const GamesMenu: React.FC<GamesMenuProps> = ({ onSelectGame, onBack }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="games-menu">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>
      <motion.h2 
        className="games-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🎮 Games
      </motion.h2>

      <motion.div 
        className="games-list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <motion.div 
          className="game-card"
          variants={itemVariants}
          onClick={() => onSelectGame('tictactoe')}
        >
          <h3 className="game-card__title">🌧 Tic Tac Toe</h3>
          <p className="game-card__desc">Raindrops vs Flowers</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GamesMenu;
