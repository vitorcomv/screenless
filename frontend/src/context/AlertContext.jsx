import React, { createContext, useState, useContext } from 'react';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '', // Adicionamos title aqui
    message: '',
    type: 'success',
  });

  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ===== MUDANÇA PRINCIPAL AQUI =====
  // A função agora aceita argumentos simples, não um objeto
  const showAlert = (title, message, type = 'success') => {
    setAlert({
      isOpen: true,
      title,
      message,
      type,
    });
    setTimeout(() => handleCloseAlert(), 4000);
  };
  // ===================================

  const showConfirm = ({ title, message, onConfirm }) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        handleCloseConfirm();
        onConfirm();
      },
    });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, isOpen: false });
  };

  const handleCloseConfirm = () => {
    setConfirm({ ...confirm, isOpen: false });
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title} // Passando o title para o componente
        message={alert.message}
        type={alert.type}
        onClose={handleCloseAlert}
      />
      <CustomConfirm
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={handleCloseConfirm}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};