import mongoose from "mongoose";
import pdfParse from "pdf-extraction";
import { generateInterviewReport, generateResumePdf } from "../services/ai.service.js";
import InterviewReportModel from "../models/interviewReport.model.js";

// Helper to check for PDF magic bytes (%PDF-)
function isValidPdfBuffer(buffer) {
    if (!buffer || buffer.length < 5) return false;
    const header = buffer.subarray(0, 5).toString('ascii');
    return header.startsWith('%PDF');
}

async function generateInterviewReportController(req, res, next) {
    try {
        let resumeText = "";

        if (req.file) {
            // Validate magic bytes to ensure file is genuinely a PDF
            if (!isValidPdfBuffer(req.file.buffer)) {
                return res.status(400).json({ 
                    message: "The uploaded file does not have a valid PDF header. Please upload a genuine PDF document." 
                });
            }

            try {
                const parsed = await pdfParse(req.file.buffer);
                resumeText = (parsed.text || "").trim();
            } catch (pdfErr) {
                console.error("PDF Parsing error:", pdfErr);
                return res.status(400).json({ 
                    message: "Failed to parse the PDF resume. Ensure the file is not password-protected or corrupted." 
                });
            }

            if (!resumeText || resumeText.length < 20) {
                return res.status(400).json({ 
                    message: "The uploaded PDF appears empty or contains non-extractable scanned images. Please provide a text-based PDF resume." 
                });
            }
        }

        let { selfDescription, jobDescription } = req.body;
        jobDescription = typeof jobDescription === 'string' ? jobDescription.trim() : '';
        selfDescription = typeof selfDescription === 'string' ? selfDescription.trim() : '';

        // Validate required inputs
        if (!jobDescription) {
            return res.status(400).json({ 
                message: "Target job description is required." 
            });
        }

        if (jobDescription.length < 20) {
            return res.status(400).json({ 
                message: "Job description is too short. Please provide at least 20 characters for meaningful AI analysis." 
            });
        }

        if (jobDescription.length > 10000) {
            return res.status(400).json({ 
                message: "Job description exceeds maximum allowed length (10,000 characters)." 
            });
        }

        // Require either resume or selfDescription
        if (!resumeText && !selfDescription) {
            return res.status(400).json({ 
                message: "Either a valid PDF resume or a personal introduction/self-description must be provided." 
            });
        }

        // Generate the report content via Gemini AI
        const aiReport = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // Save report to database associated with authenticated user
        const interviewReport = await InterviewReportModel.create({
            user: req.user.id,
            title: aiReport.title || "Custom Interview Strategy",
            targetRole: aiReport.targetRole || "Target Position",
            resume: resumeText,
            selfDescription,
            jobDescription,
            matchScore: aiReport.matchScore,
            matchExplanation: aiReport.matchExplanation,
            technicalQuestions: aiReport.technicalQuestions,
            behavioralQuestions: aiReport.behavioralQuestions,
            skillGaps: aiReport.skillGaps,
            preparationPlan: aiReport.preparationPlan
        });

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("[Interview Controller Error]", error);
        if (error.message && error.message.includes("GEMINI_API_KEY")) {
            return res.status(503).json({
                message: "AI service is not configured. Please add GEMINI_API_KEY to server/.env.",
                error: error.message
            });
        }
        return res.status(500).json({
            message: "An error occurred while generating the interview report.",
            error: process.env.NODE_ENV === 'development' ? error.message : "AI generation service encountered an issue. Please try again."
        });
    }
}

async function getInterviewReportByIdController(req, res, next) {
    try {
        const { interviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({ message: "Invalid interview report ID." });
        }

        const interviewReport = await InterviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found or unauthorized." });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        });
    } catch (error) {
        next(error);
    }
}

async function getAllInterviewReportsController(req, res, next) {
    try {
        const interviewReports = await InterviewReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("_id title targetRole matchScore matchExplanation createdAt updatedAt");

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        });
    } catch (error) {
        next(error);
    }
}

async function generateResumePdfController(req, res, next) {
    try {
        const { interviewReportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
            return res.status(400).json({ message: "Invalid interview report ID." });
        }

        const interviewReport = await InterviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found or unauthorized." });
        }

        const { selfDescription, resume, jobDescription } = interviewReport;

        if (!resume && !selfDescription) {
            return res.status(400).json({ 
                message: "This report does not contain sufficient profile information to generate a resume PDF." 
            });
        }

        const pdfBuffer = await generateResumePdf({ selfDescription, resume, jobDescription });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Prepify_Resume_${interviewReportId}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        return res.send(pdfBuffer);
    } catch (error) {
        console.error("[Resume PDF Controller Error]", error);
        if (error.message && error.message.includes("GEMINI_API_KEY")) {
            return res.status(503).json({
                message: "AI service is not configured. Please add GEMINI_API_KEY to server/.env."
            });
        }
        return res.status(500).json({
            message: "An error occurred while generating the resume PDF.",
            error: process.env.NODE_ENV === 'development' ? error.message : "PDF generation failed. Please try again."
        });
    }
}

export {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
};

export default {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
};