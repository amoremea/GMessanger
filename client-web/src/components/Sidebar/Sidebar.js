import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../Common/Avatar';
import { SettingsMenu } from './SettingsMenu';
import { SearchBar } from './SearchBar';
import { ResizeHandle } from '../Common/ResizeHandle';

export const Sidebar = ({ chats, currentChat, openChat, createChat, onOpenGroupModal, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const { 
    friends, 
    friendRequests, 
    loadFriends, 
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend 
  } = useFriends(); // Убрали лишние переменные
  const { theme, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('chats');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

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

  const handleCreatePrivateChat = async (targetUserId) => {
    await createChat([user?.userId, targetUserId], false);
  };

  const getChatDisplayName = (chat) => {
    if (chat.isGroup) {
      return chat.name;
    }
    const otherUser = chat.participants?.find(p => p._id !== user?.userId);
    return otherUser?.displayName || otherUser?.username || 'Чат';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) {
      return { isGroup: true, groupName: chat.name };
    }
    return chat.participants?.find(p => p._id !== user?.userId);
  };

  return (
    <div className="sidebar d-flex flex-column h-100" style={{ width: sidebarWidth }}>
      <ResizeHandle onMouseDown={startResizing} />

      <div className="overflow-auto flex-grow-1 p-2">
        <SearchBar onOpenProfile={onOpenProfile} />

        {/* Стильные вкладки */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <i className="bi bi-chat-dots me-1"></i>
            Чаты
          </button>
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => { setActiveTab('friends'); loadFriends(); }}
          >
            <i className="bi bi-people me-1"></i>
            Друзья
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="bi bi-person-plus me-1"></i>
            Заявки
            {friendRequests.length > 0 && (
              <span className="tab-badge">{friendRequests.length}</span>
            )}
          </button>
        </div>

        {/* Вкладка Чаты */}
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
                const displayName = getChatDisplayName(chat);
                const avatarUser = getChatAvatar(chat);
                const isActive = currentChat === chat._id;
                
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
                        <Avatar user={avatarUser} size={38} showBadge={true} />
                      )}
                      <div className="flex-grow-1">
                        <div className="fw-bold">{displayName}</div>
                        <div className="small text-muted text-truncate">
                          {chat.lastMessage?.text || 'Нет сообщений'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Вкладка Друзья */}
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
                      onClick={() => handleCreatePrivateChat(f._id)}
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

        {/* Вкладка Заявки */}
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
                      onClick={() => acceptFriendRequest(req._id)} 
                      title="Принять"
                      style={{ width: 32, height: 32 }}
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-danger rounded-circle" 
                      onClick={() => declineFriendRequest(req._id)} 
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