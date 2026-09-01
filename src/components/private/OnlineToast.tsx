import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface OnlineToastProps {
  name: string;
  visible: boolean;
  onDismiss: () => void;
}

const OnlineToast: React.FC<OnlineToastProps> = ({ name, visible, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <motion.div
      className="online-toast"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
    >
      🌧 {name} just arrived.
    </motion.div>
  );
};

export default OnlineToast;
