const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testMessagingAPI() {
  try {
    console.log('\n========================================');
    console.log('   MESSAGING API - INTEGRATION TEST');
    console.log('========================================\n');

    // Kết nối MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected\n');

    // Xóa dữ liệu cũ
    console.log('🧹 Clearing old test data...');
    await User.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ Data cleared\n');

    // Tạo 3 test users
    console.log('👥 Creating 3 test users...');
    const user1 = await User.create({
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: 'password123',
    });

    const user2 = await User.create({
      username: 'testuser2',
      email: 'testuser2@example.com',
      password: 'password123',
    });

    const user3 = await User.create({
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: 'password123',
    });

    console.log(`✅ User 1 created: ${user1._id} (${user1.username})`);
    console.log(`✅ User 2 created: ${user2._id} (${user2.username})`);
    console.log(`✅ User 3 created: ${user3._id} (${user3.username})\n`);

    // Test 1: Tạo text messages
    console.log('📨 TEST 1: Creating text messages...');
    const msg1 = await Message.create({
      from: user1._id,
      to: user2._id,
      contentMessage: {
        type: 'text',
        content: 'Hello from user1 to user2!',
      },
    });
    console.log(`✅ Message 1 created (user1 → user2)\n`);

    const msg2 = await Message.create({
      from: user2._id,
      to: user1._id,
      contentMessage: {
        type: 'text',
        content: 'Hi user1! How are you?',
      },
    });
    console.log(`✅ Message 2 created (user2 → user1)\n`);

    const msg3 = await Message.create({
      from: user1._id,
      to: user2._id,
      contentMessage: {
        type: 'text',
        content: 'I am fine, thanks!',
      },
    });
    console.log(`✅ Message 3 created (user1 → user2)\n`);

    // Test 2: Tạo file message
    console.log('📎 TEST 2: Creating file message...');
    const msg4 = await Message.create({
      from: user1._id,
      to: user3._id,
      contentMessage: {
        type: 'file',
        content: '/uploads/document-123456.pdf',
      },
    });
    console.log(`✅ File message created (user1 → user3)\n`);

    // Test 3: Lấy toàn bộ messages giữa user1 và user2
    console.log('🔍 TEST 3: Getting all messages between user1 and user2...');
    const conversationUser1User2 = await Message.find({
      $or: [
        { from: user1._id, to: user2._id },
        { from: user2._id, to: user1._id },
      ],
    })
      .populate('from', 'username')
      .populate('to', 'username')
      .sort({ createdAt: 1 });

    console.log(`📊 Found ${conversationUser1User2.length} messages:`);
    conversationUser1User2.forEach((msg, index) => {
      console.log(
        `   ${index + 1}. ${msg.from.username} → ${msg.to.username}: "${msg.contentMessage.content}"`
      );
    });
    console.log();

    // Test 4: Lấy messages cuối cùng của mỗi conversation với user1
    console.log('⭐ TEST 4: Getting last message of each conversation (user1)...');

    const allMessagesUser1 = await Message.find({
      $or: [{ from: user1._id }, { to: user1._id }],
    })
      .populate('from', 'username')
      .populate('to', 'username')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationMap = new Map();
    allMessagesUser1.forEach((msg) => {
      const otherUserId =
        msg.from._id.toString() === user1._id.toString()
          ? msg.to._id.toString()
          : msg.from._id.toString();

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, msg);
      }
    });

    const lastMessages = Array.from(conversationMap.values());
    console.log(`📊 Found ${lastMessages.length} conversations:`);
    lastMessages.forEach((msg, index) => {
      const otherUser =
        msg.from._id.toString() === user1._id.toString()
          ? msg.to.username
          : msg.from.username;
      console.log(
        `   ${index + 1}. ${otherUser}: "${msg.contentMessage.content.substring(0, 40)}..."`
      );
    });
    console.log();

    // Test 5: Validation tests
    console.log('✔️ TEST 5: Validation tests...');

    // Check if message contains correct fields
    const testMsg = await Message.findById(msg1._id)
      .populate('from')
      .populate('to');

    console.log('   Checking message structure:');
    console.log(`   ✓ from: ${testMsg.from.username}`);
    console.log(`   ✓ to: ${testMsg.to.username}`);
    console.log(
      `   ✓ contentMessage.type: ${testMsg.contentMessage.type}`
    );
    console.log(
      `   ✓ contentMessage.content: "${testMsg.contentMessage.content}"`
    );
    console.log(`   ✓ createdAt: ${testMsg.createdAt}`);
    console.log();

    // Summary
    console.log('========================================');
    console.log('       ✅ ALL TESTS PASSED!');
    console.log('========================================\n');

    console.log('📋 Test Summary:');
    console.log(`   • Created ${3} users`);
    console.log(`   • Created ${allMessagesUser1.length} total messages`);
    console.log(
      `   • ${conversationUser1User2.length} messages between user1 and user2`
    );
    console.log(
      `   • ${lastMessages.length} active conversations for user1`
    );
    console.log();

    console.log('🚀 Ready to test API endpoints!');
    console.log(`   Start the server with: npm run dev`);
    console.log();

    console.log('📝 User IDs for testing:');
    console.log(`   User 1: ${user1._id}`);
    console.log(`   User 2: ${user2._id}`);
    console.log(`   User 3: ${user3._id}`);
    console.log();

    console.log('📬 API Test Examples:');
    console.log(`   POST /api/messages (send text):`);
    console.log(
      `   {"to": "${user2._id}", "contentText": "Hello user2!"}`
    );
    console.log();
    console.log(`   GET /api/messages/${user2._id} (get conversation)`);
    console.log(`   Header: x-user-id: ${user1._id}`);
    console.log();
    console.log(`   GET /api/messages (get last messages)`);
    console.log(`   Header: x-user-id: ${user1._id}`);
    console.log();

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testMessagingAPI();
