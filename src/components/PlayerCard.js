import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ name, ranking, score, profilePicUrl, isAdminMode, onScoreUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(score.toString());

  // Handle double-click to enable editing (admin mode only)
  const handleDoubleClick = () => {
    if (isAdminMode) {
      setIsEditing(true);
      setEditValue(score.toString());
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
      className={`player-card ${isAdminMode ? 'admin-mode' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="player-info">
        <div 
          className="profile-picture"
          style={{ backgroundColor: getBackgroundColor(name) }}
        >
          {profilePicUrl ? (
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
          <div className="profile-initials" style={{ display: profilePicUrl ? 'none' : 'flex' }}>
            {getInitials(name)}
          </div>
        </div>
        <div className="player-details">
          <h3 className="player-name">{name}</h3>
          {isEditing ? (
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
          ) : (
            <div className="player-score">{score.toFixed(2)}/5.00</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
