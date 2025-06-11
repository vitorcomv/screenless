import React, { createContext, useState, useContext } from 'react';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';

// 1. Cria o Context
const AlertContext = createContext();

// 2. Cria o Provider (o componente que vai envolver sua aplicação)
export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isOpen: false,
    message: '',
    type: 'success', // success, error, warning, info
  });

  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Função para mostrar o alerta de feedback
  const showAlert = (message, type = 'success') => {
    setAlert({
      isOpen: true,
      message,
      type,
    });
    // Opcional: fechar automaticamente após um tempo
    setTimeout(() => handleCloseAlert(), 4000);
  };

  // Função para mostrar o diálogo de confirmação
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
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirm,
      }}
    >
      {children}
      <CustomAlert
        isOpen={alert.isOpen}
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

// 3. Cria um hook customizado para facilitar o uso do contexto
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};