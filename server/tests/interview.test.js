import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import UserModel from '../src/models/user.model.js';
import InterviewReportModel from '../src/models/interviewReport.model.js';

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
    await InterviewReportModel.deleteMany({});
});

test.describe('Interview API Integration Tests', () => {

    test('GET /api/interview - rejects unauthenticated request with 401', async () => {
        const res = await request(app).get('/api/interview');
        assert.equal(res.status, 401);
    });

    test('POST /api/interview - rejects request missing job description with 400', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'tester1',
                email: 'tester1@example.com',
                password: 'password123'
            });
        const cookie = regRes.headers['set-cookie'];

        const res = await request(app)
            .post('/api/interview')
            .set('Cookie', cookie)
            .send({
                selfDescription: 'Frontend engineer with 3 years React experience'
            });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /job description is required/i);
    });

    test('GET /api/interview/report/:id - handles invalid ObjectId with 400 without crashing', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'tester2',
                email: 'tester2@example.com',
                password: 'password123'
            });
        const cookie = regRes.headers['set-cookie'];

        const res = await request(app)
            .get('/api/interview/report/invalid-not-an-id')
            .set('Cookie', cookie);

        assert.equal(res.status, 400);
        assert.match(res.body.message, /Invalid interview report ID/i);
    });

    test('GET /api/interview/report/:id - returns 404 for non-existent report', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'tester3',
                email: 'tester3@example.com',
                password: 'password123'
            });
        const cookie = regRes.headers['set-cookie'];

        const dummyId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/interview/report/${dummyId}`)
            .set('Cookie', cookie);

        assert.equal(res.status, 404);
        assert.match(res.body.message, /not found/i);
    });

    test('User Isolation: User B cannot access User A\'s interview report', async () => {
        // Register User A
        const userARes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'userA', email: 'userA@example.com', password: 'password123' });
        const userACookie = userARes.headers['set-cookie'];
        const userAId = userARes.body.user.id;

        // Register User B
        const userBRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'userB', email: 'userB@example.com', password: 'password123' });
        const userBCookie = userBRes.headers['set-cookie'];

        // Directly create a report owned by User A
        const reportA = await InterviewReportModel.create({
            user: userAId,
            title: 'Senior React Developer Plan',
            targetRole: 'Senior React Developer',
            jobDescription: 'Seeking Senior React Developer with 5+ years experience.',
            resume: 'John Doe - 5 years React experience',
            matchScore: 92,
            matchExplanation: 'Strong alignment with React ecosystem.',
            technicalQuestions: [{
                question: 'What is concurrent mode in React 18?',
                intention: 'Evaluate deep understanding of React internals',
                answer: 'Concurrent React enables rendering to be interruptible.'
            }],
            behavioralQuestions: [{
                question: 'Describe a challenge you faced and how you overcame it.',
                intention: 'Assess problem-solving under pressure',
                answer: 'Structured using STAR framework.'
            }],
            skillGaps: [{
                skill: 'GraphQL',
                severity: 'medium',
                whyItMatters: 'API querying requirement',
                recommendation: 'Complete Apollo client tutorials'
            }],
            preparationPlan: [{
                day: 1,
                focus: 'React internals',
                tasks: ['Review fiber architecture']
            }]
        });

        // User A accesses their report: must succeed (200)
        const fetchByA = await request(app)
            .get(`/api/interview/report/${reportA._id}`)
            .set('Cookie', userACookie);
        assert.equal(fetchByA.status, 200);
        assert.equal(fetchByA.body.interviewReport.title, 'Senior React Developer Plan');

        // User B accesses User A's report: must be denied (404/unauthorized)
        const fetchByB = await request(app)
            .get(`/api/interview/report/${reportA._id}`)
            .set('Cookie', userBCookie);
        assert.equal(fetchByB.status, 404);
        assert.match(fetchByB.body.message, /not found or unauthorized/i);

        // User B listing reports: should NOT include User A's report
        const listByB = await request(app)
            .get('/api/interview')
            .set('Cookie', userBCookie);
        assert.equal(listByB.status, 200);
        assert.equal(listByB.body.interviewReports.length, 0);

        // User A listing reports: should include their report
        const listByA = await request(app)
            .get('/api/interview')
            .set('Cookie', userACookie);
        assert.equal(listByA.status, 200);
        assert.equal(listByA.body.interviewReports.length, 1);
        assert.equal(listByA.body.interviewReports[0].title, 'Senior React Developer Plan');
    });

});
