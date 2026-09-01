import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/games.css';

interface RainShieldProps {
  onBack: () => void;
}

const RainShield: React.FC<RainShieldProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = Date.now();
    let lastDropTime = 0;
    
    // Resize canvas
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth - 40;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight * 0.6;
    };
    resize();
    window.addEventListener('resize', resize);

    // Game State
    let flowerHealth = 100;
    const flower = { x: canvas.width / 2, y: canvas.height - 20, size: 20 };
    const umbrella = { x: canvas.width / 2, y: canvas.height - 100, width: 80, height: 20 };
    const drops: { x: number, y: number, speed: number }[] = [];
    let wind = 0;
    
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = (e as MouseEvent).clientX;
      }
      umbrella.x = clientX - rect.left;
    };
    
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });

    const render = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setScore(elapsedSeconds);

      // Increase difficulty
      const dropRate = Math.max(50, 200 - elapsedSeconds * 2);
      if (now - lastDropTime > dropRate) {
        drops.push({
          x: Math.random() * canvas.width,
          y: -10,
          speed: 3 + Math.random() * 3 + elapsedSeconds * 0.1
        });
        lastDropTime = now;
      }
      
      // Update wind
      if (Math.random() < 0.01) {
        wind = (Math.random() - 0.5) * 4;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw flower
      const currentFlowerSize = flower.size + Math.min(elapsedSeconds * 0.2, 10);
      ctx.font = `${currentFlowerSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌼', flower.x, flower.y);
      
      // Health bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(flower.x - 20, flower.y + 20, 40, 4);
      ctx.fillStyle = flowerHealth > 50 ? '#4ade80' : '#f87171';
      ctx.fillRect(flower.x - 20, flower.y + 20, 40 * (flowerHealth / 100), 4);

      // Draw umbrella
      ctx.font = '40px Arial';
      ctx.fillText('☂️', umbrella.x, umbrella.y + 15);

      // Update and draw drops
      ctx.fillStyle = '#60a5fa';
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.y += drop.speed;
        drop.x += wind;

        // Collision with umbrella (approximate using bounding box of the emoji)
        if (
          drop.y > umbrella.y - 20 && drop.y < umbrella.y + 20 &&
          drop.x > umbrella.x - 30 && drop.x < umbrella.x + 30
        ) {
          drops.splice(i, 1);
          continue;
        }

        // Collision with flower
        if (
          drop.y > flower.y - currentFlowerSize/2 &&
          drop.x > flower.x - currentFlowerSize/2 && drop.x < flower.x + currentFlowerSize/2
        ) {
          flowerHealth -= 5;
          drops.splice(i, 1);
          if (flowerHealth <= 0) {
            setGameOver(true);
          }
          continue;
        }

        // Off screen
        if (drop.y > canvas.height) {
          drops.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (flowerHealth > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [isPlaying, gameOver]);

  return (
    <motion.div 
      className="rainshield"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-btn" onClick={onBack} style={{ position: 'absolute', zIndex: 10 }}>← Back</button>
      
      {!isPlaying && !gameOver && (
        <div className="rainshield__gameover">
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Rain Shield</h2>
          <p>Protect the flower from the rain!</p>
          <button 
            onClick={() => setIsPlaying(true)}
            style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-primary, #60a5fa)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Start Game
          </button>
        </div>
      )}

      {(isPlaying || gameOver) && (
        <div className="rainshield__score">Score: {score}s</div>
      )}

      <div style={{ width: '100%', flex: 1, display: 'flex', position: 'relative' }}>
        <canvas ref={canvasRef} className="rainshield__canvas" style={{ touchAction: 'none' }} />
      </div>

      {gameOver && (
        <div className="rainshield__gameover">
          <h2>Game Over</h2>
          <p>You survived for {score} seconds!</p>
          <button 
            onClick={() => {
              setGameOver(false);
              setScore(0);
              setIsPlaying(true);
            }}
            style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-primary, #60a5fa)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Play Again
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default RainShield;
