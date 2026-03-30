const express = require('express');
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');

const router = express.Router();

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Giữ nguyên tên file gốc (hoặc thêm timestamp để tránh trùng)
    const uniqueSuffix = Date.now();
    const originalName = file.originalname;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const ext = path.extname(originalName);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// Middleware để lấy current user (giả định)
const getCurrentUserId = (req) => {
  // Trong thực tế, bạn sẽ lấy từ JWT token hoặc session
  return req.user?.id || req.headers['x-user-id'];
};

// GET /api/messages/:userID
// Lấy toàn bộ message từ user hiện tại gửi đến userID và từ userID gửi đến user hiện tại
router.get('/:userID', async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.userID;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized: User not identified' });
    }

    // Lấy tất cả message giữa 2 user
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: targetUserId },
        { from: targetUserId, to: currentUserId },
      ],
    })
      .populate('from', 'username email')
      .populate('to', 'username email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: error.message,
    });
  }
});

// POST /api/messages
// Gửi message (text hoặc file - từ form-data hoặc raw JSON base64)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { to, contentText, fileBase64, fileName } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized: User not identified' });
    }

    if (!to) {
      return res.status(400).json({ error: 'Missing recipient (to)' });
    }

    let messageData = {
      from: currentUserId,
      to: to,
      contentMessage: {},
    };

    // Cách 1: File từ form-data (multer)
    if (req.file) {
      const fs = require('fs');
      const filePath = req.file.path;
      
      // Đọc nội dung file và convert thành base64
      const fileContent = fs.readFileSync(filePath);
      const fileBase64 = fileContent.toString('base64');
      
      messageData.contentMessage = {
        type: 'file',
        fileContent: fileBase64, // Nội dung file dưới dạng base64
        content: req.body.content || '', // Mô tả/ghi chú về file từ field content
        filename: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`, // URL dẫn đến file
        fileSize: req.file.size, // Kích thước file
      };
    } 
    // Cách 2: File từ raw JSON base64
    else if (fileBase64 && fileName) {
      const fs = require('fs');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(fileName);
      const savedFileName = `file-${uniqueSuffix}${fileExtension}`;
      const filePath = path.join(__dirname, '../uploads', savedFileName);

      // Decode base64 và lưu file
      const buffer = Buffer.from(fileBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      messageData.contentMessage = {
        type: 'file',
        content: `/uploads/${savedFileName}`,
        filename: fileName,
      };
    }
    // Cách 3: Text message
    else if (contentText) {
      messageData.contentMessage = {
        type: 'text',
        content: contentText,
      };
    } else {
      return res.status(400).json({ error: 'Message content is required (contentText, fileBase64, hoặc upload file)' });
    }

    const message = new Message(messageData);
    await message.save();

    // Populate thông tin user
    await message.populate('from', 'username email');
    await message.populate('to', 'username email');

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (error) {
    // Xóa file nếu lỗi
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message,
    });
  }
});

// GET /api/messages
// Lấy message cuối cùng của mỗi user mà user hiện tại nhắn tin hoặc user khác nhắn cho user hiện tại
router.get('/', async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized: User not identified' });
    }

    // Lấy tất cả user mà current user có tương tác
    const messages = await Message.find({
      $or: [{ from: currentUserId }, { to: currentUserId }],
    })
      .populate('from', 'username email')
      .populate('to', 'username email')
      .sort({ createdAt: -1 });

    // Nhóm message theo các user mà current user tương tác
    const conversationMap = new Map();

    messages.forEach((msg) => {
      const otherUserId =
        msg.from._id.toString() === currentUserId
          ? msg.to._id.toString()
          : msg.from._id.toString();

      // Nếu chưa có conversation với user này, thêm message cuối cùng
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, msg);
      }
    });

    // Chuyển đổi map thành array
    const lastMessages = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: lastMessages,
      count: lastMessages.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch conversations',
      message: error.message,
    });
  }
});

module.exports = router;
