import React from 'react';
import './App.css';
import PlayerCard from './components/PlayerCard';
import likersData from './extracted_likers.json';

const App = () => {
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
  const teamData = [
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

  // Row titles for the left side
  const rowTitles = ["Game 1 🏐", "Game 2 🍝", "Game 3 ♟️", "Game 4 ☕", "Game 5 🏅"];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nicholas' Bday Olympics</h1>
      </header>
      
      <main className="dashboard">
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
      </main>
    </div>
  );
};

export default App;
