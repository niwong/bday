import React, { useState, useEffect, useRef } from 'react';
import './NineManGame.css';

const NineManGame = ({ onExit }) => {
  // Game State
  const [gameState, setGameState] = useState({
    player: { x: 0, y: 0, vx: 0, vy: 0, width: 40, height: 40 },
    ball: { x: 0, y: 0, vx: 0, vy: 0, width: 20, height: 20 },
    drink: { x: 0, y: 0, width: 20, height: 20, active: false },
    score: 0,
    gameRunning: false,
    speedBoost: false,
    speedBoostTimer: 0
  });

  const gameRef = useRef();
  const animationRef = useRef();
  const keysRef = useRef({});

  // Game Functions
  const initializeGame = () => {
    if (!gameRef.current) return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const bottomY = rect.height - 200; // Adjusted for 200px player height
    
    setGameState({
      player: { x: centerX - 100, y: bottomY, vx: 0, vy: 0, width: 200, height: 200 },
      ball: { x: centerX - 10, y: bottomY - 100, vx: 0, vy: -1, width: 20, height: 20 },
      drink: { x: Math.random() * (rect.width - 20), y: Math.random() * (rect.height - 100), width: 20, height: 20, active: false },
      score: 0,
      gameRunning: true,
      speedBoost: false,
      speedBoostTimer: 0
    });
  };

  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    
    // Handle step-wise movement
    if (key === 'a' || key === 'arrowleft') {
      setGameState(prevState => ({
        ...prevState,
        player: {
          ...prevState.player,
          x: Math.max(0, prevState.player.x - 30) // Move left by 30px (adjusted for larger sprite)
        }
      }));
    }
    if (key === 'd' || key === 'arrowright') {
      setGameState(prevState => {
        const rect = gameRef.current?.getBoundingClientRect();
        const maxX = rect ? rect.width - prevState.player.width : 0;
        return {
          ...prevState,
          player: {
            ...prevState.player,
            x: Math.min(maxX, prevState.player.x + 30) // Move right by 30px (adjusted for larger sprite)
          }
        };
      });
    }
    if (key === ' ') {
      setGameState(prevState => {
        const rect = gameRef.current?.getBoundingClientRect();
        if (!rect) return prevState;
        
        // Only allow jump if player is on the ground
        const isOnGround = prevState.player.y >= rect.height - prevState.player.height;
        
        if (isOnGround) {
          return {
            ...prevState,
            player: {
              ...prevState.player,
              vy: -20 // Stronger jump force for larger sprite
            }
          };
        }
        return prevState;
      });
    }
    
    e.preventDefault();
  };

  const handleKeyUp = (e) => {
    keysRef.current[e.key.toLowerCase()] = false;
    e.preventDefault();
  };

  const checkCollision = (obj1, obj2) => {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  };

  const gameLoop = () => {
    if (!gameState.gameRunning) return;

    setGameState(prevState => {
      const newState = { ...prevState };
      const rect = gameRef.current?.getBoundingClientRect();
      if (!rect) return prevState;

      // Player movement - now handled in keydown events for step-wise movement
      // Only handle gravity and vertical movement
      newState.player.vy += 0.8;
      if (newState.player.y >= rect.height - newState.player.height) {
        newState.player.y = rect.height - newState.player.height;
        newState.player.vy = 0;
      }

      // Update player vertical position
      newState.player.y += newState.player.vy;

      // Apply gravity to ball - much slower
      newState.ball.vy += 0.1; // Reduced from 0.3
      newState.ball.x += newState.ball.vx;
      newState.ball.y += newState.ball.vy;

      // Ball collision with walls - much slower bounces
      if (newState.ball.x <= 0 || newState.ball.x >= rect.width - newState.ball.width) {
        newState.ball.vx *= -0.5; // Reduced from -0.8
        newState.ball.x = Math.max(0, Math.min(newState.ball.x, rect.width - newState.ball.width));
      }
      if (newState.ball.y <= 0) {
        newState.ball.vy *= -0.5; // Reduced from -0.8
        newState.ball.y = 0;
      }

      // Ball collision with player - higher bounce
      if (checkCollision(newState.player, newState.ball)) {
        const hitAngle = (newState.ball.x - newState.player.x) / newState.player.width;
        const playerSpeed = Math.sqrt(newState.player.vx * newState.player.vx + newState.player.vy * newState.player.vy);
        
        newState.ball.vx = hitAngle * 3 + newState.player.vx * 0.1; // Keep horizontal movement moderate
        newState.ball.vy = -Math.abs(newState.ball.vy) - 6; // Much stronger upward force
        newState.score += 1;
      }

      // Game over if ball hits ground - TEMPORARILY DISABLED
      // if (newState.ball.y >= rect.height) {
      //   newState.gameRunning = false;
      //   setTimeout(() => initializeGame(), 2000);
      // }

      // Drink power-up logic
      if (!newState.drink.active && Math.random() < 0.001) {
        newState.drink.active = true;
        newState.drink.x = Math.random() * (rect.width - 20);
        newState.drink.y = Math.random() * (rect.height - 100);
      }

      if (newState.drink.active && checkCollision(newState.player, newState.drink)) {
        newState.drink.active = false;
        newState.speedBoost = true;
        newState.speedBoostTimer = 300; // 5 seconds at 60fps
      }

      // Speed boost timer
      if (newState.speedBoostTimer > 0) {
        newState.speedBoostTimer--;
      } else {
        newState.speedBoost = false;
      }

      return newState;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  // Game effects
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState.gameRunning) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gameRunning]);

  // Initialize game on mount
  useEffect(() => {
    setTimeout(() => initializeGame(), 100);
  }, []);

  return (
    <div className="nine-man-game-container">
      {/* Hamburger Menu */}
      <div className="hamburger-menu">
        <button className="hamburger-button" onClick={onExit}>
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Reset Button */}
      <div className="reset-button-container">
        <button className="reset-button" onClick={initializeGame}>
          Reset Game
        </button>
      </div>
      
      <div className="nine-man-game" ref={gameRef}>
        <div 
          className="player-sprite"
          style={{
            left: `${gameState.player.x}px`,
            top: `${gameState.player.y}px`,
            transform: gameState.speedBoost ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <img src="/images/player.png" alt="Player" />
        </div>
        <div 
          className="ball-sprite"
          style={{
            left: `${gameState.ball.x}px`,
            top: `${gameState.ball.y}px`
          }}
        >
          <img src="/images/ball.png" alt="Ball" />
        </div>
        {gameState.drink.active && (
          <div 
            className="drink-sprite"
            style={{
              left: `${gameState.drink.x}px`,
              top: `${gameState.drink.y}px`
            }}
          >
            <img src="/images/placeholder.png" alt="Drink" />
          </div>
        )}
        <div className="score-display">
          {gameState.score}
        </div>
        {!gameState.gameRunning && (
          <div className="game-over">
            <p>Game Over!</p>
            <p>Score: {gameState.score}</p>
            <button onClick={initializeGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NineManGame;
