import mongoose from "mongoose";

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Technical question is required"],
    },
    intention: {
        type: String,
        required: [true, "Intention is required"],
    },
    answer: {
        type: String,
        required: [true, "Answer is required"],
    },
    relevantTech: {
        type: String,
        default: ""
    }
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Behavioral question is required"],
    },
    intention: {
        type: String,
        required: [true, "Intention is required"],
    },
    answer: {
        type: String,
        required: [true, "Answer is required"],
    },
    adaptationGuidance: {
        type: String,
        default: ""
    }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"],
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        required: [true, "Severity is required"],
        default: "medium"
    },
    whyItMatters: {
        type: String,
        default: ""
    },
    recommendation: {
        type: String,
        default: ""
    }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, "Day is required"]
    },
    focus: {
        type: String,
        required: [true, "Focus is required"],
    },
    tasks: {
        type: [String],
        required: [true, "Tasks are required"],
        default: []
    }
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User association is required"],
        index: true
    },
    title: {
        type: String,
        required: [true, "Job or report title is required"],
        trim: true
    },
    targetRole: {
        type: String,
        default: "",
        trim: true
    },
    jobDescription: {
        type: String,
        required: [true, "Job Description is required"],
    },
    resume: {
        type: String,
        default: ""
    },
    selfDescription: {
        type: String,
        default: ""
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70
    },
    matchExplanation: {
        type: String,
        default: ""
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
}, {
    timestamps: true
});

const InterviewReportModel = mongoose.models.InterviewReport || mongoose.model("InterviewReport", interviewReportSchema);

export default InterviewReportModel;
