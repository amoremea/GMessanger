const express = require('express');
const auth = require('../middleware/auth');
const {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend 
} = require('../controllers/friendController');

const router = express.Router();

router.get('/friends', auth, getFriends);
router.get('/friend-requests', auth, getFriendRequests);
router.post('/friends/request/:id', auth, sendFriendRequest);
router.post('/friends/accept/:id', auth, acceptFriendRequest);
router.post('/friends/decline/:id', auth, declineFriendRequest);
router.post('/friends/cancel/:id', auth, cancelFriendRequest);
router.post('/remove-friend', auth, removeFriend); // ДОБАВЬ ЭТУ СТРОКУ

module.exports = router;