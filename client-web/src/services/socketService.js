import io from 'socket.io-client';
import { API } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.currentChat = null;
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Используем API или undefined для автоматического определения хоста
    this.socket = io(API || undefined, {
      auth: { token },
      reconnectionAttempts: 10, // Увеличили кол-во попыток для стабильности на Render
      reconnectionDelay: 2000,   // Чуть больше задержка между попытками
      transports: ['websocket', 'polling'], // Включаем оба транспорта
      timeout: 20000,            // Таймаут соединения
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
    }
  }

  setupListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
      if (err.message === 'Unauthorized' || err.message === 'invalid token') {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authError'));
      }
    });

    // Автоматическое переподключение к текущему чату при разрыве связи
    this.socket.on('reconnect', () => {
      if (this.currentChat) {
        console.log(`🔄 Переподключение к чату: ${this.currentChat}`);
        this.emit('joinChat', this.currentChat);
      }
    });
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

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

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
    }
  }

  joinChat(chatId) {
    if (this.currentChat && this.currentChat !== chatId) {
      this.emit('leaveChat', this.currentChat);
    }
    
    this.currentChat = chatId;
    this.emit('joinChat', chatId);
  }

  sendMessage(data) {
    this.emit('sendMessage', data);
  }
}

// Исправляем eslint warning: сначала создаем экземпляр, потом экспортируем
const socketServiceInstance = new SocketService();
export default socketServiceInstance;