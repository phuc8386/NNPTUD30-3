const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Message = require('../models/Message');
require('dotenv').config();

let user1, user2, user3;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Tạo test users
  user1 = await User.create({
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'password123',
  });

  user2 = await User.create({
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'password123',
  });

  user3 = await User.create({
    username: 'testuser3',
    email: 'testuser3@example.com',
    password: 'password123',
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Message.deleteMany({});
  await mongoose.disconnect();
});

describe('Message API Tests', () => {
  describe('POST /api/messages - Send message', () => {
    it('Should send a text message', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('x-user-id', user1._id.toString())
        .send({
          to: user2._id.toString(),
          contentText: 'Hello user2!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contentMessage.type).toBe('text');
      expect(response.body.data.contentMessage.content).toBe('Hello user2!');
    });

    it('Should reject message without recipient', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('x-user-id', user1._id.toString())
        .send({
          contentText: 'Hello!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing recipient (to)');
    });

    it('Should reject message without content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('x-user-id', user1._id.toString())
        .send({
          to: user2._id.toString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/messages/:userID - Get conversation with specific user', () => {
    beforeEach(async () => {
      // Tạo messages giữa user1 và user2
      await Message.create([
        {
          from: user1._id,
          to: user2._id,
          contentMessage: {
            type: 'text',
            content: 'Message 1 from user1',
          },
        },
        {
          from: user2._id,
          to: user1._id,
          contentMessage: {
            type: 'text',
            content: 'Reply from user2',
          },
        },
      ]);
    });

    it('Should get all messages between two users', async () => {
      const response = await request(app)
        .get(`/api/messages/${user2._id.toString()}`)
        .set('x-user-id', user1._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('Should return empty array if no messages', async () => {
      const response = await request(app)
        .get(`/api/messages/${user3._id.toString()}`)
        .set('x-user-id', user1._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('Should reject without user identification', async () => {
      const response = await request(app).get(`/api/messages/${user2._id.toString()}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/messages - Get last message of each conversation', () => {
    beforeEach(async () => {
      await Message.deleteMany({});
      // Tạo messages với nhiều user
      await Message.create([
        {
          from: user1._id,
          to: user2._id,
          contentMessage: {
            type: 'text',
            content: 'First message to user2',
          },
        },
        {
          from: user1._id,
          to: user2._id,
          contentMessage: {
            type: 'text',
            content: 'Last message to user2',
          },
        },
        {
          from: user1._id,
          to: user3._id,
          contentMessage: {
            type: 'text',
            content: 'Message to user3',
          },
        },
        {
          from: user3._id,
          to: user1._id,
          contentMessage: {
            type: 'text',
            content: 'Reply from user3',
          },
        },
      ]);
    });

    it('Should get last message of each conversation', async () => {
      const response = await request(app)
        .get('/api/messages')
        .set('x-user-id', user1._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('Should reject without user identification', async () => {
      const response = await request(app).get('/api/messages');

      expect(response.status).toBe(401);
    });
  });
});
