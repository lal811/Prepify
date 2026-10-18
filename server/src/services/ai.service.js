import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";
import { z } from "zod";

const interviewReportZodSchema = z.object({
    title: z.string(),
    targetRole: z.string().optional().default("Target Position"),
    matchScore: z.number().min(0).max(100),
    matchExplanation: z.string().optional().default("Assessment based on candidate experience and job requirements."),
    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            relevantTech: z.string().optional().default("")
        })
    ),
    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            adaptationGuidance: z.string().optional().default("")
        })
    ),
    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum(["low", "medium", "high"]).or(z.string()).transform(val => {
                const lower = String(val).toLowerCase();
                return ["low", "medium", "high"].includes(lower) ? lower : "medium";
            }),
            whyItMatters: z.string().optional().default(""),
            recommendation: z.string().optional().default("")
        })
    ),
    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string())
        })
    )
});

const resumePdfZodSchema = z.object({
    html: z.string().min(20)
});

function getAIClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables. Please configure it in server/.env to enable AI report and PDF generation.");
    }
    return new GoogleGenAI({ apiKey });
}

const interviewReportSchema = {
    type: "OBJECT",
    properties: {
        title: { 
            type: "STRING", 
            description: "A concise, professional title for the interview report, including the role and company if identifiable." 
        },
        targetRole: {
            type: "STRING",
            description: "The primary job title or role extracted from the job description."
        },
        matchScore: { 
            type: "NUMBER", 
            description: "An overall job alignment score percentage strictly between 0 and 100 based on matching requirements." 
        },
        matchExplanation: {
            type: "STRING",
            description: "A clear explanation of candidate alignment with the target job, highlighting matching qualifications and missing requirements."
        },
        technicalQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The technical interview question." },
                    intention: { type: "STRING", description: "What the interviewer is evaluating." },
                    answer: { type: "STRING", description: "Detailed suggested model answer." },
                    relevantTech: { type: "STRING", description: "Relevant technologies or skills." }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The behavioral interview question." },
                    intention: { type: "STRING", description: "Interviewer's intention and evaluation criteria." },
                    answer: { type: "STRING", description: "Suggested answer framework (e.g. STAR method)." },
                    adaptationGuidance: { type: "STRING", description: "Guidance for tailoring to candidate's real experience." }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    skill: { type: "STRING", description: "Skill name or knowledge domain." },
                    severity: { type: "STRING", description: "Severity: low, medium, or high" },
                    whyItMatters: { type: "STRING", description: "Why the skill matters for the target role." },
                    recommendation: { type: "STRING", description: "A practical recommendation for improvement." }
                },
                required: ["skill", "severity", "whyItMatters", "recommendation"]
            }
        },
        preparationPlan: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "NUMBER", description: "Day number in preparation sequence (e.g. 1, 2, 3)." },
                    focus: { type: "STRING", description: "Focus area for the day." },
                    tasks: { 
                        type: "ARRAY", 
                        items: { type: "STRING" },
                        description: "Actionable tasks and revision activities."
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        }
    },
    required: ["title", "targetRole", "matchScore", "matchExplanation", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
};

function isTransientError(error) {
    if (!error) return false;
    const status = error.status || error.code || error.statusCode;
    if (status === 503 || status === 429 || status === 'UNAVAILABLE' || String(status) === '503') return true;
    const message = String(error.message || '').toUpperCase();
    return message.includes('503') || message.includes('429') || message.includes('UNAVAILABLE') || message.includes('HIGH DEMAND') || message.includes('RESOURCE_EXHAUSTED');
}

async function generateContentWithRetry(ai, params, maxAttempts = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error) {
            lastError = error;
            if (isTransientError(error) && attempt < maxAttempts) {
                const delayMs = Math.pow(2, attempt - 1) * 1500;
                console.warn(`[Gemini] Transient error encountered (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAIClient();

    const prompt = `You are a principal technical recruiter and hiring manager. Generate a comprehensive, realistic, and highly practical interview preparation report.
Strictly adhere to the following input data:

Candidate Resume Text:
"""
${resume || "None provided"}
"""

Candidate Professional Introduction / Self Description:
"""
${selfDescription || "None provided"}
"""

Target Job Description:
"""
${jobDescription}
"""

Guidelines:
1. Job Match Score: Calculate an honest percentage (0-100) reflecting how well the candidate's actual background matches the job description. In the matchExplanation, detail evidence of matching qualifications and key missing requirements. Never guarantee hiring success.
2. Technical Questions: Provide 4-6 deep, relevant technical questions tailored to the intersection of the candidate's experience and the role requirements.
3. Behavioral Questions: Provide 3-4 realistic behavioral questions with STAR framework answers and actionable adaptation guidance.
4. Skill Gaps: Identify real gaps between the resume and the job description, marking severity as "low", "medium", or "high", explaining why each matters and giving actionable learning steps.
5. Preparation Plan: Provide a structured, multi-day preparation plan (e.g. 5-7 days) with specific, actionable tasks.
6. Format: Output MUST be valid JSON conforming strictly to the requested schema.`;

    const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallbackModels = ["gemini-1.5-flash", "gemini-2.0-flash"];
    const modelsToTry = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];

    let lastError = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Gemini] Attempting report generation using model: ${model}...`);
            const response = await generateContentWithRetry(ai, {
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: interviewReportSchema,
                },
            });

            if (!response || !response.text) {
                throw new Error("Empty response received from Gemini AI model.");
            }

            const data = JSON.parse(response.text);
            const validation = interviewReportZodSchema.safeParse(data);

            if (!validation.success) {
                console.error("[Gemini] Zod schema validation error:", validation.error);
                throw new Error(`AI generated invalid response structure: ${validation.error.message}`);
            }

            console.log(`[Gemini] Report successfully generated using model: ${model}`);
            return validation.data;
        } catch (err) {
            console.warn(`[Gemini] Generation failed with model ${model}:`, err.message);
            lastError = err;
            if (!isTransientError(err)) {
                // If it's a non-transient error (e.g., auth or quota), break immediately
                break;
            }
        }
    }

    throw lastError || new Error("Failed to generate interview report from AI service.");
}

async function generatePdfFromHtml(htmlContent) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
        });
        return pdfBuffer;
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const ai = getAIClient();

    const resumePdfSchema = {
        type: "OBJECT",
        properties: {
            html: { 
                type: "STRING", 
                description: "A complete, self-contained HTML document with modern embedded CSS styling for an ATS-friendly, professional resume." 
            }
        },
        required: ["html"]
    };

    const prompt = `You are a professional executive resume writer. Generate a tailored, modern, ATS-friendly resume for the candidate based on their real background and the target job description.

Candidate Resume Details:
"""
${resume || "None provided"}
"""

Candidate Introduction:
"""
${selfDescription || "None provided"}
"""

Target Job:
"""
${jobDescription}
"""

Requirements:
1. Maintain strict honesty: Preserve the candidate's actual experience, education, projects, and skills. Do NOT fabricate fake companies, degrees, or imaginary credentials.
2. Tailor wording and highlight achievements that best align with the target role.
3. The response must be a JSON object with a single property "html".
4. The "html" property must be a complete HTML5 document (including <!DOCTYPE html>, <html>, <head>, <style>, <body>).
5. The CSS styling in <style> must be clean, elegant, and print-ready:
   - Clean sans-serif font family (system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif).
   - Crisp headings, dark slate text (#1f2937), subtle divider lines (#e5e7eb), 1.5 line height.
   - Sections: Header with Candidate Name & Contact Info, Professional Summary, Core Competencies/Skills, Professional Experience, Education, Key Projects/Certifications.
   - Fits standard A4 print margins with no cutoff or overlapping text.`;

    const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await generateContentWithRetry(ai, {
        model: preferredModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumePdfSchema,
        },
    });

    if (!response || !response.text) {
        throw new Error("Empty response received from AI service for resume PDF generation.");
    }

    const jsonContent = JSON.parse(response.text);
    const validation = resumePdfZodSchema.safeParse(jsonContent);

    if (!validation.success) {
        console.error("[Gemini] Resume HTML validation error:", validation.error);
        throw new Error("Invalid HTML structure received for tailored resume.");
    }

    const pdfBuffer = await generatePdfFromHtml(validation.data.html);
    return pdfBuffer;
}

export { generateInterviewReport, generateResumePdf, generatePdfFromHtml };