import React, { createContext, useState, useContext } from 'react';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '', // Garanta que 'title' exista no estado inicial
    message: '',
    type: 'success',
  });

  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ===== A CORREÇÃO CRÍTICA ESTÁ AQUI =====
  // Adicionamos as chaves {} nos argumentos para "desestruturar" o objeto recebido
  const showAlert = ({ title, message, type = 'success' }) => {
    setAlert({
      isOpen: true,
      title,
      message,
      type,
    });
    // Opcional: fechar automaticamente após um tempo
    setTimeout(() => handleCloseAlert(), 4000);
  };

  // A função de confirmação já usava um objeto, então está correta
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
        title={alert.title} // Passa o título para o componente CustomAlert
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