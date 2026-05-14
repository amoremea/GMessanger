const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Получение списка всех чатов пользователя
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'username displayName avatarUrl isOnline bio')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении чатов' });
  }
};

// Создание нового чата или группы
exports.createChat = async (req, res) => {
  try {
    const { participants, isGroup, name } = req.body;

    // Гарантируем, что создатель есть в списке участников
    let allParticipants = participants || [];
    if (!allParticipants.includes(req.userId)) {
      allParticipants.push(req.userId);
    }

    // Если это личный чат (не группа), проверяем, не существует ли он уже
    if (!isGroup && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: allParticipants, $size: 2 }
      }).populate('participants', 'username displayName avatarUrl isOnline bio');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    const newChat = new Chat({
      participants: allParticipants,
      isGroup: !!isGroup,
      name: isGroup ? (name || 'Новая группа') : null,
      createdBy: req.userId
    });

    await newChat.save();
    
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'username displayName avatarUrl isOnline');

    res.status(201).json(populatedChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании чата' });
  }
};

// ДОБАВЛЕНИЕ УЧАСТНИКА В ГРУППУ
exports.addParticipant = async (req, res) => {
  try {
    const { id } = req.params; 
    const { userId } = req.body; 

    if (!userId) {
      return res.status(400).json({ error: 'ID пользователя не указан' });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ error: 'Нельзя добавлять участников в личную переписку' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $addToSet: { participants: userId } },
      { new: true }
    ).populate('participants', 'username displayName avatarUrl isOnline bio');

    // Уведомление через сокеты
    const io = req.app.get('socketio');
    if (io) {
      io.to(id).emit('participantAdded', { chatId: id, newUser: userToAdd });
      io.to(userId.toString()).emit('newChatCreated', updatedChat);
    }

    res.json(updatedChat);
  } catch (err) {
    console.error('Ошибка в addParticipant:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении участника' });
  }
};

// ПОЛУЧЕНИЕ СООБЩЕНИЙ
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;
    if (!chatId) return res.status(400).json({ error: 'Chat ID обязателен' });

    const messages = await Message.find({ chatId })
      .populate('sender', 'username displayName avatarUrl')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
};

exports.sendMessage = async (req, res) => {
  console.log('=== ПОПЫТКА СОХРАНЕНИЯ ===');
  console.log('Данные из тела:', req.body);
  console.log('ID отправителя:', req.userId);

  try {
    const { chatId, text, fileUrl } = req.body;

    // Проверяем, что ID чата вообще пришел
    if (!chatId) {
       console.log('❌ Ошибка: chatId не пришел с фронтенда!');
       return res.status(400).json({ error: 'chatId is required' });
    }

    const newMessage = new Message({
      chatId: chatId,
      sender: req.userId,
      text: text,
      fileUrl: fileUrl
    });

    const saved = await newMessage.save();
    console.log('✅ УСПЕХ! Сообщение в базе:', saved._id);

    // Сокеты
    const io = req.app.get('socketio');
    if (io) {
      io.to(chatId).emit('newMessage', saved);
    }

    res.status(201).json(saved);
  } catch (err) {
    // ВОТ ТУТ МЫ УВИДИМ ПРАВДУ
    console.error('❌ ЖЕСТКАЯ ОШИБКА МОНГИ:', err); 
    res.status(500).json({ error: err.message });
  }
};