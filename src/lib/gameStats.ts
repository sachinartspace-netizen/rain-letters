const STATS_KEY = 'rain-letters-game-stats-v2';

export interface GameStats {
  tictactoe: {
    gamesPlayed: number;
    raindropWins: number;
    flowerWins: number;
    draws: number;
  };
}

const defaultStats: GameStats = {
  tictactoe: {
    gamesPlayed: 0,
    raindropWins: 0,
    flowerWins: 0,
    draws: 0,
  },
};

export const getGameStats = (): GameStats => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return defaultStats;
    const parsed = JSON.parse(data);
    return {
      tictactoe: { ...defaultStats.tictactoe, ...parsed.tictactoe },
    };
  } catch {
    return defaultStats;
  }
};

export const recordTicTacToeSymbolWin = (symbol: '💧' | '🌼') => {
  const stats = getGameStats();
  stats.tictactoe.gamesPlayed += 1;
  if (symbol === '💧') {
    stats.tictactoe.raindropWins += 1;
  } else if (symbol === '🌼') {
    stats.tictactoe.flowerWins += 1;
  }
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
  return stats;
};

export const recordTicTacToeDraw = () => {
  const stats = getGameStats();
  stats.tictactoe.gamesPlayed += 1;
  stats.tictactoe.draws += 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
  return stats;
};
