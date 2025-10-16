import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ name, ranking, score, profilePicUrl, isAdminMode, isEmpty, onScoreUpdate, onRemove, onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(score.toString());

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

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a background color based on the name
  const getBackgroundColor = (name) => {
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
          ) : (
            <div className="player-score empty-score">Click + to add</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
