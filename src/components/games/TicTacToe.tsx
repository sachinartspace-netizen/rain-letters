import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { getNicknameFromEmail, getPartnerNickname } from '../../lib/auth';
import { getGameStats, recordTicTacToeSymbolWin, recordTicTacToeDraw } from '../../lib/gameStats';
import '../../styles/games.css';

interface TicTacToeProps {
  onBack: () => void;
}

type SymbolType = '💧' | '🌼';
type CellValue = SymbolType | null;

interface GameStatePayload {
  board: CellValue[];
  turn: SymbolType;
  lastMoveBy?: string;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const { user } = useAuthContext();
  const myEmail = user?.email || '';
  const myNickname = getNicknameFromEmail(myEmail);
  const partnerNickname = getPartnerNickname(myEmail);

  // Default symbol assignment: Sapy gets 💧 by default, Tima gets 🌼 by default
  const defaultSymbol: SymbolType = myNickname === 'Sapy' ? '💧' : '🌼';
  const [mySymbol, setMySymbol] = useState<SymbolType>(defaultSymbol);
  
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<SymbolType>('💧');
  const [winnerLine, setWinnerLine] = useState<number[] | null>(null);
  const [winnerSymbol, setWinnerSymbol] = useState<SymbolType | null>(null);
  const [stats, setStats] = useState(() => getGameStats());

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const checkWinner = useCallback((squares: CellValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as SymbolType, line: lines[i] };
      }
    }
    return null;
  }, []);

  // Sync state received from partner
  const applyRemoteState = useCallback((newBoard: CellValue[], nextTurn: SymbolType) => {
    setBoard(newBoard);
    setCurrentTurn(nextTurn);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinnerLine(winResult.line);
      setWinnerSymbol(winResult.winner);
      const updated = recordTicTacToeSymbolWin(winResult.winner);
      setStats(updated);
    } else {
      const isDraw = newBoard.every((cell) => cell !== null);
      if (isDraw) {
        const updated = recordTicTacToeDraw();
        setStats(updated);
      }
    }
  }, [checkWinner]);

  useEffect(() => {
    // Set up Realtime Multiplayer Channel
    const channel = supabase.channel('rain-tictactoe-room', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'make-move' }, ({ payload }: { payload: GameStatePayload }) => {
        if (payload && Array.isArray(payload.board)) {
          applyRemoteState(payload.board, payload.turn);
        }
      })
      .on('broadcast', { event: 'restart-game' }, () => {
        setBoard(Array(9).fill(null));
        setCurrentTurn('💧');
        setWinnerLine(null);
        setWinnerSymbol(null);
      })
      .on('broadcast', { event: 'select-symbol' }, ({ payload }: { payload: { email: string; symbol: SymbolType } }) => {
        if (payload && payload.email !== myEmail) {
          // Partner selected symbol, so choose opposite
          setMySymbol(payload.symbol === '💧' ? '🌼' : '💧');
        }
      })
      .on('broadcast', { event: 'request-sync' }, () => {
        // Broadcast current state to newly joined partner
        channel.send({
          type: 'broadcast',
          event: 'make-move',
          payload: { board, turn: currentTurn },
        }).catch(() => {});
      })
      .subscribe();

    channelRef.current = channel;

    // Request sync from partner if partner is already in game
    setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'request-sync', payload: {} }).catch(() => {});
    }, 500);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myEmail, board, currentTurn, applyRemoteState]);

  const handleCellClick = (index: number) => {
    // Block if cell already taken, or game over, or NOT your turn!
    if (board[index] || winnerLine || winnerSymbol || currentTurn !== mySymbol) return;

    const nextTurnSymbol: SymbolType = mySymbol === '💧' ? '🌼' : '💧';
    const newBoard = [...board];
    newBoard[index] = mySymbol;

    setBoard(newBoard);
    setCurrentTurn(nextTurnSymbol);

    // Broadcast move to partner in real-time (<50ms)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'make-move',
        payload: {
          board: newBoard,
          turn: nextTurnSymbol,
          lastMoveBy: myNickname,
        },
      }).catch(() => {});
    }

    // Check winner or draw locally
    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinnerLine(winResult.line);
      setWinnerSymbol(winResult.winner);
      const updated = recordTicTacToeSymbolWin(winResult.winner);
      setStats(updated);
    } else {
      const isDraw = newBoard.every((cell) => cell !== null);
      if (isDraw) {
        const updated = recordTicTacToeDraw();
        setStats(updated);
      }
    }
  };

  const handleSelectSymbol = (symbol: SymbolType) => {
    setMySymbol(symbol);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'select-symbol',
        payload: { email: myEmail, symbol },
      }).catch(() => {});
    }
  };

  const handleResetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn('💧');
    setWinnerLine(null);
    setWinnerSymbol(null);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'restart-game',
        payload: { resetBy: myNickname },
      }).catch(() => {});
    }
  };

  const isDraw = !winnerLine && !winnerSymbol && board.every((cell) => cell !== null);
  const isGameOver = !!winnerLine || !!winnerSymbol || isDraw;
  const isMyTurn = currentTurn === mySymbol && !isGameOver;

  const partnerSymbol: SymbolType = mySymbol === '💧' ? '🌼' : '💧';

  return (
    <motion.div 
      className="tictactoe"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      {/* Symbol Selection Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>You play as:</span>
        <button
          onClick={() => handleSelectSymbol('💧')}
          style={{
            padding: '4px 12px',
            borderRadius: '8px',
            background: mySymbol === '💧' ? 'rgba(74, 144, 217, 0.3)' : 'rgba(255,255,255,0.05)',
            border: mySymbol === '💧' ? '1px solid #4a90d9' : '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          💧 Raindrop ({myNickname === 'Sapy' ? 'You' : 'Sapy'})
        </button>
        <button
          onClick={() => handleSelectSymbol('🌼')}
          style={{
            padding: '4px 12px',
            borderRadius: '8px',
            background: mySymbol === '🌼' ? 'rgba(244, 114, 182, 0.3)' : 'rgba(255,255,255,0.05)',
            border: mySymbol === '🌼' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          🌼 Flower ({myNickname === 'Tima' ? 'You' : 'Tima'})
        </button>
      </div>

      {/* Turn & Game Status Banner */}
      <div className="tictactoe__status" style={{ minHeight: '32px', marginBottom: '0.5rem', fontWeight: 600 }}>
        {winnerSymbol ? (
          <span style={{ color: '#86efac' }}>
            🎉 {winnerSymbol} {winnerSymbol === mySymbol ? `${myNickname} (You) Won!` : `${partnerNickname} Won!`}
          </span>
        ) : isDraw ? (
          <span style={{ color: '#facc15' }}>🤝 It's a draw!</span>
        ) : isMyTurn ? (
          <span style={{ color: '#93c5fd' }}>👉 Your turn! Make a move ({mySymbol})</span>
        ) : (
          <span style={{ color: 'var(--color-text-dim)' }}>
            ⏳ Waiting for {partnerNickname}'s move ({partnerSymbol})...
          </span>
        )}
      </div>

      {/* 3x3 Tic Tac Toe Grid */}
      <div className="tictactoe__board">
        {board.map((cell, index) => {
          const isWinnerCell = winnerLine?.includes(index);
          return (
            <motion.div
              key={index}
              className={`tictactoe__cell ${isWinnerCell ? 'tictactoe__cell--winner' : ''}`}
              onClick={() => handleCellClick(index)}
              style={{
                cursor: !cell && isMyTurn ? 'pointer' : 'not-allowed',
                opacity: !cell && !isMyTurn ? 0.7 : 1,
              }}
              whileHover={!cell && isMyTurn ? { scale: 1.05 } : {}}
              whileTap={!cell && isMyTurn ? { scale: 0.95 } : {}}
            >
              {cell}
            </motion.div>
          );
        })}
      </div>

      {/* High Score & Statistics Section */}
      <div className="tictactoe__scores" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1rem', width: '100%', maxWidth: '340px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem', fontWeight: 500, background: 'rgba(15, 31, 58, 0.5)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(160, 200, 235, 0.15)' }}>
          <span>💧 Raindrops: <strong>{stats.tictactoe.raindropWins}</strong></span>
          <span>🌼 Flowers: <strong>{stats.tictactoe.flowerWins}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          <span>🎮 Total Games: {stats.tictactoe.gamesPlayed}</span>
          <span>🤝 Draws: {stats.tictactoe.draws}</span>
        </div>
      </div>

      {/* Reset / Play Again Action Button */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: '1rem' }}
          >
            <button 
              onClick={handleResetGame} 
              style={{
                padding: '10px 24px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #4a90d9, #86efac)', 
                color: '#060e1a', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 15px rgba(74, 144, 217, 0.4)',
              }}
            >
              🔄 Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TicTacToe;
