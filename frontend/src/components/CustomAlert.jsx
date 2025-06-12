// CustomAlert.js - CÓDIGO MODIFICADO
import React from 'react';
import './CustomAlert.css';

const CustomAlert = ({ isOpen, title, message, type, onClose }) => { // Adicionamos 'title'
  if (!isOpen) {
    return null;
  }

  const icons = {
    success: '✓',
    error: '✖',
    warning: '!',
    info: 'ℹ',
  };

  return (
    <div className={`custom-alert-container ${type}`}>
      <div className="custom-alert-content">
        <span className="alert-icon">{icons[type] || 'ℹ'}</span>
        
        <div className="alert-text-content">
          {title && <h4>{title}</h4>} {/* Mostra o título apenas se ele for passado */}
          <p>{message}</p>
        </div>
        {/* ===== FIM DA MUDANÇA ===== */}

        <button onClick={onClose} className="alert-close-button">&times;</button>
      </div>
    </div>
  );
};

export default CustomAlert;