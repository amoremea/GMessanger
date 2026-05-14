// components/Sidebar/Sidebar.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react'; // ⭐ ДОБАВИЛИ useEffect
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { useNotification } from '../../contexts/NotificationContext';
import { Avatar } from '../Common/Avatar';
import { NotificationBell } from '../Common/NotificationBell';
import { SettingsMenu } from './SettingsMenu';
import { SearchBar } from './SearchBar';
import { ResizeHandle } from '../Common/ResizeHandle';

export const Sidebar = ({ chats, currentChat, openChat, createChat, onOpenGroupModal, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { 
    friends, 
    friendRequests, 
    loadFriends, 
    loadFriendRequests,
    loadAllData,
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend 
  } = useFriends();
  const { theme, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('chats');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  // ⭐ ДОБАВЛЯЕМ: принудительное обновление при открытии чата
  useEffect(() => {
    if (currentChat) {
      // Обновляем список чатов, чтобы обнулить счетчик
      loadAllData();
    }
  }, [currentChat, loadAllData]);

  const startResizing = (e) => {
    const handleMouseMove = (m) => {
      const newWidth = m.clientX;
      if (newWidth > 200 && newWidth < 600) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleAcceptRequest = async (userId, userName) => {
    console.log('🔄 Принимаем заявку:', userId, userName);
    const result = await acceptFriendRequest(userId);
    if (result.success) {
      showSuccess(`${userName} теперь ваш друг!`);
      setTimeout(() => {
        loadAllData();
        loadFriends();
        loadFriendRequests();
      }, 500);
    }
  };

  const handleDeclineRequest = async (userId, userName) => {
    console.log('🔄 Отклоняем заявку:', userId, userName);
    const result = await declineFriendRequest(userId);
    if (result.success) {
      showError(`Заявка от ${userName} отклонена`);
      setTimeout(() => {
        loadFriendRequests();
      }, 500);
    }
  };

  const getLastMessageText = (chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    if (chat.lastMessage.text) return chat.lastMessage.text;
    if (chat.lastMessage.fileUrl) return '📎 Файл';
    return 'Новое сообщение';
  };

  const getLastMessageTime = (chat) => {
    if (!chat.lastMessage || !chat.lastMessage.createdAt) return '';
    const date = new Date(chat.lastMessage.createdAt);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  return (
    <div className="sidebar d-flex flex-column h-100" style={{ width: sidebarWidth }}>
      <ResizeHandle onMouseDown={startResizing} />

      <div className="p-2 border-bottom d-flex justify-content-between align-items-center">
        <SearchBar onOpenProfile={onOpenProfile} />
        <NotificationBell />
      </div>

      <div className="overflow-auto flex-grow-1 p-2">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <i className="bi bi-chat-dots me-1"></i>
            Чаты
            {chats.filter(c => (c.unreadCount?.[user?.userId] || 0) > 0).length > 0 && (
              <span className="tab-badge">
                {chats.filter(c => (c.unreadCount?.[user?.userId] || 0) > 0).length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('friends'); 
              loadFriends(); 
            }}
          >
            <i className="bi bi-people me-1"></i>
            Друзья
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('requests'); 
              loadFriendRequests();
            }}
          >
            <i className="bi bi-person-plus me-1"></i>
            Заявки
            {friendRequests.length > 0 && (
              <span className="tab-badge">{friendRequests.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'chats' && (
          <>
            <button className="btn btn-outline-primary w-100 mb-3 rounded-pill" onClick={onOpenGroupModal}>
              <i className="bi bi-people-fill me-2"></i>Создать группу
            </button>
            
            <div className="small text-muted fw-bold mb-2 ps-2">ВСЕ ЧАТЫ</div>
            {chats.length === 0 ? (
              <div className="text-muted text-center p-3">
                <i className="bi bi-chat-dots fs-1"></i>
                <p className="mt-2">Нет чатов</p>
                <small>Найдите пользователя через поиск</small>
              </div>
            ) : (
              chats.map(chat => {
                const other = chat.participants?.find(p => p._id !== user?.userId);
                const displayName = chat.isGroup ? chat.name : (other?.displayName || other?.username || 'Чат');
                const isActive = currentChat === chat._id;
                const unreadCount = chat.unreadCount?.[user?.userId] || 0;
                const lastMessageText = getLastMessageText(chat);
                const lastMessageTime = getLastMessageTime(chat);
                
                return (
                  <div
                    key={chat._id}
                    className={`p-2 chat-item rounded mb-1 ${isActive ? 'active' : ''}`}
                    onClick={() => openChat(chat._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      {chat.isGroup ? (
                        <div className="avatar-wrapper me-2">
                          <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center" style={{ width: 38, height: 38 }}>
                            <i className="bi bi-people-fill"></i>
                          </div>
                        </div>
                      ) : (
                        <Avatar user={other} size={38} showBadge={true} />
                      )}
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="fw-bold">{displayName}</div>
                          <div className="small text-muted">{lastMessageTime}</div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className={`small ${unreadCount > 0 ? 'fw-bold text-primary' : 'text-muted'} text-truncate`} style={{ maxWidth: '150px' }}>
                            {lastMessageText}
                          </div>
                          {unreadCount > 0 && (
                            <span className="badge bg-primary rounded-pill">{unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <>
            <div className="small text-muted fw-bold mb-2 ps-2">МОИ ДРУЗЬЯ</div>
            {friends.length === 0 ? (
              <div className="text-muted text-center p-3">
                <i className="bi bi-people fs-1"></i>
                <p className="mt-2">Нет друзей</p>
                <small>Найдите пользователей через поиск</small>
              </div>
            ) : (
              friends.map(f => (
                <div key={f._id} className="p-2 chat-item d-flex align-items-center rounded mb-1">
                  <Avatar user={f} size={38} showBadge={true} onClick={() => onOpenProfile(f)} />
                  <div className="flex-grow-1 ms-2" onClick={() => onOpenProfile(f)}>
                    <div className="fw-bold">{f.displayName || f.username}</div>
                    <div className="small text-muted">@{f.username}</div>
                  </div>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-primary rounded-circle"
                      onClick={() => createChat([user?.userId, f._id], false)}
                      style={{ width: 32, height: 32 }}
                      title="Написать"
                    >
                      <i className="bi bi-chat-dots"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle"
                      onClick={async () => {
                        if (window.confirm(`Удалить ${f.displayName || f.username} из друзей?`)) {
                          await removeFriend(f._id);
                          showSuccess(`${f.displayName || f.username} удален из друзей`);
                          await loadFriends();
                        }
                      }}
                      style={{ width: 32, height: 32 }}
                      title="Удалить из друзей"
                    >
                      <i className="bi bi-person-x"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className="small text-muted fw-bold mb-2 ps-2">ВХОДЯЩИЕ ЗАЯВКИ</div>
            {friendRequests.length === 0 ? (
              <div className="text-muted text-center p-3">
                <i className="bi bi-inbox fs-1"></i>
                <p className="mt-2">Нет заявок</p>
              </div>
            ) : (
              friendRequests.map(req => (
                <div key={req._id} className="p-2 chat-item d-flex align-items-center rounded mb-1">
                  <Avatar user={req} size={38} onClick={() => onOpenProfile(req)} />
                  <div className="flex-grow-1 ms-2">
                    <div className="fw-bold">{req.displayName || req.username}</div>
                    <div className="small text-muted">@{req.username}</div>
                  </div>
                  <div className="d-flex gap-1">
                    <button 
                      className="btn btn-sm btn-success rounded-circle" 
                      onClick={() => handleAcceptRequest(req._id, req.displayName || req.username)}
                      title="Принять"
                      style={{ width: 32, height: 32 }}
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-danger rounded-circle" 
                      onClick={() => handleDeclineRequest(req._id, req.displayName || req.username)}
                      title="Отклонить"
                      style={{ width: 32, height: 32 }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className="settings-footer p-2 d-flex align-items-center justify-content-between border-top">
        <div className="position-relative">
          <button className="btn btn-light rounded-circle shadow-sm" onClick={() => setShowSettings(!showSettings)}>
            <i className="bi bi-gear-fill text-secondary"></i>
          </button>
          {showSettings && (
            <SettingsMenu
              user={user}
              theme={theme}
              onThemeChange={changeTheme}
              onLogout={logout}
              onOpenProfile={() => onOpenProfile({ _id: user?.userId, username: user?.username })}
            />
          )}
        </div>
        <div className="me-2 small fw-bold text-muted">@{user?.username}</div>
      </div>
    </div>
  );
};