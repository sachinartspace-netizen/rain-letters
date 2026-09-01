import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getGameStats, recordTicTacToeWin, recordTicTacToeDraw } from '../../lib/gameStats';
import '../../styles/games.css';

interface TicTacToeProps {
  onBack: () => void;
}

type Player = 'X' | 'O' | null;

const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [stats, setStats] = useState(() => getGameStats());
  const [winnerLine, setWinnerLine] = useState<number[] | null>(null);

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winnerLine) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinnerLine(winResult.line);
      const updated = recordTicTacToeWin(winResult.winner as 'X' | 'O');
      setStats(updated);
    } else {
      const isDraw = newBoard.every(cell => cell !== null);
      if (isDraw) {
        const updated = recordTicTacToeDraw();
        setStats(updated);
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinnerLine(null);
  };

  const isDraw = !winnerLine && board.every(cell => cell !== null);
  const isGameOver = !!winnerLine || isDraw;

  return (
    <motion.div 
      className="tictactoe"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      <div className="tictactoe__status">
        {winnerLine 
          ? `${currentPlayer === 'X' ? '💧' : '🌼'} Wins!` 
          : isDraw 
            ? "It's a draw!" 
            : `${currentPlayer === 'X' ? '💧 Raindrop' : '🌼 Flower'}'s turn`}
      </div>

      <div className="tictactoe__board">
        {board.map((cell, index) => (
          <motion.div
            key={index}
            className={`tictactoe__cell ${winnerLine?.includes(index) ? 'tictactoe__cell--winner' : ''}`}
            onClick={() => handleCellClick(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cell === 'X' ? '💧' : cell === 'O' ? '🌼' : ''}
          </motion.div>
        ))}
      </div>

      <div className="tictactoe__scores" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontWeight: 500 }}>
          <span>💧 Raindrops: {stats.tictactoe.raindropWins}</span>
          <span>🌼 Flowers: {stats.tictactoe.flowerWins}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          Total Games Played: {stats.tictactoe.gamesPlayed} (Draws: {stats.tictactoe.draws})
        </div>
      </div>

      {isGameOver && (
        <div className="tictactoe__actions" style={{ marginTop: '1rem' }}>
          <button onClick={resetGame} style={{
            padding: '10px 24px', borderRadius: '10px', background: 'var(--color-accent-glow, #4a90d9)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500
          }}>
            Play Again
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TicTacToe;
