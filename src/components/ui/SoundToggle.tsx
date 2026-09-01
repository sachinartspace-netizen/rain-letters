import React from 'react';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ enabled, onToggle }) => {
  return (
    <button className="sound-toggle" onClick={onToggle} title="Toggle Sound">
      {enabled ? '🔊' : '🔇'}
    </button>
  );
};

export default SoundToggle;
