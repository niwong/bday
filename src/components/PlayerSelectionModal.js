import React, { useState, useMemo } from 'react';
import './PlayerSelectionModal.css';

const PlayerSelectionModal = ({ isOpen, onSelect, onClose, availablePlayers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomNameEntry, setShowCustomNameEntry] = useState(false);
  const [customPlayerName, setCustomPlayerName] = useState('');

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) {
      return availablePlayers;
    }
    
    return availablePlayers.filter(player => {
      const name = player.full_name || player.username || player.name;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [availablePlayers, searchTerm]);

  // Reset search when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setShowCustomNameEntry(false);
      setCustomPlayerName('');
    }
  }, [isOpen]);

  // Generate initials from name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') {
      return '??';
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a background color based on the name
  const getBackgroundColor = (name) => {
    if (!name || typeof name !== 'string') {
      return '#CCCCCC'; // Default gray color for invalid names
    }
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handlePlayerClick = (player) => {
    onSelect(player);
  };

  const handleAddYourselfClick = () => {
    setShowCustomNameEntry(true);
  };

  const handleAddCustomPlayer = () => {
    if (customPlayerName.trim()) {
      const customPlayer = {
        full_name: customPlayerName.trim(),
        username: customPlayerName.trim(),
        name: customPlayerName.trim(),
        profile_pic_url: null
      };
      onSelect(customPlayer);
      onClose();
    }
  };

  const handleBackToPlayerList = () => {
    setShowCustomNameEntry(false);
    setCustomPlayerName('');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="player-modal-overlay" onClick={handleOverlayClick}>
      <div className="player-modal">
        <div className="player-modal-header">
          <h3>Select a Player</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        {!showCustomNameEntry ? (
          <>
            {/* Search Box */}
            <div className="player-modal-search">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>
            
            <div className="player-modal-content">
              <div className="players-grid">
                {filteredPlayers.length === 0 ? (
                  <div className="no-players-message" style={{ gridColumn: '1 / -1' }}>
                    {searchTerm.trim() ? (
                      <>
                        <p>No players found matching "{searchTerm}".</p>
                        <p>Try a different search term.</p>
                      </>
                    ) : (
                      <>
                        <p>No available players to add.</p>
                        <p>All players are already on teams.</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredPlayers.map((player, index) => {
                    const playerName = player.full_name || player.username || player.name;
                    return (
                      <div
                        key={`${playerName}-${index}`}
                        className="player-option"
                        onClick={() => handlePlayerClick(player)}
                      >
                        <div 
                          className="player-option-avatar"
                          style={{ backgroundColor: getBackgroundColor(playerName) }}
                        >
                          {player.profile_pic_url ? (
                            <img 
                              src={player.profile_pic_url} 
                              alt={playerName}
                              className="player-option-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="player-option-initials" style={{ display: player.profile_pic_url ? 'none' : 'flex' }}>
                            {getInitials(playerName)}
                          </div>
                        </div>
                        <div className="player-option-name">{playerName}</div>
                      </div>
                    );
                  })
                )}
                {/* Add Yourself Option - Always visible at the end */}
                <div
                  className="player-option add-yourself-option"
                  onClick={handleAddYourselfClick}
                >
                  <div 
                    className="player-option-avatar"
                    style={{ backgroundColor: '#6c757d' }}
                  >
                    <div className="player-option-initials">+</div>
                  </div>
                  <div className="player-option-name">No ig? Add yourself!</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Custom Name Entry Screen */
          <div className="player-modal-content">
            <div className="custom-name-entry">
              <h3>Add Yourself</h3>
              <p>Enter your name to add yourself as a player</p>
              <input
                type="text"
                placeholder="Your name"
                value={customPlayerName}
                onChange={(e) => setCustomPlayerName(e.target.value)}
                className="custom-name-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomPlayer();
                  }
                }}
              />
              <div className="custom-name-buttons">
                <button className="back-button" onClick={handleBackToPlayerList}>
                  Back
                </button>
                <button 
                  className="add-player-button" 
                  onClick={handleAddCustomPlayer}
                  disabled={!customPlayerName.trim()}
                >
                  Add Player
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="player-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectionModal;
