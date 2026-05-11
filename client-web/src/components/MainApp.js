import React, { useState } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { ChatMain } from './Chat/ChatMain';
import { ProfileModal } from './Modals/ProfileModal';
import { GroupModal } from './Modals/GroupModal';
import { GroupInfoModal } from './Modals/GroupInfoModal'; // Импортируем новый компонент
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';

export const MainApp = () => {
  const { theme } = useTheme();
  
  // Извлекаем все нужные функции и данные из хука чата
  const { 
    chats, 
    messages, 
    currentChat, 
    openChat, 
    sendMessage, 
    createChat, 
    loadChats 
  } = useChat();

  // Состояния для модальных окон
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  
  // Состояние для хранения пользователя, чей профиль мы хотим посмотреть
  const [profileUser, setProfileUser] = useState(null);

  // Находим данные текущего активного чата в общем массиве чатов
  const currentChatData = chats.find(c => c._id === currentChat);

  return (
    <div className={`container-fluid chat-container p-0 ${theme}`}>
      <div className="d-flex h-100">
        {/* Боковая панель */}
        <Sidebar
          chats={chats}
          currentChat={currentChat}
          openChat={openChat}
          createChat={createChat}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
          onOpenProfile={(user) => {
            setProfileUser(user);
            setIsProfileModalOpen(true);
          }}
        />

        {/* Основная область чата */}
        <ChatMain
          currentChat={currentChat}
          messages={messages}
          chats={chats}
          onSendMessage={sendMessage}
          onOpenProfile={(user) => {
            setProfileUser(user);
            setIsProfileModalOpen(true);
          }}
          onOpenGroupInfo={() => setIsGroupInfoOpen(true)} // Передаем функцию открытия информации о группе
        />

        {/* Модальное окно профиля пользователя */}
        {isProfileModalOpen && profileUser && (
          <ProfileModal
            user={profileUser}
            onClose={() => setIsProfileModalOpen(false)}
            openChat={openChat} // Передаем openChat, чтобы кнопка "Написать" работала из профиля
          />
        )}

        {/* Модальное окно создания новой группы */}
        {isGroupModalOpen && (
          <GroupModal 
            onClose={() => setIsGroupModalOpen(false)} 
          />
        )}

        {/* Модальное окно со списком участников группы и добавлением новых */}
        {isGroupInfoOpen && currentChatData && (
          <GroupInfoModal 
            chat={currentChatData} 
            onClose={() => setIsGroupInfoOpen(false)}
            onOpenProfile={(user) => {
               // Позволяем открывать профиль участника прямо из списка группы
               setProfileUser(user);
               setIsProfileModalOpen(true);
            }}
            onRefresh={loadChats} // Функция для обновления данных после добавления участника
          />
        )}
      </div>
    </div>
  );
};