// components/MainApp.js - проверьте эту часть
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { ChatMain } from './Chat/ChatMain';
import { ProfileModal } from './Modals/ProfileModal';
import { GroupModal } from './Modals/GroupModal';
import { GroupInfoModal } from './Modals/GroupInfoModal';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

export const MainApp = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved) : 320;
  });
  
  const { 
    chats, 
    messages, 
    currentChat, 
    openChat, 
    sendMessage, 
    createChat, 
    loadChats 
  } = useChat();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const currentChatData = chats.find(c => c._id === currentChat);

  // Сохраняем ширину сайдбара
  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth);
  }, [sidebarWidth]);

  // Отслеживаем изменение размера окна
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const handleOpenChat = (chatId) => {
    openChat(chatId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Функции для открытия модальных окон
  const handleOpenProfile = (userData) => {
    console.log('🟢 Opening profile modal with user:', userData);
    setProfileUser(userData);
    setIsProfileModalOpen(true);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleCloseProfileModal = () => {
    console.log('🔴 Closing profile modal');
    setIsProfileModalOpen(false);
    setProfileUser(null);
  };

  const handleOpenGroupModal = () => {
    console.log('🟢 Opening group modal');
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    console.log('🔴 Closing group modal');
    setIsGroupModalOpen(false);
  };

  const handleOpenGroupInfo = () => {
    console.log('🟢 Opening group info modal');
    setIsGroupInfoOpen(true);
  };

  const handleCloseGroupInfo = () => {
    console.log('🔴 Closing group info modal');
    setIsGroupInfoOpen(false);
  };

  console.log('🔵 Modal states:', { isProfileModalOpen, isGroupModalOpen, isGroupInfoOpen, profileUser });

  return (
    <div className={`chat-container ${theme}`}>
      {/* Мобильная кнопка */}
      {isMobile && (
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ display: isMobileMenuOpen ? 'none' : 'flex' }}
        >
          <i className="bi bi-list"></i>
        </button>
      )}

      {/* Оверлей для мобильного меню */}
      {isMobile && isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Сайдбар */}
      <div 
        className={`sidebar ${isMobile && isMobileMenuOpen ? 'open' : ''}`}
        style={{ width: isMobile ? '85%' : `${sidebarWidth}px` }}
      >
        <Sidebar
          chats={chats}
          currentChat={currentChat}
          openChat={handleOpenChat}
          createChat={createChat}
          onOpenGroupModal={handleOpenGroupModal}
          onOpenProfile={handleOpenProfile}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          width={isMobile ? undefined : sidebarWidth}
          onWidthChange={setSidebarWidth}
        />
        <div className="sidebar-resizer" onMouseDown={(e) => {
          if (isMobile) return;
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          
          const onMouseMove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            if (newWidth >= 260 && newWidth <= 500) {
              setSidebarWidth(newWidth);
            }
          };
          
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
          };
          
          document.body.style.cursor = 'col-resize';
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }} />
      </div>

      {/* Основная область чата */}
      <div className="chat-main">
        <ChatMain
          currentChat={currentChat}
          messages={messages}
          chats={chats}
          onSendMessage={sendMessage}
          onOpenProfile={handleOpenProfile}
          onOpenGroupInfo={handleOpenGroupInfo}
          isMobile={isMobile}
          onBack={() => setIsMobileMenuOpen(true)}
        />
      </div>

      {/* МОДАЛЬНЫЕ ОКНА - должны быть за пределами всего */}
      {isProfileModalOpen && profileUser && (
        <ProfileModal
          user={profileUser}
          onClose={handleCloseProfileModal}
          openChat={openChat}
        />
      )}

      {isGroupModalOpen && (
        <GroupModal onClose={handleCloseGroupModal} />
      )}

      {isGroupInfoOpen && currentChatData && (
        <GroupInfoModal 
          chat={currentChatData} 
          onClose={handleCloseGroupInfo}
          onOpenProfile={handleOpenProfile}
          onRefresh={loadChats}
        />
      )}
    </div>
  );
};