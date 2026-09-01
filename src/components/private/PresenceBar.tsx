import React from 'react';

interface PresenceBarProps {
  otherUserName: string | null;
  isOtherOnline: boolean;
}

const PresenceBar: React.FC<PresenceBarProps> = ({ otherUserName, isOtherOnline }) => {
  return (
    <div className="presence-bar">
      {otherUserName ? (
        <>
          <span className={`presence-dot ${isOtherOnline ? 'presence-dot--online' : 'presence-dot--offline'}`} />
          <span>{otherUserName} {isOtherOnline ? 'online' : 'away'}</span>
        </>
      ) : (
        <span>waiting for someone...</span>
      )}
    </div>
  );
};

export default PresenceBar;
