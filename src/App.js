import React, { useState, useMemo } from 'react';
import './App.css';
import PlayerCard from './components/PlayerCard';
import likersData from './extracted_likers.json';

const App = () => {
  // State management for modes
  const [currentMode, setCurrentMode] = useState('car'); // 'olympics', 'fantasy', 'car'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

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
      
      <header className="app-header">
        <h1>{currentMode === 'fantasy' ? 'Fantasy Draft' : "Nicholas' Bday Olympics"}</h1>
        
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
                className={`menu-item ${currentMode === 'car' ? 'active' : ''}`}
                onClick={() => changeMode('car')}
              >
                Car Mode
              </button>
            </div>
          )}
        </div>

        {/* Car Animation - only show in olympics mode */}
        {currentMode === 'olympics' && (
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
        ) : (
          <div className="dashboard-container">
            {/* Row titles on the left */}
            <div className="row-titles">
              {rowTitles.map((title, index) => (
                <div key={index} className="row-title">
                  {title}
                </div>
              ))}
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
    </div>
  );
};

export default App;
