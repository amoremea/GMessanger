import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const showError = useCallback((message) => {
    toast.error(message);
  }, []);

  const showInfo = useCallback((message) => {
    toast(message, {
      icon: 'ℹ️',
    });
  }, []);

  const showFriendRequest = useCallback((sender, onAccept, onDecline) => {
    toast((t) => (
      <div className="d-flex flex-column gap-2" style={{ minWidth: '250px' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
            <i className="bi bi-person-plus-fill text-white"></i>
          </div>
          <div>
            <div className="fw-bold">{sender.displayName || sender.username}</div>
            <div className="small text-muted">хочет добавить вас в друзья</div>
          </div>
        </div>
        <div className="d-flex gap-2 mt-2">
          <button 
            className="btn btn-sm btn-success flex-grow-1"
            onClick={() => {
              onAccept();
              toast.dismiss(t.id);
            }}
          >
            Принять
          </button>
          <button 
            className="btn btn-sm btn-outline-danger flex-grow-1"
            onClick={() => {
              onDecline();
              toast.dismiss(t.id);
            }}
          >
            Отклонить
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-right',
    });
  }, []);

  const showNewMessage = useCallback((chatName, message, chatId, onClick) => {
    toast((t) => (
      <div 
        className="d-flex align-items-center gap-2 cursor-pointer"
        onClick={() => {
          onClick(chatId);
          toast.dismiss(t.id);
        }}
        style={{ cursor: 'pointer', minWidth: '250px' }}
      >
        <div className="bg-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
          <i className="bi bi-chat-dots-fill text-white"></i>
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold">{chatName}</div>
          <div className="small text-truncate" style={{ maxWidth: '180px' }}>
            {message.text || '📎 Файл'}
          </div>
        </div>
        <i className="bi bi-chevron-right text-muted"></i>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      showSuccess,
      showError,
      showInfo,
      showFriendRequest,
      showNewMessage,
      addNotification,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};