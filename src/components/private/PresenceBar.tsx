import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

interface PresenceBarProps {
  otherUserName: string | null;
  isOtherOnline: boolean;
}

const PresenceBar: React.FC<PresenceBarProps> = ({ otherUserName, isOtherOnline }) => {
  const { displayName } = useAuthContext();

  const partnerName = otherUserName || (displayName === 'Sachin' ? 'Pratima' : displayName === 'Pratima' ? 'Sachin' : 'Partner');

  return (
    <div className="presence-bar">
      <span className={`presence-dot ${isOtherOnline ? 'presence-dot--online' : 'presence-dot--offline'}`} />
      <span className="presence-text">
        {partnerName} {isOtherOnline ? '● online' : '● away'}
      </span>
    </div>
  );
};

export default PresenceBar;
