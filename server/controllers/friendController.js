const User = require('../models/User');

const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username displayName avatarUrl isOnline bio');
    res.json(user.friends || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения списка друзей' });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequests', 'username displayName avatarUrl isOnline');
    res.json(user.friendRequests || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (targetUser.friendRequests.includes(req.userId)) {
      return res.status(400).json({ error: 'Заявка уже отправлена' });
    }
    
    if (targetUser.friends.includes(req.userId)) {
      return res.status(400).json({ error: 'Вы уже друзья' });
    }
    
    targetUser.friendRequests.push(req.userId);
    await targetUser.save();
    
    const sender = await User.findById(req.userId).select('username displayName avatarUrl');
    req.io.to(targetUser._id.toString()).emit('newFriendRequest', sender);
    
    res.json({ message: 'Заявка отправлена', user: sender });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отправки заявки' });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const newFriendId = req.params.id;

    if (!me.friendRequests.includes(newFriendId)) {
      return res.status(400).json({ error: 'Заявка не найдена' });
    }

    me.friends.push(newFriendId);
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== newFriendId);
    await me.save();

    const newFriend = await User.findById(newFriendId);
    if (!newFriend.friends.includes(me._id)) {
      newFriend.friends.push(me._id);
      await newFriend.save();
    }

    const updatedMe = await User.findById(req.userId)
      .populate('friends', 'username displayName avatarUrl isOnline')
      .populate('friendRequests', 'username displayName avatarUrl');
    
    res.json({ 
      message: 'Теперь вы друзья',
      friends: updatedMe.friends,
      friendRequests: updatedMe.friendRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка принятия заявки' });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== req.params.id);
    await me.save();
    
    const updatedMe = await User.findById(req.userId)
      .populate('friendRequests', 'username displayName avatarUrl');
    
    res.json({ 
      message: 'Заявка отклонена',
      friendRequests: updatedMe.friendRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отклонения заявки' });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== req.userId);
    await targetUser.save();
    res.json({ message: 'Заявка отменена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отмены заявки' });
  }
};

// ===== ДОБАВЬ ЭТУ ФУНКЦИЮ =====
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ error: 'ID друга не указан' });
    }
    
    // Удаляем друга из списка текущего пользователя
    const currentUser = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { friends: friendId } },
      { new: true }
    );
    
    // Удаляем текущего пользователя из списка друга
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: req.userId } }
    );
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log(`✅ Пользователь ${req.userId} удалил из друзей ${friendId}`);
    res.json({ success: true, message: 'Друг удален' });
  } catch (err) {
    console.error('❌ Ошибка удаления друга:', err);
    res.status(500).json({ error: 'Ошибка удаления друга' });
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend // ДОБАВЬ ЭТУ СТРОКУ
};