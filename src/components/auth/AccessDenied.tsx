import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RainCanvas from '../layout/RainCanvas';
import { useAuthContext } from '../../contexts/AuthContext';
import '../../styles/transitions.css';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const handleGoBack = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="access-denied">
      <RainCanvas className="landing-bg" rainIntensity={0.2} interactive={false} />
      
      <motion.div 
        className="access-denied__card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="access-denied__emoji">🌧</div>
        <h1 className="access-denied__title">ACCESS DENIED</h1>
        <p className="access-denied__text">This little rain world isn't for you.</p>
        <button className="access-denied__btn" onClick={handleGoBack}>
          Go Back
        </button>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
