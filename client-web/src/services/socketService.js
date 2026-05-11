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

    this.socket = io(API, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
    // Выходим из предыдущего чата, только если он существует и отличается
    if (this.currentChat && this.currentChat !== chatId) {
      console.log(`🚪 Выходим из комнаты ${this.currentChat}`);
      this.emit('leaveChat', this.currentChat);
    }
    
    // Присоединяемся к новому чату, только если это не тот же чат
    if (this.currentChat !== chatId) {
      this.currentChat = chatId;
      console.log(`🚪 Присоединяемся к комнате ${chatId}`);
      this.emit('joinChat', chatId);
    }
  }

  sendMessage(data) {
    this.emit('sendMessage', data);
  }
}

export default new SocketService();