import io from 'socket.io-client';
import { SOCKET_URL } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.currentChat = null;
  }

  connect(token) {
    // Если сокет уже подключен, не создаем новое соединение
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Инициализация соединения
    // Используем SOCKET_URL (без /api), который мы настроили в api.js
    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      // transports: ['websocket'] — это "золотой стандарт" для Render.
      // Позволяет избежать ошибок 400 Bad Request.
      transports: ['websocket'],
      upgrade: false,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChat = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🚀 Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connect error:', err.message);
      
      // Если сервер говорит, что токен невалидный — сигнализируем приложению
      if (err.message === 'Unauthorized' || err.message === 'invalid token') {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authError'));
      }
    });

    // Автоматическое переподключение к комнате чата при разрыве связи
    this.socket.on('reconnect', () => {
      if (this.currentChat) {
        console.log(`🔄 Re-joining chat room: ${this.currentChat}`);
        this.emit('joinChat', this.currentChat);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected. Reason:', reason);
    });
  }

  // Подписка на события
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Отписка от событий
  off(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Отправка данных на сервер
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`📡 Socket not connected, cannot emit: ${event}`);
    }
  }

  // Вход в комнату чата
  joinChat(chatId) {
    if (this.currentChat && this.currentChat !== chatId) {
      this.emit('leaveChat', this.currentChat);
    }
    
    this.currentChat = chatId;
    this.emit('joinChat', chatId);
  }

  // Отправка сообщения (теперь используется для уведомления в реальном времени)
  sendMessage(messageData) {
    this.emit('sendMessage', messageData);
  }
}

// Создаем единственный экземпляр сервиса (Singleton)
const socketServiceInstance = new SocketService();
export default socketServiceInstance;