import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ name, ranking, score, profilePicUrl, isAdminMode, isEmpty, isCaptain, onScoreUpdate, onRemove, onAdd, onSetCaptain, onDragStart, onDragOver, onDrop, playerId, teamId, playerIndex }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(score.toString());
  const [showCaptainModal, setShowCaptainModal] = useState(false);

  // Handle double-click to enable editing (admin mode only)
  const handleDoubleClick = () => {
    if (isAdminMode && !isEmpty) {
      setIsEditing(true);
      setEditValue(score.toString());
    }
  };

  // Handle remove button click
  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (isAdminMode && !isEmpty && onRemove) {
      onRemove();
    }
  };

  // Handle add button click
  const handleAddClick = (e) => {
    e.stopPropagation();
    if (isAdminMode && isEmpty && onAdd) {
      onAdd();
    }
  };

  // Handle empty card click in non-admin mode
  const handleEmptyCardClick = () => {
    if (!isAdminMode && isEmpty) {
      setShowCaptainModal(true);
    }
  };

  // Handle drag start
  const handleDragStart = (e) => {
    if (isAdminMode && !isEmpty) {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        playerId,
        teamId,
        playerIndex,
        playerData: { name, ranking, score, profilePicUrl, isEmpty }
      }));
      e.dataTransfer.effectAllowed = 'move';
      e.target.classList.add('dragging');
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  // Handle drag over
  const handleDragOver = (e) => {
    if (isAdminMode && onDragOver) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.target.classList.add('drag-over');
    }
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.target.classList.remove('drag-over');
  };

  // Handle drop
  const handleDrop = (e) => {
    if (isAdminMode && onDrop) {
      e.preventDefault();
      e.target.classList.remove('drag-over');
      
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      onDrop(dragData, { playerId, teamId, playerIndex });
    }
  };

  // Handle score save
  const handleSave = () => {
    const newScore = parseFloat(editValue);
    if (!isNaN(newScore) && newScore >= 0 && newScore <= 5) {
      // Round to hundredths place (2 decimal places)
      const roundedScore = Math.round(newScore * 100) / 100;
      onScoreUpdate(roundedScore);
      setIsEditing(false);
    } else {
      // Reset to original value if invalid
      setEditValue(score.toString());
      setIsEditing(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setEditValue(score.toString());
    setIsEditing(false);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Handle crown button click
  const handleCrownClick = (e) => {
    e.stopPropagation();
    if (onSetCaptain) {
      onSetCaptain();
    }
  };

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

  return (
    <div 
      className={`player-card ${isAdminMode ? 'admin-mode' : ''} ${isEmpty ? 'empty' : ''}`}
      onDoubleClick={handleDoubleClick}
      onClick={handleEmptyCardClick}
      draggable={isAdminMode && !isEmpty}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Remove button (X icon) - only show on hover for filled cards */}
      {isAdminMode && !isEmpty && (
        <button 
          className="remove-icon"
          onClick={handleRemoveClick}
          title="Remove player"
        >
          ×
        </button>
      )}

      {/* Add button (+ icon) - only show on hover for empty cards */}
      {isAdminMode && isEmpty && (
        <button 
          className="add-icon"
          onClick={handleAddClick}
          title="Add player"
        >
          +
        </button>
      )}

      {/* Crown button - only show on hover for filled cards in admin mode */}
      {isAdminMode && !isEmpty && !isCaptain && (
        <button 
          className="crown-button"
          onClick={handleCrownClick}
          title="Make captain"
        >
          👑
        </button>
      )}

      <div className="player-info">
        <div 
          className="profile-picture"
          style={{ backgroundColor: isEmpty ? '#e0e0e0' : getBackgroundColor(name) }}
        >
          {!isEmpty && profilePicUrl ? (
            <img 
              src={profilePicUrl} 
              alt={name}
              className="profile-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="profile-initials" style={{ display: (!isEmpty && profilePicUrl) ? 'none' : 'flex' }}>
            {isEmpty ? '?' : getInitials(name)}
          </div>
        </div>
        {/* Captain crown - positioned relative to player-info container */}
        {isCaptain && !isEmpty && (
          <div className="captain-crown">👑</div>
        )}
        <div className="player-details">
          <h3 className="player-name">{isEmpty ? 'Empty Slot' : name}</h3>
          {!isEmpty && isEditing ? (
            <input
              type="number"
              className="player-score-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyPress}
              min="0"
              max="5"
              step="0.01"
              autoFocus
            />
          ) : !isEmpty ? (
            <div className="player-score">{score.toFixed(2)}/5.00</div>
          ) : isAdminMode ? (
            <div className="player-score empty-score">Click + to add</div>
          ) : null}
        </div>
      </div>

      {/* Captain Modal */}
      {showCaptainModal && (
        <div className="captain-modal-overlay" onClick={() => setShowCaptainModal(false)}>
          <div className="captain-modal" onClick={(e) => e.stopPropagation()}>
            <div className="captain-modal-content">
              <p>Ask the team captain (👑) to join the team</p>
              <button 
                className="captain-modal-close"
                onClick={() => setShowCaptainModal(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
