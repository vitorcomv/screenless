import React from 'react';
import './CustomAlert.css';

const CustomAlert = ({ isOpen, message, type, onClose }) => {
  if (!isOpen) {
    return null;
  }

  // Define o ícone com base no tipo de alerta
  const icons = {
    success: '✓', // Checkmark
    error: '✖',   // Cross
    warning: '!', // Exclamation mark
    info: 'ℹ',    // Info symbol
  };

  return (
    <div className={`custom-alert-container ${type}`}>
      <div className="custom-alert-content">
        <span className="alert-icon">{icons[type] || 'ℹ'}</span>
        <p>{message}</p>
        <button onClick={onClose} className="alert-close-button">&times;</button>
      </div>
    </div>
  );
};

export default CustomAlert;