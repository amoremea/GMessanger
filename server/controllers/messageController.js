const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;

    // Теперь мы просто всегда берем данные из основной базы MongoDB
    const messages = await Message.find({ chatId, deleted: false })
      .populate('sender', 'username avatarUrl')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Ошибка получения сообщений:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { deleted: true });
    
    // Если в будущем захотите удалять сообщение из кэша, 
    // здесь раньше тоже был бы вызов Redis, но сейчас он не нужен.
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не выбран' });
    }
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при загрузке файла' });
  }
};

module.exports = {
  getMessages,
  deleteMessage,
  uploadFile
};