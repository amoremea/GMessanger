// components/MainApp.js - ИСПРАВЛЕННАЯ МОБИЛЬНАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { ChatMain } from './Chat/ChatMain';
import { ProfileModal } from './Modals/ProfileModal';
import { GroupModal } from './Modals/GroupModal';
import { GroupInfoModal } from './Modals/GroupInfoModal';
import { MobileNav } from './Layout/MobileNav';
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

  const handleOpenProfile = (userData) => {
    setProfileUser(userData);
    setIsProfileModalOpen(true);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  // Открыть меню
  const handleOpenMenu = () => {
    setIsMobileMenuOpen(true);
  };

  // Закрыть чат и вернуться к списку
  const handleCloseChat = () => {
    if (currentChat) {
      // Просто показываем плейсхолдер без чата
      // Для этого нужно будет доработать, но пока просто открываем меню
      setIsMobileMenuOpen(true);
    }
  };

  return (
    <div className={`chat-container ${theme}`}>
      {/* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */}
      {isMobile && (
        <>
          {/* Мобильная кнопка открытия меню - всегда показываем если нет активного чата */}
          {!currentChat && (
            <button 
              className="mobile-menu-btn"
              onClick={handleOpenMenu}
            >
              <i className="bi bi-list"></i>
            </button>
          )}
          
          {/* Мобильное меню (сайдбар) */}
          <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            <Sidebar
              chats={chats}
              currentChat={currentChat}
              openChat={handleOpenChat}
              createChat={createChat}
              onOpenGroupModal={() => setIsGroupModalOpen(true)}
              onOpenProfile={handleOpenProfile}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />
          </MobileNav>

          {/* Основная область чата */}
          <div className="chat-main">
            <ChatMain
              currentChat={currentChat}
              messages={messages}
              chats={chats}
              onSendMessage={sendMessage}
              onOpenProfile={handleOpenProfile}
              onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
              isMobile={true}
              onBack={handleCloseChat}
              onMenuOpen={handleOpenMenu}
            />
          </div>
        </>
      )}

      {/* ===== ДЕСКТОПНАЯ ВЕРСИЯ ===== */}
      {!isMobile && (
        <>
          {/* Десктопный сайдбар */}
          <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
            <Sidebar
              chats={chats}
              currentChat={currentChat}
              openChat={handleOpenChat}
              createChat={createChat}
              onOpenGroupModal={() => setIsGroupModalOpen(true)}
              onOpenProfile={handleOpenProfile}
              width={sidebarWidth}
              onWidthChange={setSidebarWidth}
            />
            <div className="sidebar-resizer" onMouseDown={(e) => {
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
              onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
              isMobile={false}
            />
          </div>
        </>
      )}

      {/* Модальные окна */}
      {isProfileModalOpen && profileUser && (
        <ProfileModal
          user={profileUser}
          onClose={() => {
            setIsProfileModalOpen(false);
            setProfileUser(null);
          }}
          openChat={openChat}
        />
      )}

      {isGroupModalOpen && (
        <GroupModal onClose={() => setIsGroupModalOpen(false)} />
      )}

      {isGroupInfoOpen && currentChatData && (
        <GroupInfoModal 
          chat={currentChatData} 
          onClose={() => setIsGroupInfoOpen(false)}
          onOpenProfile={handleOpenProfile}
          onRefresh={loadChats}
        />
      )}
    </div>
  );
};