import React, { useState, useMemo } from 'react';
import './App.css';
import PlayerCard from './components/PlayerCard';
import likersData from './extracted_likers.json';

const App = () => {
  // State management for modes
  const [currentMode, setCurrentMode] = useState('car'); // 'olympics', 'fantasy', 'car'
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <div className="fantasy-draft-container">
            <div className="draft-header">
              <h2>10-team Standard Snake</h2>
              <p>2 Min Per Pick • 15 Rounds</p>
            </div>
            
            <div className="draft-board">
              <div className="team-headers">
                {fantasyData.fantasyTeams.map((team) => (
                  <div key={team.teamId} className="team-header">
                    <button className="claim-button">CLAIM</button>
                    <h3>{team.name}</h3>
                  </div>
                ))}
              </div>
              
              <div className="draft-rounds">
                {fantasyData.fantasyRounds.map((round) => (
                  <div key={round.roundNumber} className="draft-round">
                    <div className="round-label">Round {round.roundNumber}</div>
                    <div className="round-picks">
                      {round.picks.map((pick) => (
                        <div key={pick.pickNumber} className="draft-pick">
                          <div className="pick-number">{pick.pickNumber}</div>
                          <div className="player-card-mini">
                            <img 
                              src={pick.player.profilePicUrl} 
                              alt={pick.player.name}
                              className="player-avatar-mini"
                            />
                            <div className="player-info-mini">
                              <div className="player-name-mini">{pick.player.name}</div>
                              <div className="player-position-mini">{pick.position}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
