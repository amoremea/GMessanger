// components/Chat/ChatMain.js - Полностью адаптивная версия
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../Common/Avatar';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const ChatMain = ({ 
  currentChat, 
  messages, 
  chats, 
  onSendMessage, 
  onOpenProfile, 
  onOpenGroupInfo,
  isMobile,
  onBack
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChat, isMobile]);

  const currentChatData = chats?.find(c => c._id === currentChat);
  const isGroup = currentChatData?.isGroup;
  const otherUser = isGroup 
    ? null 
    : currentChatData?.participants?.find(p => p._id !== user?.userId);

  const chatName = isGroup 
    ? currentChatData?.name 
    : (otherUser?.displayName || otherUser?.username || 'Чат');

  const handleHeaderClick = () => {
    if (isGroup) {
      onOpenGroupInfo();
    } else if (otherUser) {
      onOpenProfile(otherUser);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    await onSendMessage(text, file);
    setText('');
    setFile(null);
    setFileName('');
    e.target.reset();
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Если чат не выбран
  if (!currentChat) {
    return (
      <div className="chat-placeholder">
        <div className="chat-placeholder-content">
          <i className="bi bi-chat-dots"></i>
          <p>Выберите чат, чтобы начать общение</p>
        </div>
      </div>
    );
  }

    return (
    <div className="chat-main-container">
      {/* Хедер чата */}
      <div className="chat-header">
        {isMobile && (
          <>
            <button className="chat-header-back" onClick={onBack}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <button className="chat-header-menu" onClick={onMenuOpen}>
              <i className="bi bi-list"></i>
            </button>
          </>
        )}
        <div className="chat-header-info" onClick={handleHeaderClick}>
          <Avatar 
            user={isGroup ? null : otherUser} 
            size={isMobile ? 40 : 44} 
            isGroup={isGroup} 
            showBadge={!isGroup} 
          />
          <div className="chat-header-text">
            <h6>{chatName}</h6>
            <small>
              {isGroup 
                ? `${currentChatData?.participants?.length || 0} участников` 
                : (otherUser?.isOnline ? 'в сети' : 'был(а) недавно')}
            </small>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="messages-area">
        {/* ... сообщения ... */}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода */}
      <form className="message-input-form" onSubmit={handleSend}>
        {file && (
          <div className="file-preview">
            <i className="bi bi-paperclip"></i>
            <span>{fileName}</span>
            <button type="button" onClick={() => { setFile(null); setFileName(''); }}>
              <i className="bi bi-x"></i>
            </button>
          </div>
        )}
        
        <div className="message-input-wrapper">
          <label className="attach-button">
            <i className="bi bi-paperclip"></i>
            <input type="file" onChange={handleFileChange} />
          </label>
          
          <input
            ref={inputRef}
            className="message-input"
            placeholder="Напишите сообщение..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          
          <button 
            className="send-button" 
            type="submit" 
            disabled={!text.trim() && !file}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
    </div>
  );
};