import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

export const NotificationBell = () => {
  const { notifications, removeNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        className="btn btn-light rounded-circle position-relative shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: 40, height: 40 }}
      >
        <i className="bi bi-bell-fill text-secondary"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="visually-hidden">уведомления</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="position-absolute end-0 mt-2 shadow-lg rounded bg-white" style={{ width: 320, zIndex: 1050 }}>
          <div className="p-2 border-bottom">
            <h6 className="mb-0 fw-bold">Уведомления</h6>
          </div>
          <div className="overflow-auto" style={{ maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div className="text-center text-muted p-4">
                <i className="bi bi-inbox fs-1"></i>
                <p className="mt-2 mb-0">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-2 border-bottom hover-bg-light position-relative">
                  <button 
                    className="btn-close btn-sm position-absolute top-0 end-0 m-1"
                    onClick={() => removeNotification(notif.id)}
                  ></button>
                  <div className="pe-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center bg-${notif.type === 'friend' ? 'primary' : 'info'} text-white`} style={{ width: 32, height: 32 }}>
                        <i className={`bi bi-${notif.type === 'friend' ? 'person-plus' : 'chat-dots'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="small fw-bold">{notif.title}</div>
                        <div className="small text-muted">{notif.message}</div>
                        <div className="small text-muted mt-1">{notif.time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};