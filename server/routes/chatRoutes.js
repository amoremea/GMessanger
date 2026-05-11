const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const {
  createChat,
  getChats,
  getMessages,
  sendMessage,
  addParticipant
} = require('../controllers/chatController');

const { uploadFile } = require('../controllers/messageController');

const router = express.Router();

// Чаты
router.get('/chats', auth, getChats);
router.post('/chat', auth, createChat);
router.post('/:id/participants', auth, addParticipant); 

// Сообщения
router.get('/messages', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.post('/upload', auth, upload.single('file'), uploadFile);

module.exports = router;