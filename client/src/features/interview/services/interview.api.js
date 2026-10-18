import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If the error response is a Blob (e.g. PDF endpoint failure), parse the JSON text
        if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
            try {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                return Promise.reject(new Error(json.message || 'An error occurred with PDF generation.'));
            } catch {
                // fall through to default error
            }
        }
        const message = error.response?.data?.message || error.message || 'Failed to communicate with Prepify server.';
        return Promise.reject(new Error(message));
    }
);

export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    if (selfDescription) {
        formData.append("selfDescription", selfDescription);
    }
    if (resumeFile) {
        formData.append("resume", resumeFile);
    }

    const response = await api.post('/api/interview', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return response.data;
};

export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
};

export const getAllInterviewReports = async () => {
    const response = await api.get('/api/interview');
    return response.data;
};

export const generateResumePdf = async (interviewReportId) => {
    const response = await api.post(`/api/interview/resume-pdf/${interviewReportId}`, null, {
        responseType: 'blob',
    });
    return response.data;
};

export default api;