import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { getPartnerNickname } from '../../lib/auth';

interface PresenceBarProps {
  otherUserName: string | null;
  isOtherOnline: boolean;
}

const PresenceBar: React.FC<PresenceBarProps> = ({ otherUserName, isOtherOnline }) => {
  const { user } = useAuthContext();
  const partnerNick = getPartnerNickname(user?.email || '');

  const displayNick = (otherUserName && otherUserName !== 'Unknown' && otherUserName !== 'User' && otherUserName !== 'Anonymous')
    ? (otherUserName === 'Pratima' ? 'Tima' : otherUserName === 'Sachin' ? 'Sapy' : otherUserName)
    : partnerNick;

  return (
    <div className="presence-bar">
      <span className={`presence-dot ${isOtherOnline ? 'presence-dot--online' : 'presence-dot--offline'}`} />
      <span className="presence-text">
        {displayNick} {isOtherOnline ? '● online' : '● away'}
      </span>
    </div>
  );
};

export default PresenceBar;
