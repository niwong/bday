import React, { useState, useMemo } from 'react';
import './App.css';
import PlayerCard from './components/PlayerCard';
import NineManGame from './components/NineManGame/NineManGame';
import likersData from './extracted_likers.json';

const App = () => {
  // State management for modes
  const [currentMode, setCurrentMode] = useState('olympics'); // 'olympics', 'fantasy', 'car', '9man'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [showGame1Popup, setShowGame1Popup] = useState(false);
  const [showGame2Popup, setShowGame2Popup] = useState(false);
  const [showGame3Popup, setShowGame3Popup] = useState(false);
  const [showGame4Popup, setShowGame4Popup] = useState(false);
  const [showGame5Popup, setShowGame5Popup] = useState(false);
  const [showNineManPopup, setShowNineManPopup] = useState(false);

  // Memoized data generation to prevent refresh on mode changes
  const teamData = useMemo(() => {
    // Function to randomly select players from likers data
    const getRandomPlayers = (count) => {
      const shuffled = [...likersData].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map((liker, index) => ({
        id: index + 1,
        name: liker.name,
        ranking: index + 1,
        score: Math.random() * 2 + 3, // Random score between 3.0 and 5.0
        profilePicUrl: liker.profile_pic_url
      }));
    };

    // Generate team data with random players from likers
    return [
      {
        teamId: 1,
        title: "Team 1",
        players: getRandomPlayers(5)
      },
      {
        teamId: 2,
        title: "Team 2", 
        players: getRandomPlayers(5)
      },
      {
        teamId: 3,
        title: "Team 3",
        players: getRandomPlayers(5)
      },
      {
        teamId: 4,
        title: "Team 4",
        players: getRandomPlayers(5)
      },
      {
        teamId: 5,
        title: "Team 5",
        players: getRandomPlayers(5)
      }
    ];
  }, []); // Empty dependency array means this only runs once

  // Row titles for the left side
  const rowTitles = ["Game 1 🏐", "Game 2 🍝", "Game 3 ♟️", "Game 4 ☕", "Game 5 🏅"];

  // Memoized Fantasy Draft data - 10 teams, 6 rounds visible
  // COMMENTED OUT - Fantasy mode temporarily disabled
  /*
  const fantasyData = useMemo(() => {
    // Function to randomly select players from likers data (for fantasy draft)
    const getRandomPlayers = (count) => {
      const shuffled = [...likersData].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map((liker, index) => ({
        id: index + 1,
        name: liker.name,
        ranking: index + 1,
        score: Math.random() * 2 + 3, // Random score between 3.0 and 5.0
        profilePicUrl: liker.profile_pic_url
      }));
    };

    const fantasyTeams = Array.from({ length: 10 }, (_, i) => ({
      teamId: i + 1,
      name: `Team ${i + 1}`,
      players: []
    }));

    const fantasyRounds = Array.from({ length: 6 }, (_, roundIndex) => {
      const roundNumber = roundIndex + 1;
      const isSnakeRound = roundNumber % 2 === 0; // Even rounds go right to left
      const teamOrder = isSnakeRound ? Array.from({ length: 10 }, (_, i) => 10 - i) : Array.from({ length: 10 }, (_, i) => i + 1);
      
      return {
        roundNumber,
        picks: teamOrder.map((teamId, pickIndex) => {
          const pickNumber = roundNumber * 10 - (isSnakeRound ? pickIndex : 9 - pickIndex);
          const randomPlayer = getRandomPlayers(1)[0];
          return {
            pickNumber,
            teamId,
            player: randomPlayer,
            position: pickIndex < 2 ? 'QB' : pickIndex < 4 ? 'RB' : pickIndex < 6 ? 'WR' : pickIndex < 7 ? 'TE' : 'FLEX'
          };
        })
      };
    });

    return { fantasyTeams, fantasyRounds };
  }, []); // Empty dependency array means this only runs once
  */

  // Menu toggle function
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Mode change function
  const changeMode = (mode) => {
    setCurrentMode(mode);
    setIsMenuOpen(false);
    if (mode === '9man') {
      setShowNineManPopup(true);
    }
  };

  return (
    <div className="app">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="welcome-popup-overlay">
          <div className="welcome-popup">
            <div className="welcome-content">
              <div className="welcome-car-image">
                <img src="/images/car-bigger.png" alt="Driving car" className="car-image" />
              </div>
              <div className="welcome-text">
                <p className="welcome-greeting">howzit u fekes?</p>
                <p className="welcome-description">
                  Welcome to my asynchronous birthday olympics! Think of this as a nice outlet to release some of ur hyper-competitive energies as y'all work together to mimic bits of my life and favorite things in SF.
                </p>
                <p className="welcome-description">
                  There are five games -- one for each teammate. Choose ur teammates wisely. Click on each game title for its instructions.
                </p>
                <p className="welcome-description">
                  Each event will be scored out of 5 fantasy points. The winning team will get to eat dinner with me, and I'm buying drinks.
                </p>
                <button 
                  className="welcome-close-button"
                  onClick={() => setShowWelcomePopup(false)}
                >
                  Get started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 1 Popup */}
      {showGame1Popup && (
        <div className="game1-popup-overlay">
          <div className="game1-popup">
            <div className="game1-content">
              <div className="game1-volleyball-image">
                <img src="/images/volleyball.png" alt="Volleyball player" className="volleyball-image" />
              </div>
              <div className="game1-text">
                <p className="game1-title">Game 1: Volleyball</p>
                <p className="game1-description">
                  I never would've expected this sport to be such a big part 
                  of my adult life. But alas. Here we are. I just love it
                  so much.
                </p>
                <p className="game1-description">
                  The first game is a volleyball themed activity. It should
                  be hard enough that even the vb players in the team
                  will struggle.
                </p>
                <p className="game1-description">
                  Maybe we should drink...
                </p>
                <button 
                  className="game1-close-button"
                  onClick={() => setShowGame1Popup(false)}
                >
                  acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 2 Popup */}
      {showGame2Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/red-pot.png" alt="Red pot" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 2: Pasta</p>
                <p className="game-description">
                  I've been making the same pasta since college. I've cooked it for many of you.
                  Here's the recipe... try to imitate it, and whoever gets closest wins. ;)
                </p>
                <div className="game-description">
                  Nick's Pasta:
                  <ul>
                    <li>celery, carrot, onion</li>
                    <li>garlic, red pepper flakes, fennel seed</li>
                    <li>2lbs ground beef (protein)</li>
                    <li>wine</li>
                    <li>tomato sauce</li>
                    <li>de cecco pasta</li>
                  </ul>
                </div>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame2Popup(false)}
                >
                  acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 3 Popup */}
      {showGame3Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/chess.png" alt="Game 3 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 3: Chess</p>
                <p className="game-description">
                  Once upon a time ago, I used to play competitive chess. Let's see if u can beat me in a
                  round of speed chess.
                </p>
                <p className="game-description">
                  5pts awarded if u can beat me. Other points awarded for effort, awarded subjectively. 
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame3Popup(false)}
                >
                  your move!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 4 Popup */}
      {showGame4Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/placeholder.png" alt="Game 4 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 4: Coffee</p>
                <p className="game-description">
                  Love me some coffee.
                </p>
                <p className="game-description">
                  Who can make the best cup of joe?
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame4Popup(false)}
                >
                  wired
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 5 Popup */}
      {showGame5Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/placeholder.png" alt="Game 5 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 5: Trivia</p>
                <p className="game-description">
                  Placeholder text for Game 5. This will be updated with the actual game description.
                </p>
                <p className="game-description">
                  More placeholder content will go here.
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame5Popup(false)}
                >
                  understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9man Mode Popup */}
      {showNineManPopup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/player.png" alt="9man Mode" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">9man Mode</p>
                <p className="game-description">
                  This mode is intended for web browser only.
                </p>
                <p className="game-description">
                  Use WASD to move and spacebar to jump. Keep the ball up!
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowNineManPopup(false)}
                >
                  start game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="app-header">
        <h1>{currentMode === 'fantasy' ? 'Fantasy Draft' : "Nicholas' Bday Olympics"}</h1>
        
        {/* Intro Button */}
        <button 
          className="intro-button"
          onClick={() => setShowWelcomePopup(true)}
        >
          Intro
        </button>

        {/* Hamburger Menu */}
        <div className="hamburger-menu">
          <button className="hamburger-button" onClick={toggleMenu}>
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          
          {isMenuOpen && (
            <div className="menu-dropdown">
              <button 
                className={`menu-item ${currentMode === 'olympics' ? 'active' : ''}`}
                onClick={() => changeMode('olympics')}
              >
                Olympics Mode
              </button>
              <button 
                className={`menu-item ${currentMode === 'fantasy' ? 'active' : ''}`}
                onClick={() => changeMode('fantasy')}
              >
                Fantasy Draft
              </button>
              <button 
                className={`menu-item ${currentMode === '9man' ? 'active' : ''}`}
                onClick={() => changeMode('9man')}
              >
                9man Mode
              </button>
            </div>
          )}
        </div>

        {/* Car Animation - show when car mode is active */}
        {currentMode === 'car' && (
          <div className="car-container">
            <img src="/images/car.png" alt="Driving car" className="animated-car" />
          </div>
        )}
      </header>
      
      <main className="dashboard">
        {currentMode === 'fantasy' ? (
          <div className="coming-soon-container">
            <div className="coming-soon-content">
              <div className="coming-soon-emoji">🏐</div>
              <h2 className="coming-soon-title">Coming Soon</h2>
              <p className="coming-soon-subtitle">Fantasy Draft mode is under development</p>
            </div>
          </div>
        ) : currentMode === '9man' ? (
          <NineManGame onExit={() => changeMode('olympics')} />
        ) : (
          <div className="dashboard-container">
            {/* Games header for mobile */}
            <div className="games-header-mobile">Games:</div>
            
            {/* Row titles on the left */}
            <div className="row-titles">
              {rowTitles.map((title, index) => {
                const handleClick = () => {
                  switch(index) {
                    case 0: setShowGame1Popup(true); break;
                    case 1: setShowGame2Popup(true); break;
                    case 2: setShowGame3Popup(true); break;
                    case 3: setShowGame4Popup(true); break;
                    case 4: setShowGame5Popup(true); break;
                    default: break;
                  }
                };
                
                return (
                  <div 
                    key={index} 
                    className="row-title"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="row-title-desktop">{title.split(' ').slice(0, -1).join(' ')} {title.split(' ').slice(-1)}</span>
                    <span className="row-title-mobile">{index + 1}. {title.split(' ').slice(-1)}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Teams container */}
            <div className="teams-container">
              {teamData.map((team) => {
                const teamTotal = team.players.reduce((sum, player) => sum + player.score, 0);
                return (
                  <div key={team.teamId} className="team-column">
                    <h2 className="team-title">{team.title}</h2>
                    <div className="players-container">
                      {team.players.map((player) => (
                        <PlayerCard
                          key={player.id}
                          name={player.name}
                          ranking={player.ranking}
                          score={player.score}
                          profilePicUrl={player.profilePicUrl}
                        />
                      ))}
                    </div>
                    <div className="team-total">
                      <span className="total-label">Total:</span>
                      <span className="total-score">{teamTotal.toFixed(1)}/25.0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Car Mode Button */}
      <button 
        className={`floating-car-button ${currentMode === 'car' ? 'active' : ''}`}
        onClick={() => setCurrentMode(currentMode === 'car' ? 'olympics' : 'car')}
        title="Car Mode"
      >
        <img src="/images/car.png" alt="Car Mode" className="car-icon" />
      </button>
    </div>
  );
};

export default App;
