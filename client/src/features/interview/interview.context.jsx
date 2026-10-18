import { useState } from "react";
import { InterviewContext } from "./interview.context.js";

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
        <InterviewContext.Provider value={{
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
        }}>
            {children}
        </InterviewContext.Provider>
    );
};