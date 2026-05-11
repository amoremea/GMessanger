import { useState, useEffect, useCallback } from 'react';
import { friendService } from '../services/friendService';
import { useAuth } from './useAuth';
import socketService from '../services/socketService';

export const useFriends = () => {
  const { token, user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  const loadFriends = useCallback(async () => {
    if (!token) return;
    try {
      const res = await friendService.getFriends();
      setFriends(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки друзей:', err);
    }
  }, [token]);

  const loadFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const res = await friendService.getFriendRequests();
      setFriendRequests(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    }
  }, [token]);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  // Socket listener для новых заявок
  useEffect(() => {
    if (!socketService.socket) return;
    
    const handleNewRequest = (sender) => {
      console.log('Новая заявка от:', sender);
      setFriendRequests(prev => {
        if (prev.find(r => r._id === sender._id)) return prev;
        return [sender, ...prev];
      });
    };
    
    socketService.on('newFriendRequest', handleNewRequest);
    
    return () => {
      socketService.off('newFriendRequest', handleNewRequest);
    };
  }, []);

  const sendFriendRequest = useCallback(async (friendId) => {
    try {
      await friendService.sendRequest(friendId);
      alert('Заявка отправлена');
      await loadFriendRequests();
      return { success: true };
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отправки заявки');
      return { success: false };
    }
  }, [loadFriendRequests]);

  const acceptFriendRequest = useCallback(async (friendId) => {
    try {
      const res = await friendService.acceptRequest(friendId);
      alert('Заявка принята');
      setFriends(res.data.friends || []);
      setFriendRequests(res.data.friendRequests || []);
      return { success: true };
    } catch (err) {
      alert('Ошибка принятия заявки');
      return { success: false };
    }
  }, []);

  const declineFriendRequest = useCallback(async (friendId) => {
    try {
      const res = await friendService.declineRequest(friendId);
      alert('Заявка отклонена');
      setFriendRequests(res.data.friendRequests || []);
      return { success: true };
    } catch (err) {
      alert('Ошибка отклонения заявки');
      return { success: false };
    }
  }, []);

  const cancelFriendRequest = useCallback(async (friendId) => {
    try {
      await friendService.cancelRequest(friendId);
      alert('Заявка отменена');
      await loadFriendRequests();
      return { success: true };
    } catch (err) {
      alert('Ошибка отмены заявки');
      return { success: false };
    }
  }, [loadFriendRequests]);

  // ===== ДОБАВЬ ЭТУ ФУНКЦИЮ =====
  const removeFriend = useCallback(async (friendId) => {
    try {
      await friendService.removeFriend(friendId);
      alert('Пользователь удален из друзей');
      await loadFriends();
      return { success: true };
    } catch (err) {
      console.error('Ошибка удаления друга:', err);
      alert('Ошибка удаления друга');
      return { success: false };
    }
  }, [loadFriends]);

  return {
    friends,
    friendRequests,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend, // ДОБАВЬ ЭТУ СТРОКУ
  };
};