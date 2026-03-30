const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Message.deleteMany({});

    // Tạo 3 user test
    const user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
    });

    const user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });

    const user3 = await User.create({
      username: 'user3',
      email: 'user3@example.com',
      password: 'password123',
    });

    console.log('✓ Users created:');
    console.log(`  - User 1: ${user1._id} (${user1.username})`);
    console.log(`  - User 2: ${user2._id} (${user2.username})`);
    console.log(`  - User 3: ${user3._id} (${user3.username})`);

    // Tạo messages test
    const messages = await Message.insertMany([
      {
        from: user1._id,
        to: user2._id,
        contentMessage: {
          type: 'text',
          content: 'Hello user2!',
        },
      },
      {
        from: user2._id,
        to: user1._id,
        contentMessage: {
          type: 'text',
          content: 'Hi user1! How are you?',
        },
      },
      {
        from: user1._id,
        to: user2._id,
        contentMessage: {
          type: 'text',
          content: 'I am fine, thanks!',
        },
      },
      {
        from: user1._id,
        to: user3._id,
        contentMessage: {
          type: 'text',
          content: 'Hey user3!',
        },
      },
      {
        from: user3._id,
        to: user1._id,
        contentMessage: {
          type: 'file',
          content: '/uploads/document-123456.pdf',
        },
      },
    ]);

    console.log(`✓ Messages created: ${messages.length} messages`);

    console.log('\n✓ Database seeded successfully!');
    console.log('\nYou can now test with these user IDs:');
    console.log(`User 1 ID: ${user1._id}`);
    console.log(`User 2 ID: ${user2._id}`);
    console.log(`User 3 ID: ${user3._id}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
