const express = require("express");
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/', chatController.overview);
router.get('/:username', chatController.user_chats);

module.exports = router;
