import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
} from '../controllers/interview.controller.js';
import upload from '../middlewares/file.middleware.js';

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @desc Generate new interview report based on resume PDF, job description, and optional self-description
 * @access Private
 */
interviewRouter.post('/', authMiddleware, upload.single('resume'), generateInterviewReportController);

/**
 * @route GET /api/interview
 * @desc Get all interview reports belonging to the authenticated user
 * @access Private
 */
interviewRouter.get('/', authMiddleware, getAllInterviewReportsController);

/**
 * @route GET /api/interview/report/:interviewId
 * @desc Get specific interview report by ID
 * @access Private
 */
interviewRouter.get('/report/:interviewId', authMiddleware, getInterviewReportByIdController);

/**
 * @route GET /api/interview/:interviewId (alias for convenience)
 * @desc Get specific interview report by ID
 * @access Private
 */
interviewRouter.get('/:interviewId', authMiddleware, getInterviewReportByIdController);

/**
 * @route POST /api/interview/resume-pdf/:interviewReportId
 * @desc Generate and download tailored ATS resume PDF
 * @access Private
 */
interviewRouter.post('/resume-pdf/:interviewReportId', authMiddleware, generateResumePdfController);

export default interviewRouter;