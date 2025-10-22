import React, { useState, useMemo } from 'react';
import './PlayerSelectionModal.css';

const PlayerSelectionModal = ({ isOpen, onSelect, onClose, availablePlayers }) => {
  const [searchTerm, setSearchTerm] = useState('');

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
          {filteredPlayers.length === 0 ? (
            <div className="no-players-message">
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
            <div className="players-grid">
              {filteredPlayers.map((player, index) => {
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
              })}
            </div>
          )}
        </div>
        
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
