import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SideMenu from './SideMenu';
import ChatView from './ChatView';
import GardenView from './GardenView';
import MemoriesView from './MemoriesView';
import SettingsView from './SettingsView';
import PresenceBar from './PresenceBar';
import OnlineToast from './OnlineToast';
import GamesMenu from '../games/GamesMenu';
import TicTacToe from '../games/TicTacToe';
import RainCanvas from '../layout/RainCanvas';
import SoundToggle from '../ui/SoundToggle';

import { useAuthContext } from '../../contexts/AuthContext';
import usePresence from '../../hooks/usePresence';
import { useWeather } from '../../contexts/WeatherContext';
import { useGardenContext } from '../../contexts/GardenContext';
import useQuality from '../../hooks/useQuality';
import useSound from '../../hooks/useSound';

import '../../styles/chat.css';

type GameView = 'menu' | 'tictactoe';

const PrivateWorld: React.FC = () => {
  const { user, displayName } = useAuthContext();
  const [currentView, setCurrentView] = useState<string>('chat');
  const [currentGame, setCurrentGame] = useState<GameView>('menu');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    otherUserName,
    isOtherOnline,
    bothOnline,
    otherJustArrived,
  } = usePresence(user?.id, displayName || 'Unknown');

  const { rainIntensity, windStrength, setRainIntensity } = useWeather();
  const { growth, totalMinutes, isGrowing } = useGardenContext();
  const { quality } = useQuality();
  const { soundEnabled, toggleSound } = useSound();

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (otherJustArrived) {
      setShowToast(true);
    }
  }, [otherJustArrived]);

  useEffect(() => {
    if (bothOnline) {
      setRainIntensity(0.3);
    } else {
      setRainIntensity(0.7);
    }
  }, [bothOnline, setRainIntensity]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'games') {
      setCurrentGame('menu');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatView />;
      case 'garden':
        return <GardenView growth={growth} totalMinutes={totalMinutes} isGrowing={isGrowing} />;
      case 'games':
        return renderGame();
      case 'memories':
        return <MemoriesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ChatView />;
    }
  };

  const renderGame = () => {
    switch (currentGame) {
      case 'tictactoe':
        return <TicTacToe onBack={() => setCurrentGame('menu')} />;
      default:
        return <GamesMenu onSelectGame={(g) => setCurrentGame(g as GameView)} onBack={() => setCurrentView('chat')} />;
    }
  };

  return (
    <div className="private-world">
      <RainCanvas
        rainIntensity={rainIntensity}
        windStrength={windStrength}
        gardenGrowth={growth}
        quality={quality}
        showFireflies={true}
      />
      
      <div className="private-content">
        <PresenceBar otherUserName={otherUserName} isOtherOnline={isOtherOnline} />
        
        <button className="menu-btn" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
          ☰
        </button>

        <SideMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {renderView()}

        <AnimatePresence>
          {showToast && otherUserName && (
            <OnlineToast
              name={otherUserName}
              visible={showToast}
              onDismiss={() => setShowToast(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
    </div>
  );
};

export default PrivateWorld;
