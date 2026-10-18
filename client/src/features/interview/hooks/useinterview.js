import { useContext, useCallback } from "react";
import { InterviewContext } from "../interview.context.js";
import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf
} from "../services/interview.api";

export const useInterview = () => {
    const context = useContext(InterviewContext);

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    const {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
        reportsLoading,
        setReportsLoading,
        error,
        setError
    } = context;

    const generateReportAction = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile });
            if (response.interviewReport) {
                setReport(response.interviewReport);
                // Prepend to reports list if loaded
                setReports(prev => [response.interviewReport, ...(prev || [])]);
                return response.interviewReport;
            }
            throw new Error("Invalid response received from server.");
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getReportByIdAction = useCallback(async (interviewId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getInterviewReportById(interviewId);
            setReport(response.interviewReport);
            return response.interviewReport;
        } catch (err) {
            setError(err.message);
            setReport(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setReport]);

    const getReportsAction = useCallback(async () => {
        setReportsLoading(true);
        setError(null);
        try {
            const response = await getAllInterviewReports();
            setReports(response.interviewReports || []);
            return response.interviewReports;
        } catch (err) {
            console.error("Failed to load interview reports:", err);
            setError(err.message);
            return [];
        } finally {
            setReportsLoading(false);
        }
    }, [setReportsLoading, setError, setReports]);

    const getResumePdfAction = async (interviewReportId) => {
        setLoading(true);
        try {
            const response = await generateResumePdf(interviewReportId);
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Prepify_Resume_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF Download Error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
        reportsLoading,
        error,
        setError,
        generateReport: generateReportAction,
        getReportById: getReportByIdAction,
        getReports: getReportsAction,
        getResumePdf: getResumePdfAction
    };
};