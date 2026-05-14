import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './useAuth';
import socketService from '../services/socketService';

export const useChat = () => {
  const { token, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const pendingMessagesRef = useRef(new Set());

  // 1. Улучшенная загрузка чатов с автоматическим входом в комнаты
  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await chatService.getChats();
      setChats(res.data);
      
      // КРИТИЧЕСКИЙ МОМЕНТ: При загрузке списка чатов сразу подписываемся на их обновления
      // чтобы сервер мог присылать нам статусы участников и уведомления
      res.data.forEach(chat => {
        socketService.emit('joinChat', chat._id);
      });
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    }
  }, [token]);

  // Остальные функции (loadMessages, openChat, createChat) оставляем без изменений...
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const res = await chatService.getMessages(chatId);
      setMessages(res.data);
      pendingMessagesRef.current.clear();
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  }, []);

  const openChat = useCallback(async (chatId) => {
    setCurrentChat(chatId);
    await loadMessages(chatId);
  }, [loadMessages]);

  const findExistingPrivateChat = useCallback((targetUserId) => {
    return chats.find(chat => 
      !chat.isGroup && 
      chat.participants && 
      chat.participants.some(p => p._id === targetUserId)
    );
  }, [chats]);

  const createChat = useCallback(async (participants, isGroup = false, name = '') => {
    if (!isGroup && participants.length === 1) {
      participants = [user?.userId, participants[0]];
    }
    
    if (!isGroup && participants.length === 2) {
      const existingChat = findExistingPrivateChat(participants[1]);
      if (existingChat) {
        await openChat(existingChat._id);
        return existingChat;
      }
    }
    
    try {
      const res = await chatService.createChat({ participants, isGroup, name });
      const newChat = res.data;
      setChats(prev => [newChat, ...prev]);
      socketService.emit('joinChat', newChat._id); // Сразу подписываемся на новый чат
      await openChat(newChat._id);
      return newChat;
    } catch (err) {
      console.error('Ошибка создания чата:', err);
      throw err;
    }
  }, [user, findExistingPrivateChat, openChat]);

  const sendMessage = useCallback(async (text, file) => {
    if (!text && !file) return false;
    if (!currentChat) return false;

    let fileUrl = null;

    // 1. Загрузка файла, если он есть
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await chatService.uploadFile(formData);
        fileUrl = res.data.fileUrl;
      } catch (err) {
        console.error('Ошибка загрузки файла:', err);
        return false;
      }
    }

    // 2. Создаем временное сообщение для мгновенного отображения (UI)
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      chatId: currentChat,
      text,
      fileUrl,
      sender: { _id: user?.userId, username: user?.username },
      createdAt: new Date(),
      isPending: true // Флаг, что сообщение еще не в базе
    };
    
    // Добавляем в стейт сразу, чтобы юзер не ждал
    setMessages(prev => [...prev, tempMessage]);

    try {
      // 3. КРИТИЧЕСКИЙ ШАГ: Сохраняем в MongoDB через контроллер
      // Мы вызываем именно API метод, который идет на POST /api/messages
      const res = await chatService.sendMessage(currentChat, text, fileUrl);
      const savedMessage = res.data;

      // 4. Заменяем временное сообщение на реальное из базы
      setMessages(prev => 
        prev.map(m => m._id === tempId ? savedMessage : m)
      );

      // 5. Уведомляем сокет-сервер (чтобы другие увидели сообщение)
      // ВАЖНО: передаем уже сохраненное сообщение с нормальным _id из базы
      socketService.sendMessage(savedMessage);

      return true;
    } catch (err) {
      console.error('Ошибка сохранения сообщения в БД:', err);
      // Если не сохранилось — удаляем временное сообщение, чтобы не путать юзера
      setMessages(prev => prev.filter(m => m._id !== tempId));
      return false;
    }
  }, [currentChat, user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 2. ОБРАБОТКА ВСЕХ СОБЫТИЙ СОКЕТА (включая онлайн-статус)
  useEffect(() => {
    if (!socketService.socket) return;

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        const filtered = prev.filter(m => !(m.isPending && m.text === msg.text));
        return [...filtered, msg];
      });

      // Обновляем последнее сообщение в списке чатов
      setChats(prev => prev.map(chat => 
        chat._id === msg.chatId ? { ...chat, lastMessage: msg, updatedAt: new Date() } : chat
      ));
    };

    const handleNewChat = (newChat) => {
      setChats(prev => prev.some(c => c._id === newChat._id) ? prev : [newChat, ...prev]);
      socketService.emit('joinChat', newChat._id);
    };

    // ВОТ ОНО: Обработка статуса онлайна без перезагрузки
    const handleStatusUpdate = ({ userId, isOnline }) => {
      console.log(`👤 Пользователь ${userId} теперь ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      setChats(prevChats => prevChats.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p._id === userId ? { ...p, isOnline } : p
        )
      })));
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('newChatCreated', handleNewChat);
    socketService.on('userStatusUpdate', handleStatusUpdate);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('newChatCreated', handleNewChat);
      socketService.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [user?.userId]);

  return { chats, messages, currentChat, openChat, sendMessage, createChat, loadChats };
};