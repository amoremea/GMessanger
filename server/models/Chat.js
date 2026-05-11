const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: { type: String, default: 'Private Chat' },
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);