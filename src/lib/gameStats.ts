const STATS_KEY = 'rain-letters-game-stats';

export interface GameStats {
  tictactoe: {
    gamesPlayed: number;
    raindropWins: number;
    flowerWins: number;
    draws: number;
  };
  rainshield: {
    gamesPlayed: number;
    highScore: number;
    totalSecondsSurvived: number;
  };
}

const defaultStats: GameStats = {
  tictactoe: {
    gamesPlayed: 0,
    raindropWins: 0,
    flowerWins: 0,
    draws: 0,
  },
  rainshield: {
    gamesPlayed: 0,
    highScore: 0,
    totalSecondsSurvived: 0,
  },
};

export const getGameStats = (): GameStats => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return defaultStats;
    const parsed = JSON.parse(data);
    return {
      tictactoe: { ...defaultStats.tictactoe, ...parsed.tictactoe },
      rainshield: { ...defaultStats.rainshield, ...parsed.rainshield },
    };
  } catch {
    return defaultStats;
  }
};

export const recordTicTacToeWin = (winner: 'X' | 'O') => {
  const stats = getGameStats();
  stats.tictactoe.gamesPlayed += 1;
  if (winner === 'X') {
    stats.tictactoe.raindropWins += 1;
  } else if (winner === 'O') {
    stats.tictactoe.flowerWins += 1;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
};

export const recordTicTacToeDraw = () => {
  const stats = getGameStats();
  stats.tictactoe.gamesPlayed += 1;
  stats.tictactoe.draws += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
};

export const recordRainShieldGame = (scoreSeconds: number) => {
  const stats = getGameStats();
  stats.rainshield.gamesPlayed += 1;
  stats.rainshield.totalSecondsSurvived += scoreSeconds;
  if (scoreSeconds > stats.rainshield.highScore) {
    stats.rainshield.highScore = scoreSeconds;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
};
