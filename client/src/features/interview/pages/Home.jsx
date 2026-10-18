import React, { useState, useRef, useEffect } from 'react';
import "../style/Home.scss";
import { useInterview } from '../hooks/useinterview.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useNavigate } from 'react-router';

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const Home = () => {
    const { loading, generateReport, reports, reportsLoading, getReports } = useInterview();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const resumeInputRef = useRef(null);

    useEffect(() => {
        getReports();
    }, [getReports]);

    const handleFileValidationAndSet = (file) => {
        setErrorMessage("");
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setErrorMessage("Only PDF documents (.pdf) are supported for resume analysis.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("The selected file exceeds the 5MB size limit. Please choose a smaller PDF.");
            return;
        }

        setSelectedFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileValidationAndSet(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileValidationAndSet(file);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (resumeInputRef.current) {
            resumeInputRef.current.value = "";
        }
    };

    const handleTriggerFileInput = () => {
        resumeInputRef.current?.click();
    };

    const handleGenerateReport = async () => {
        setErrorMessage("");

        const cleanJobDesc = jobDescription.trim();
        const cleanSelfDesc = selfDescription.trim();

        if (!cleanJobDesc) {
            setErrorMessage("Please paste the target job description to proceed.");
            return;
        }

        if (cleanJobDesc.length < 20) {
            setErrorMessage("Please enter a more detailed job description (at least 20 characters) for accurate AI analysis.");
            return;
        }

        if (!selectedFile && !cleanSelfDesc) {
            setErrorMessage("Please provide either your PDF resume or a self-description to compare against the job requirements.");
            return;
        }

        try {
            const data = await generateReport({
                jobDescription: cleanJobDesc,
                selfDescription: cleanSelfDesc,
                resumeFile: selectedFile
            });

            if (data && data._id) {
                navigate(`/interview/${data._id}`);
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            setErrorMessage(error.message || "Failed to generate interview report. Please check your connection and try again.");
        }
    };

    return (
        <div className='home-page'>

            {/* Hero Banner */}
            <header className='page-hero'>
                <div className='hero-pill'>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    AI Career Strategist
                </div>
                <h1>
                    Prepare for Interviews <br />
                    <span className='highlight'>Tailored to Your Target Role</span>
                </h1>
                <p>
                    {user?.username ? `Welcome, ${user.username}. ` : ''}
                    Compare your real resume against any job description. Generate technical &amp; behavioral question guides, skill-gap analysis, and tailored ATS resumes.
                </p>
            </header>

            {/* Error Notification */}
            {errorMessage && (
                <div className='home-error-banner' role="alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                    <button className='dismiss-btn' onClick={() => setErrorMessage("")} aria-label="Dismiss message">
                        ✕
                    </button>
                </div>
            )}

            {/* Input Form Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel: Target Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className='panel__textarea'
                            placeholder={`Paste the full job posting here...\n\nExample:\n"Senior Full Stack Engineer at TechCorp. Requirements:\n• 4+ years of React, Node.js, and MongoDB experience\n• Experience with system design and REST APIs\n• Strong communication and collaborative skills..."`}
                            maxLength={5000}
                        />

                        <div className='char-counter'>
                            {jobDescription.length} / 5000 characters
                        </div>
                    </div>

                    {/* Right Panel: Candidate Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <h2>Your Candidate Profile</h2>
                        </div>

                        {/* Resume Upload Dropzone */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            {selectedFile ? (
                                <div className='file-preview-card'>
                                    <div className='file-info'>
                                        <span className='file-icon'>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                        </span>
                                        <div className='file-details'>
                                            <span className='file-name'>{selectedFile.name}</span>
                                            <span className='file-size'>{formatFileSize(selectedFile.size)}</span>
                                        </div>
                                    </div>

                                    <div className='file-actions'>
                                        <button type="button" className='btn-change' onClick={handleTriggerFileInput}>
                                            Change
                                        </button>
                                        <button type="button" className='btn-remove' onClick={handleRemoveFile} title="Remove file" aria-label="Remove attached file">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`dropzone ${isDragOver ? 'dropzone--drag-over' : ''}`}
                                    onClick={handleTriggerFileInput}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTriggerFileInput(); }}
                                >
                                    <span className='dropzone__icon'>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </span>
                                    <p className='dropzone__title'>Click to browse or drag &amp; drop PDF</p>
                                    <p className='dropzone__subtitle'>PDF Document only (Max 5MB)</p>
                                </div>
                            )}

                            <input
                                ref={resumeInputRef}
                                onChange={handleFileChange}
                                type='file'
                                id='resume-upload'
                                name='resume'
                                accept='application/pdf,.pdf'
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Divider */}
                        <div className='or-divider'>
                            <span>AND / OR</span>
                        </div>

                        {/* Self Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>
                                Professional Introduction / Highlights
                            </label>
                            <textarea
                                id='selfDescription'
                                name='selfDescription'
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                className='panel__textarea panel__textarea--short'
                                placeholder="Highlight years of experience, primary tech stack, key projects, or anything not covered in your resume..."
                                maxLength={2000}
                            />
                        </div>

                        {/* Tip Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </span>
                            <p>
                                Either an uploaded <strong>PDF Resume</strong> or a detailed <strong>Self Description</strong> is used to build your custom strategy.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Footer Controls */}
                <div className='interview-card__footer'>
                    <div className='footer-info'>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>Gemini AI Strategy Engine &bull; Generates in ~15-30s</span>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className='btn-spinner' />
                                Analyzing Profile...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                Generate Interview Strategy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Dashboard: Recent Reports */}
            <section className='recent-reports'>
                <div className='recent-reports__header'>
                    <h2>Your Saved Interview Plans</h2>
                    {reports && reports.length > 0 && (
                        <span className='report-count'>{reports.length} {reports.length === 1 ? 'Report' : 'Reports'}</span>
                    )}
                </div>

                {reportsLoading ? (
                    <div className='reports-grid'>
                        {[1, 2, 3].map(n => (
                            <div key={n} className='report-card' style={{ opacity: 0.6 }}>
                                <div style={{ height: '20px', background: '#1e293b', borderRadius: '4px', width: '70%' }} />
                                <div style={{ height: '14px', background: '#1e293b', borderRadius: '4px', width: '40%' }} />
                                <div style={{ height: '12px', background: '#1e293b', borderRadius: '4px', width: '90%', marginTop: 'auto' }} />
                            </div>
                        ))}
                    </div>
                ) : reports && reports.length > 0 ? (
                    <div className='reports-grid'>
                        {reports.map(rep => {
                            const score = rep.matchScore ?? 0;
                            const scoreClass = score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low';
                            return (
                                <div
                                    key={rep._id}
                                    className='report-card'
                                    onClick={() => navigate(`/interview/${rep._id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/interview/${rep._id}`); }}
                                >
                                    <div className='report-card-top'>
                                        <h3 className='report-title'>{rep.title || 'Custom Interview Strategy'}</h3>
                                        <span className={`match-badge ${scoreClass}`}>
                                            {score}% Match
                                        </span>
                                    </div>

                                    {rep.targetRole && (
                                        <p className='report-role'>{rep.targetRole}</p>
                                    )}

                                    <div className='report-card-meta'>
                                        <span>{new Date(rep.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span className='action-hint'>
                                            View Report →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className='reports-empty'>
                        <div className='empty-icon'>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h3>No interview reports yet</h3>
                        <p>
                            Paste a target job description and upload your resume above to create your first comprehensive AI interview plan.
                        </p>
                    </div>
                )}
            </section>

            {/* Loading Modal Overlay */}
            {loading && (
                <div className='generation-overlay'>
                    <div className='generation-modal' role="dialog" aria-modal="true">
                        <div className='spinner-large' />
                        <h2>Generating Your Interview Plan</h2>
                        <p>Our AI is thoroughly analyzing your profile against the target job requirements...</p>

                        <div className='step-progress'>
                            <div>✓ Parsing resume &amp; extracting competencies</div>
                            <div>✓ Analyzing target job requirements</div>
                            <div>⏳ Formulating technical &amp; behavioral strategies...</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className='page-footer'>
                <a href="#prepify">Prepify AI &copy; {new Date().getFullYear()}</a>
                <a href="#privacy">Privacy &amp; Data Security</a>
                <a href="#terms">Terms of Preparation</a>
            </footer>

        </div>
    );
};

export default Home;