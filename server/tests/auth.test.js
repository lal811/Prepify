import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import UserModel from '../src/models/user.model.js';
import TokenBlacklistModel from '../src/models/blacklist.model.js';

let mongoServer;

test.before(async () => {
    process.env.JWT_SECRET = 'test_secret_for_prepify_automated_testing_12345';
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

test.after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

test.beforeEach(async () => {
    await UserModel.deleteMany({});
    await TokenBlacklistModel.deleteMany({});
});

test.describe('Auth API Integration Tests', () => {

    test('POST /api/auth/register - rejects missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser' });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /required/i);
    });

    test('POST /api/auth/register - rejects short password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: '123'
            });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /at least 6 characters/i);
    });

    test('POST /api/auth/register - registers user and sets HTTP-only cookie', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'alice',
                email: 'alice@example.com',
                password: 'password123'
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.user.username, 'alice');
        assert.equal(res.body.user.email, 'alice@example.com');
        assert.ok(!res.body.user.password, 'Password must not be returned');

        const cookies = res.headers['set-cookie'];
        assert.ok(cookies, 'set-cookie header must be present');
        assert.ok(cookies.some(c => c.includes('token=') && c.includes('HttpOnly')));
    });

    test('POST /api/auth/register - rejects duplicate email', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'user1',
                email: 'duplicate@example.com',
                password: 'password123'
            });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'user2',
                email: 'duplicate@example.com',
                password: 'password123'
            });

        assert.equal(res.status, 409);
        assert.match(res.body.message, /already exists/i);
    });

    test('POST /api/auth/login - rejects invalid credentials', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'bob',
                email: 'bob@example.com',
                password: 'password123'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'bob@example.com',
                password: 'wrongpassword'
            });

        assert.equal(res.status, 401);
        assert.match(res.body.message, /Invalid email or password/i);
    });

    test('POST /api/auth/login - succeeds with correct credentials and returns session', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'charlie',
                email: 'charlie@example.com',
                password: 'password123'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'charlie@example.com',
                password: 'password123'
            });

        assert.equal(res.status, 200);
        assert.equal(res.body.user.username, 'charlie');
    });

    test('GET /api/auth/get-me - returns authenticated user details', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'dave',
                email: 'dave@example.com',
                password: 'password123'
            });

        const cookie = regRes.headers['set-cookie'];

        const meRes = await request(app)
            .get('/api/auth/get-me')
            .set('Cookie', cookie);

        assert.equal(meRes.status, 200);
        assert.equal(meRes.body.user.username, 'dave');
        assert.equal(meRes.body.user.email, 'dave@example.com');
    });

    test('POST /api/auth/logout - blacklists token and clears cookie', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'eve',
                email: 'eve@example.com',
                password: 'password123'
            });

        const cookie = regRes.headers['set-cookie'];

        const logoutRes = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', cookie);

        assert.equal(logoutRes.status, 200);

        // Attempt to reuse blacklisted token
        const meRes = await request(app)
            .get('/api/auth/get-me')
            .set('Cookie', cookie);

        assert.equal(meRes.status, 401);
        assert.match(meRes.body.message, /Session has ended|log in/i);
    });

});
