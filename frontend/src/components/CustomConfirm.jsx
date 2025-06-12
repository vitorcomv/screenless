import React from 'react';
import './CustomConfirm.css';

const CustomConfirm = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="custom-confirm-overlay">
      <div className="custom-confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="custom-confirm-actions">
          <button onClick={onCancel} className="confirm-button cancel">
            Cancelar
          </button>
          <button onClick={onConfirm} className="confirm-button confirm">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirm;