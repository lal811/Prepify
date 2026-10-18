import React, { useState, useEffect } from 'react';
import '../style/interview.scss';
import { useInterview } from '../hooks/useinterview.js';
import { useNavigate, useParams } from 'react-router';

// ── Technical / Behavioral Question Accordion Item ──
const QuestionCard = ({ item, index, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        setOpen(defaultOpen);
    }, [defaultOpen]);

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__badge'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                {item.relevantTech && (
                    <span className='q-card__tech'>{item.relevantTech}</span>
                )}
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </div>

            {open && (
                <div className='q-card__body'>
                    <div className='q-card__block'>
                        <span className='block-tag block-tag--intention'>
                            Interviewer's Evaluation Intention
                        </span>
                        <p>{item.intention}</p>
                    </div>

                    <div className='q-card__block'>
                        <span className='block-tag block-tag--answer'>
                            Recommended Answer Framework
                        </span>
                        <p>{item.answer}</p>
                    </div>

                    {item.adaptationGuidance && (
                        <div className='q-card__block'>
                            <span className='block-tag block-tag--guidance'>
                                Adaptation to Your Real Experience
                            </span>
                            <p>{item.adaptationGuidance}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Interview Component ──
const Interview = () => {
    const [activeNav, setActiveNav] = useState('overview');
    const [expandAll, setExpandAll] = useState(false);
    const [completedTasks, setCompletedTasks] = useState({});
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    const { report, getReportById, loading, getResumePdf } = useInterview();
    const { interviewId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        }
    }, [interviewId, getReportById]);

    const handleDownloadResume = async () => {
        if (!interviewId) return;
        setDownloadError("");
        setIsDownloadingPdf(true);
        try {
            await getResumePdf(interviewId);
        } catch (err) {
            setDownloadError(err.message || "Failed to generate tailored resume PDF. Please verify your GEMINI_API_KEY.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const toggleTaskCompleted = (taskId) => {
        setCompletedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    if (loading && !report) {
        return (
            <div className='interview-page'>
                <div className='report-container' style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(99, 102, 241, 0.2)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '1rem' }}>
                        Loading interview preparation report...
                    </p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className='interview-page'>
                <div className='report-error-card'>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h2>Interview Report Not Found</h2>
                    <p>The requested interview report could not be found or you do not have permission to view it.</p>
                    <button
                        className='back-btn'
                        onClick={() => navigate('/')}
                        style={{ marginTop: '0.5rem' }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const score = report.matchScore ?? 0;
    const scoreColorClass = score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low';

    // Calculate roadmap stats
    const allRoadmapTasks = (report.preparationPlan || []).flatMap((d, dayIdx) =>
        (d.tasks || []).map((t, taskIdx) => ({ id: `${dayIdx}-${taskIdx}`, text: t }))
    );
    const completedCount = allRoadmapTasks.filter(t => completedTasks[t.id]).length;
    const progressPercent = allRoadmapTasks.length > 0 ? Math.round((completedCount / allRoadmapTasks.length) * 100) : 0;

    return (
        <div className='interview-page'>
            <div className='report-container'>

                {/* Top Action Bar */}
                <div className='report-header-bar'>
                    <button className='back-btn' onClick={() => navigate('/')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Dashboard
                    </button>

                    <div className='report-meta-info'>
                        <h1>{report.title || "Custom Interview Strategy"}</h1>
                        <div className='report-subtitle'>
                            {report.targetRole && <span className='role-tag'>{report.targetRole}</span>}
                            <span>•</span>
                            <span>Created {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadResume}
                        disabled={isDownloadingPdf}
                        className='pdf-download-btn'
                    >
                        {isDownloadingPdf ? (
                            <>
                                <span className='spinner-small' />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Tailored Resume PDF
                            </>
                        )}
                    </button>
                </div>

                {downloadError && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#fca5a5',
                        fontSize: '0.85rem'
                    }}>
                        {downloadError}
                    </div>
                )}

                {/* Main 2-Column Report Layout */}
                <div className='report-layout'>

                    {/* Navigation Sidebar */}
                    <nav className='report-nav'>
                        <span className='report-nav__heading'>Report Sections</span>

                        <button
                            className={`report-nav__item ${activeNav === 'overview' ? 'report-nav__item--active' : ''}`}
                            onClick={() => setActiveNav('overview')}
                        >
                            <div className='nav-label-group'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Overview &amp; Alignment
                            </div>
                            <span className='nav-badge'>{score}%</span>
                        </button>

                        <button
                            className={`report-nav__item ${activeNav === 'technical' ? 'report-nav__item--active' : ''}`}
                            onClick={() => setActiveNav('technical')}
                        >
                            <div className='nav-label-group'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="16 18 22 12 16 6" />
                                    <polyline points="8 6 2 12 8 18" />
                                </svg>
                                Technical Questions
                            </div>
                            <span className='nav-badge'>{report.technicalQuestions?.length || 0}</span>
                        </button>

                        <button
                            className={`report-nav__item ${activeNav === 'behavioral' ? 'report-nav__item--active' : ''}`}
                            onClick={() => setActiveNav('behavioral')}
                        >
                            <div className='nav-label-group'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Behavioral Questions
                            </div>
                            <span className='nav-badge'>{report.behavioralQuestions?.length || 0}</span>
                        </button>

                        <button
                            className={`report-nav__item ${activeNav === 'skills' ? 'report-nav__item--active' : ''}`}
                            onClick={() => setActiveNav('skills')}
                        >
                            <div className='nav-label-group'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                Skill Gap Analysis
                            </div>
                            <span className='nav-badge'>{report.skillGaps?.length || 0}</span>
                        </button>

                        <button
                            className={`report-nav__item ${activeNav === 'roadmap' ? 'report-nav__item--active' : ''}`}
                            onClick={() => setActiveNav('roadmap')}
                        >
                            <div className='nav-label-group'>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                Preparation Plan
                            </div>
                            <span className='nav-badge'>{report.preparationPlan?.length || 0} Days</span>
                        </button>
                    </nav>

                    {/* Main Content Area */}
                    <main className='report-content'>

                        {/* TAB 1: OVERVIEW & MATCH */}
                        {activeNav === 'overview' && (
                            <div className='overview-grid'>
                                <div className='section-header'>
                                    <div className='section-title-group'>
                                        <h2>Role Alignment Assessment</h2>
                                    </div>
                                </div>

                                <div className='match-hero-card'>
                                    <div className={`score-circle ${scoreColorClass}`}>
                                        <span className='score-number'>{score}%</span>
                                        <span className='score-label'>Match Score</span>
                                    </div>

                                    <div className='match-details'>
                                        <h3>Candidate Qualification Analysis</h3>
                                        <p>{report.matchExplanation || "The match score reflects alignment between the candidate's verified skills, experience, and projects compared to the target role requirements."}</p>
                                    </div>
                                </div>

                                <div className='stats-row'>
                                    <div className='stat-card'>
                                        <span className='stat-value'>{report.technicalQuestions?.length || 0}</span>
                                        <span className='stat-name'>Technical Interview Prompts</span>
                                    </div>
                                    <div className='stat-card'>
                                        <span className='stat-value'>{report.behavioralQuestions?.length || 0}</span>
                                        <span className='stat-name'>Behavioral Scenarios</span>
                                    </div>
                                    <div className='stat-card'>
                                        <span className='stat-value'>{report.skillGaps?.length || 0}</span>
                                        <span className='stat-name'>Identified Skill Gaps</span>
                                    </div>
                                    <div className='stat-card'>
                                        <span className='stat-value'>{report.preparationPlan?.length || 0} Days</span>
                                        <span className='stat-name'>Preparation Curriculum</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: TECHNICAL QUESTIONS */}
                        {activeNav === 'technical' && (
                            <section>
                                <div className='section-header'>
                                    <div className='section-title-group'>
                                        <h2>Technical Questions</h2>
                                        <span className='count-chip'>{report.technicalQuestions?.length || 0} Questions</span>
                                    </div>
                                    <button
                                        className='toggle-all-btn'
                                        onClick={() => setExpandAll(!expandAll)}
                                    >
                                        {expandAll ? "Collapse All" : "Expand All"}
                                    </button>
                                </div>

                                <div className='questions-list'>
                                    {report.technicalQuestions?.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                            defaultOpen={expandAll}
                                            type='technical'
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* TAB 3: BEHAVIORAL QUESTIONS */}
                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='section-header'>
                                    <div className='section-title-group'>
                                        <h2>Behavioral Questions</h2>
                                        <span className='count-chip'>{report.behavioralQuestions?.length || 0} Questions</span>
                                    </div>
                                    <button
                                        className='toggle-all-btn'
                                        onClick={() => setExpandAll(!expandAll)}
                                    >
                                        {expandAll ? "Collapse All" : "Expand All"}
                                    </button>
                                </div>

                                <div className='questions-list'>
                                    {report.behavioralQuestions?.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                            defaultOpen={expandAll}
                                            type='behavioral'
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* TAB 4: SKILL GAP ANALYSIS */}
                        {activeNav === 'skills' && (
                            <section>
                                <div className='section-header'>
                                    <div className='section-title-group'>
                                        <h2>Skill Gap Analysis</h2>
                                        <span className='count-chip'>{report.skillGaps?.length || 0} Identified Areas</span>
                                    </div>
                                </div>

                                <div className='skill-gaps-grid'>
                                    {report.skillGaps?.map((gap, i) => {
                                        const sev = gap.severity?.toLowerCase() || 'medium';
                                        return (
                                            <div key={i} className='gap-card'>
                                                <div className='gap-header'>
                                                    <h3>{gap.skill}</h3>
                                                    <span className={`severity-badge severity--${sev}`}>
                                                        {sev} severity
                                                    </span>
                                                </div>

                                                {gap.whyItMatters && (
                                                    <div className='gap-section'>
                                                        <span className='label'>Why It Matters For This Role</span>
                                                        <p>{gap.whyItMatters}</p>
                                                    </div>
                                                )}

                                                {gap.recommendation && (
                                                    <div className='gap-section'>
                                                        <span className='label'>Actionable Recommendation</span>
                                                        <p>{gap.recommendation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* TAB 5: PREPARATION ROADMAP */}
                        {activeNav === 'roadmap' && (
                            <section className='roadmap-container'>
                                <div className='section-header'>
                                    <div className='section-title-group'>
                                        <h2>Personalized Preparation Plan</h2>
                                        <span className='count-chip'>{report.preparationPlan?.length || 0} Days</span>
                                    </div>
                                </div>

                                {/* Progress Checklist Header */}
                                <div className='roadmap-progress-bar'>
                                    <div className='progress-text'>
                                        <span>Candidate Preparation Progress</span>
                                        <span>{completedCount} of {allRoadmapTasks.length} tasks completed ({progressPercent}%)</span>
                                    </div>
                                    <div className='progress-track'>
                                        <div
                                            className='progress-fill'
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className='roadmap-list' style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {report.preparationPlan?.map((planDay, dayIdx) => (
                                        <div key={planDay.day} className='roadmap-day-card'>
                                            <div className='day-header'>
                                                <span className='day-badge'>Day {planDay.day}</span>
                                                <h3>{planDay.focus}</h3>
                                            </div>

                                            <div className='task-list'>
                                                {planDay.tasks?.map((task, taskIdx) => {
                                                    const taskId = `${dayIdx}-${taskIdx}`;
                                                    const isChecked = Boolean(completedTasks[taskId]);
                                                    return (
                                                        <label key={taskIdx} className='task-item'>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleTaskCompleted(taskId)}
                                                            />
                                                            <span className={`task-desc ${isChecked ? 'completed' : ''}`}>
                                                                {task}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default Interview;