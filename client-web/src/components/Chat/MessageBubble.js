import React from 'react';
import { Avatar } from '../Common/Avatar';
import { API } from '../../services/api';
import { formatTime, isImageFile, getFileNameFromUrl } from '../../utils/helpers';

export const MessageBubble = ({ message, isMe }) => {
  return (
    <div className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      {!isMe && (
        <div className="align-self-end mb-1">
          <Avatar user={message.sender} size={32} />
        </div>
      )}

      <div className={`message-bubble shadow-sm ${isMe ? 'message-sent' : 'message-received'}`}>
        {!isMe && (
          <div className="fw-bold mb-1 sender-name" style={{ color: '#0088cc' }}>
            {message.sender?.username}
          </div>
        )}

        <div className="text-break message-content">{message.text}</div>

        {message.fileUrl && (
          <div className="mt-2 attachment-box">
            {isImageFile(message.fileUrl) ? (
              <img src={`${API}${message.fileUrl}`} className="img-fluid rounded message-img" alt="file" />
            ) : (
              <a href={`${API}${message.fileUrl}`} target="_blank" rel="noreferrer" className="file-link">
                <i className="bi bi-file-earmark-arrow-down me-2"></i>
                {getFileNameFromUrl(message.fileUrl)}
              </a>
            )}
          </div>
        )}

        <div className="message-time text-end">
          {formatTime(message.createdAt)}
        </div>
      </div>

      {isMe && (
        <div className="align-self-end mb-1 ms-2">
          <Avatar user={{ avatarUrl: null, username: 'Я' }} size={32} />
        </div>
      )}
    </div>
  );
};