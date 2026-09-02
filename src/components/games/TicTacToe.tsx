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

interface GameStateBroadcast {
  board: CellValue[];
  turn: SymbolType;
  priorityNick: 'Tima' | 'Sapy';
  symbols: { Tima: SymbolType; Sapy: SymbolType };
  gamePhase: 'selecting' | 'playing' | 'ended';
  winnerSymbol?: SymbolType | null;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const { user } = useAuthContext();
  const myEmail = user?.email || '';
  const myNickname: 'Tima' | 'Sapy' = (getNicknameFromEmail(myEmail) === 'Tima' ? 'Tima' : 'Sapy');
  const partnerNickname: 'Tima' | 'Sapy' = myNickname === 'Tima' ? 'Sapy' : 'Tima';

  // Game state
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [priorityNick, setPriorityNick] = useState<'Tima' | 'Sapy'>('Tima'); // Tima has first priority initially
  const [symbols, setSymbols] = useState<{ Tima: SymbolType; Sapy: SymbolType }>({ Tima: '🌼', Sapy: '💧' });
  const [currentTurn, setCurrentTurn] = useState<SymbolType>('🌼');
  const [gamePhase, setGamePhase] = useState<'selecting' | 'playing' | 'ended'>('selecting');
  
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

  const broadcastState = useCallback((
    newBoard: CellValue[],
    newTurn: SymbolType,
    newPriority: 'Tima' | 'Sapy',
    newSymbols: { Tima: SymbolType; Sapy: SymbolType },
    newPhase: 'selecting' | 'playing' | 'ended'
  ) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync-game-state',
        payload: {
          board: newBoard,
          turn: newTurn,
          priorityNick: newPriority,
          symbols: newSymbols,
          gamePhase: newPhase,
        },
      }).catch(() => {});
    }
  }, []);

  // WebSockets Channel Setup
  useEffect(() => {
    const channel = supabase.channel('rain-tictactoe-room-v3', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'sync-game-state' }, ({ payload }: { payload: GameStateBroadcast }) => {
        if (payload) {
          setBoard(payload.board);
          setCurrentTurn(payload.turn);
          setPriorityNick(payload.priorityNick);
          setSymbols(payload.symbols);
          setGamePhase(payload.gamePhase);

          const winResult = checkWinner(payload.board);
          if (winResult) {
            setWinnerLine(winResult.line);
            setWinnerSymbol(winResult.winner);
          } else {
            setWinnerLine(null);
            setWinnerSymbol(null);
          }
        }
      })
      .on('broadcast', { event: 'request-game-sync' }, () => {
        broadcastState(board, currentTurn, priorityNick, symbols, gamePhase);
      })
      .subscribe();

    channelRef.current = channel;

    // Request state sync from partner
    setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'request-game-sync', payload: {} }).catch(() => {});
    }, 400);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board, currentTurn, priorityNick, symbols, gamePhase, checkWinner, broadcastState]);

  // Priority player chooses symbol to start the game
  const handlePrioritySelectSymbol = (chosenSymbol: SymbolType) => {
    if (myNickname !== priorityNick || gamePhase === 'playing') return;

    const partnerSymbolChoice: SymbolType = chosenSymbol === '🌼' ? '💧' : '🌼';
    const newSymbols = {
      [myNickname]: chosenSymbol,
      [partnerNickname]: partnerSymbolChoice,
    } as { Tima: SymbolType; Sapy: SymbolType };

    const newBoard = Array(9).fill(null);
    const firstTurn = chosenSymbol;

    setSymbols(newSymbols);
    setBoard(newBoard);
    setCurrentTurn(firstTurn);
    setGamePhase('playing');
    setWinnerLine(null);
    setWinnerSymbol(null);

    broadcastState(newBoard, firstTurn, priorityNick, newSymbols, 'playing');
  };

  // Cell click handler
  const handleCellClick = (index: number) => {
    // 1. Must be in active playing phase
    if (gamePhase !== 'playing') return;
    // 2. Cell must be empty
    if (board[index]) return;
    // 3. Game must not be ended
    if (winnerLine || winnerSymbol) return;
    // 4. IT MUST BE YOUR TURN & SAMPLES MUST MATCH YOUR ASSIGNED SYMBOL!
    const myAssignedSymbol = symbols[myNickname];
    if (currentTurn !== myAssignedSymbol) return;

    const nextTurnSymbol: SymbolType = currentTurn === '🌼' ? '💧' : '🌼';
    const newBoard = [...board];
    newBoard[index] = myAssignedSymbol;

    setBoard(newBoard);
    setCurrentTurn(nextTurnSymbol);

    // Check winner or draw
    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinnerLine(winResult.line);
      setWinnerSymbol(winResult.winner);
      setGamePhase('ended');

      // The LOSER of this match gets priority to choose symbol & start first in the NEXT game!
      const winnerNick = symbols.Tima === winResult.winner ? 'Tima' : 'Sapy';
      const loserNick: 'Tima' | 'Sapy' = winnerNick === 'Tima' ? 'Sapy' : 'Tima';
      setPriorityNick(loserNick);

      const updated = recordTicTacToeSymbolWin(winResult.winner);
      setStats(updated);

      broadcastState(newBoard, nextTurnSymbol, loserNick, symbols, 'ended');
    } else {
      const isDraw = newBoard.every((cell) => cell !== null);
      if (isDraw) {
        setGamePhase('ended');
        const updated = recordTicTacToeDraw();
        setStats(updated);
        broadcastState(newBoard, nextTurnSymbol, priorityNick, symbols, 'ended');
      } else {
        broadcastState(newBoard, nextTurnSymbol, priorityNick, symbols, 'playing');
      }
    }
  };

  // Play Next Round (Loser of previous game gets priority to choose)
  const handleStartNextRound = () => {
    const newBoard = Array(9).fill(null);
    setBoard(newBoard);
    setWinnerLine(null);
    setWinnerSymbol(null);
    setGamePhase('selecting');
    broadcastState(newBoard, symbols[priorityNick], priorityNick, symbols, 'selecting');
  };

  const isDraw = gamePhase === 'ended' && !winnerSymbol && board.every((cell) => cell !== null);
  const mySymbol = symbols[myNickname];
  const isMyTurn = gamePhase === 'playing' && currentTurn === mySymbol;
  const isMyPriorityChoice = gamePhase === 'selecting' && myNickname === priorityNick;

  return (
    <motion.div 
      className="tictactoe"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      {/* Game Header Info */}
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        You: <strong>{myNickname} ({mySymbol})</strong> vs {partnerNickname}: <strong>({symbols[partnerNickname]})</strong>
      </div>

      {/* Priority Symbol Chooser (Only visible to player with Priority before game starts) */}
      {gamePhase === 'selecting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(15, 31, 58, 0.6)', padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(160, 200, 235, 0.2)' }}>
          {isMyPriorityChoice ? (
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#86efac' }}>
                🌟 You have priority! Choose your symbol & start first:
              </span>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                <button
                  onClick={() => handlePrioritySelectSymbol('🌼')}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', background: 'rgba(244, 114, 182, 0.3)', border: '1px solid #f472b6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem'
                  }}
                >
                  🌼 Flower (Starts 1st)
                </button>
                <button
                  onClick={() => handlePrioritySelectSymbol('💧')}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', background: 'rgba(74, 144, 217, 0.3)', border: '1px solid #4a90d9', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem'
                  }}
                >
                  💧 Raindrop (Starts 1st)
                </button>
              </div>
            </>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
              ⏳ Waiting for {priorityNick} to choose symbol & start game...
            </span>
          )}
        </div>
      )}

      {/* Turn & Result Banner */}
      <div className="tictactoe__status" style={{ minHeight: '32px', marginBottom: '0.5rem', fontWeight: 600 }}>
        {winnerSymbol ? (
          <span style={{ color: '#86efac' }}>
            🎉 {winnerSymbol} {winnerSymbol === mySymbol ? `${myNickname} (You) Won!` : `${partnerNickname} Won!`}
          </span>
        ) : isDraw ? (
          <span style={{ color: '#facc15' }}>🤝 It's a draw!</span>
        ) : gamePhase === 'playing' ? (
          isMyTurn ? (
            <span style={{ color: '#93c5fd' }}>👉 Your turn! Make a move ({mySymbol})</span>
          ) : (
            <span style={{ color: 'var(--color-text-dim)' }}>
              ⏳ Waiting for {partnerNickname}'s move ({symbols[partnerNickname]})...
            </span>
          )
        ) : null}
      </div>

      {/* 3x3 Tic Tac Toe Grid */}
      <div className="tictactoe__board">
        {board.map((cell, index) => {
          const isWinnerCell = winnerLine?.includes(index);
          const canClick = gamePhase === 'playing' && !cell && isMyTurn;

          return (
            <motion.div
              key={index}
              className={`tictactoe__cell ${isWinnerCell ? 'tictactoe__cell--winner' : ''}`}
              onClick={() => handleCellClick(index)}
              style={{
                cursor: canClick ? 'pointer' : 'not-allowed',
                opacity: !cell && !isMyTurn ? 0.6 : 1,
              }}
              whileHover={canClick ? { scale: 1.05 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
            >
              {cell}
            </motion.div>
          );
        })}
      </div>

      {/* High Score & Statistics Section */}
      <div className="tictactoe__scores" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1rem', width: '100%', maxWidth: '340px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem', fontWeight: 500, background: 'rgba(15, 31, 58, 0.5)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(160, 200, 235, 0.15)' }}>
          <span>🌼 Flowers: <strong>{stats.tictactoe.flowerWins}</strong></span>
          <span>💧 Raindrops: <strong>{stats.tictactoe.raindropWins}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
          <span>🎮 Total Games: {stats.tictactoe.gamesPlayed}</span>
          <span>🤝 Draws: {stats.tictactoe.draws}</span>
        </div>
      </div>

      {/* Start Next Round Button */}
      <AnimatePresence>
        {gamePhase === 'ended' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: '1rem' }}
          >
            <button 
              onClick={handleStartNextRound} 
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
              🔄 Next Round ({priorityNick} chooses first)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TicTacToe;
