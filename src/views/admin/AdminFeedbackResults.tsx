import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  RefreshCw,
  Download,
  Filter,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  X,
  Search,
  ChevronRight,
  Eye,
  GraduationCap,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface QuestionStat {
  id: string;
  key: string;
  text: string;
  averageRating: number;
  ratingOutOf5: string;
  percentage: number;
  distribution: {
    Excellent: number;
    Good: number;
    Average: number;
    Poor: number;
  };
  distributionPercentages?: {
    Excellent: number;
    Good: number;
    Average: number;
    Poor: number;
  };
}

interface FacultyPerformanceItem {
  faculty: string;
  subjectCount: number;
  subjects: string[];
  responses: number;
  averageRating: string;
  numericRating: number;
  performance: string;
}

interface SubjectDetailQuestion {
  id: string;
  key: string;
  text: string;
  averageRating: number;
  ratingOutOf5: string;
  distribution: {
    Excellent: number;
    Good: number;
    Average: number;
    Poor: number;
  };
  percentages: {
    Excellent: number;
    Good: number;
    Average: number;
    Poor: number;
  };
}

interface SubjectComment {
  id: number;
  text: string;
  semester: string;
  date: string;
}

interface SubjectWiseItem {
  subjectCode: string;
  subjectName: string;
  faculty: string;
  semester: string;
  responses: number;
  averageRating: string;
  numericRating: number;
  performance: string;
  questionAnalysis?: SubjectDetailQuestion[];
  comments?: SubjectComment[];
}

interface SemesterTrendItem {
  semester: string;
  averageRating: number;
  ratingDisplay: string;
  responses: number;
}

interface AnonymousComment {
  id: number;
  subject: string;
  subjectCode: string;
  semester: string;
  faculty: string;
  comment: string;
  date: string;
  category: 'Positive' | 'Suggestions' | 'Concerns';
}

interface FeedbackApiResponse {
  summary: {
    totalResponses: number;
    averageRating: string;
    averageRatingNumeric: number;
    averageRatingDisplay: string;
    facultyEvaluated: number;
    subjectsEvaluated: number;
    overallPerformance: string;
  };
  questionPerformance: QuestionStat[];
  responseDistribution: {
    totalAnswers: number;
    counts: {
      Excellent: number;
      Good: number;
      Average: number;
      Poor: number;
    };
    percentages: {
      Excellent: number;
      Good: number;
      Average: number;
      Poor: number;
    };
  };
  facultyPerformance: FacultyPerformanceItem[];
  subjectWiseFeedback: SubjectWiseItem[];
  semesterTrend: SemesterTrendItem[];
  comments: AnonymousComment[];
  insights: {
    positiveCount: number;
    suggestionsCount: number;
    concernsCount: number;
  };
  filterOptions: {
    semesters: string[];
    faculty: string[];
    subjects: { code: string; name: string; teacher: string; semester: string }[];
    academicYears: string[];
  };
}

export const AdminFeedbackResults: React.FC = () => {
  // Filter States
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2025-26');

  // Applied Filter States (for Apply/Reset button)
  const [appliedFilters, setAppliedFilters] = useState({
    semester: 'All',
    faculty: 'All',
    subject: 'All',
    year: '2025-26',
  });

  // UI state
  const [data, setData] = useState<FeedbackApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commentSearch, setCommentSearch] = useState<string>('');
  const [activeSentimentTab, setActiveSentimentTab] = useState<'All' | 'Positive' | 'Suggestions' | 'Concerns'>('All');
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<SubjectWiseItem | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch Feedback Analytics from backend
  const fetchAnalytics = async (filters = appliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.semester !== 'All') params.append('semester', filters.semester);
      if (filters.faculty !== 'All') params.append('faculty', filters.faculty);
      if (filters.subject !== 'All') params.append('subject', filters.subject);
      if (filters.year !== 'All') params.append('academic_year', filters.year);

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load feedback analytics: ${res.statusText}`);
      }
      const json: FeedbackApiResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Feedback analytics error:', err);
      setError(err.message || 'Unable to load feedback analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(appliedFilters);
  }, [appliedFilters]);

  // Handle Filter Actions
  const handleApplyFilters = () => {
    setAppliedFilters({
      semester: selectedSemester,
      faculty: selectedFaculty,
      subject: selectedSubject,
      year: selectedYear,
    });
  };

  const handleResetFilters = () => {
    setSelectedSemester('All');
    setSelectedFaculty('All');
    setSelectedSubject('All');
    setSelectedYear('2025-26');
    setAppliedFilters({
      semester: 'All',
      faculty: 'All',
      subject: 'All',
      year: '2025-26',
    });
  };

  // Helper for performance badges
  const getBadgeStyle = (perf: string) => {
    switch (perf) {
      case 'Excellent':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981' };
      case 'Very Good':
        return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1' };
      case 'Good':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', dot: '#f59e0b' };
      case 'Needs Improvement':
        return { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa', dot: '#f97316' };
      case 'Critical':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
    }
  };

  // Export report to CSV
  const handleExportReport = () => {
    if (!data) return;
    setIsExporting(true);

    try {
      let csvContent = 'data:text/csv;charset=utf-8,';

      // Section 1: Executive Summary
      csvContent += 'RSMS CONNECT - FACULTY FEEDBACK & COURSE EVALUATION REPORT\r\n';
      csvContent += `Generated On,${new Date().toLocaleString()}\r\n`;
      csvContent += `Filters Applied,Semester: ${appliedFilters.semester} | Faculty: ${appliedFilters.faculty} | Subject: ${appliedFilters.subject} | Academic Year: ${appliedFilters.year}\r\n\r\n`;

      csvContent += 'SUMMARY METRICS\r\n';
      csvContent += `Total Responses,${data.summary.totalResponses}\r\n`;
      csvContent += `Average Rating,${data.summary.averageRating} / 5.00\r\n`;
      csvContent += `Faculty Evaluated,${data.summary.facultyEvaluated}\r\n`;
      csvContent += `Subjects Evaluated,${data.summary.subjectsEvaluated}\r\n`;
      csvContent += `Overall Performance,${data.summary.overallPerformance}\r\n\r\n`;

      // Section 2: Question Performance
      csvContent += 'QUESTION-WISE PERFORMANCE\r\n';
      csvContent += 'Question No,Question Key,Question Description,Average Rating (out of 5),Excellent (%),Good (%),Average (%),Poor (%)\r\n';
      data.questionPerformance.forEach((q, idx) => {
        csvContent += `Q${idx + 1},"${q.key}","${q.text.replace(/"/g, '""')}",${q.averageRating},${q.distributionPercentages?.Excellent || 0}%,${q.distributionPercentages?.Good || 0}%,${q.distributionPercentages?.Average || 0}%,${q.distributionPercentages?.Poor || 0}%\r\n`;
      });
      csvContent += '\r\n';

      // Section 3: Faculty Performance
      csvContent += 'FACULTY PERFORMANCE BREAKDOWN\r\n';
      csvContent += 'Faculty Name,Subjects Count,Subjects,Total Responses,Average Rating,Performance Status\r\n';
      data.facultyPerformance.forEach((f) => {
        csvContent += `"${f.faculty}",${f.subjectCount},"${f.subjects.join('; ')}",${f.responses},"${f.averageRating}","${f.performance}"\r\n`;
      });
      csvContent += '\r\n';

      // Section 4: Subject Wise Feedback
      csvContent += 'SUBJECT-WISE FEEDBACK BREAKDOWN\r\n';
      csvContent += 'Subject Code,Subject Name,Faculty,Semester,Responses,Average Rating,Performance Status\r\n';
      data.subjectWiseFeedback.forEach((s) => {
        csvContent += `"${s.subjectCode}","${s.subjectName}","${s.faculty}","${s.semester}",${s.responses},"${s.averageRating}","${s.performance}"\r\n`;
      });
      csvContent += '\r\n';

      // Section 5: Anonymous Comments
      csvContent += 'ANONYMOUS STUDENT SUGGESTIONS\r\n';
      csvContent += 'ID,Subject Code,Subject Name,Semester,Category,Date,Student Feedback\r\n';
      data.comments.forEach((c) => {
        csvContent += `${c.id},"${c.subjectCode}","${c.subject}","${c.semester}","${c.category}","${c.date}","${c.comment.replace(/"/g, '""')}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `RSMS_Feedback_Analytics_${appliedFilters.semester}_${appliedFilters.year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter anonymous comments by search and sentiment tab
  const filteredComments = useMemo(() => {
    if (!data?.comments) return [];
    return data.comments.filter((c) => {
      const matchSentiment = activeSentimentTab === 'All' || c.category === activeSentimentTab;
      const matchSearch =
        commentSearch.trim() === '' ||
        c.comment.toLowerCase().includes(commentSearch.toLowerCase()) ||
        c.subject.toLowerCase().includes(commentSearch.toLowerCase()) ||
        c.subjectCode.toLowerCase().includes(commentSearch.toLowerCase()) ||
        c.semester.toLowerCase().includes(commentSearch.toLowerCase());
      return matchSentiment && matchSearch;
    });
  }, [data?.comments, activeSentimentTab, commentSearch]);

  return (
    <div className="page-body" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header */}
      <div
        className="glass-card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
          border: '1px solid #ede9fe',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 4px 20px -2px rgba(124, 58, 237, 0.06)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px -4px rgba(124, 58, 237, 0.35)',
                flexShrink: 0
              }}
            >
              <MessageSquare size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  FEEDBACK ANALYTICS
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    border: '1px solid #ddd6fe',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  <Sparkles size={11} /> Real-Time Insights
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                Anonymous student feedback and course evaluation insights.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              id="export-feedback-report-btn"
              onClick={handleExportReport}
              disabled={loading || !data || isExporting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <Download size={16} color="#7c3aed" />
              <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
            </button>

            <button
              id="refresh-feedback-analytics-btn"
              onClick={() => fetchAnalytics(appliedFilters)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#7c3aed',
                border: '1px solid #7c3aed',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#6d28d9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#7c3aed')}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards (4 Compact Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Total Responses */}
        <div
          id="summary-card-total-responses"
          className="card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL RESPONSES
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {loading ? '—' : data?.summary.totalResponses ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={12} /> Student evaluations logged
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div
          id="summary-card-average-rating"
          className="card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Star size={22} fill="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AVERAGE RATING
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {loading ? '—' : data?.summary.averageRatingDisplay ?? '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Status: <span style={{ color: '#059669', fontWeight: 700 }}>{data?.summary.overallPerformance || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Faculty Evaluated */}
        <div
          id="summary-card-faculty-evaluated"
          className="card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FACULTY EVALUATED
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {loading ? '—' : data?.summary.facultyEvaluated ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Faculty members assessed
            </div>
          </div>
        </div>

        {/* Subjects Evaluated */}
        <div
          id="summary-card-subjects-evaluated"
          className="card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SUBJECTS EVALUATED
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '2px' }}>
              {loading ? '—' : data?.summary.subjectsEvaluated ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Curriculum courses surveyed
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Filters Card */}
      <div
        id="feedback-filters-card"
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={18} color="#7c3aed" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Feedback Filters
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
            Filter by semester, instructor, course, or academic period
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            alignItems: 'flex-end'
          }}
        >
          {/* Semester Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Semester
            </label>
            <select
              id="filter-semester-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="All">All Semesters</option>
              {data?.filterOptions?.semesters?.map((sem) => (
                <option key={sem} value={sem}>
                  {sem} (Semester {sem.replace('S', '')})
                </option>
              )) || (
                <>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                  <option value="S5">S5</option>
                  <option value="S6">S6</option>
                  <option value="S7">S7</option>
                  <option value="S8">S8</option>
                </>
              )}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Faculty
            </label>
            <select
              id="filter-faculty-select"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="All">All Faculty</option>
              {data?.filterOptions?.faculty?.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Subject
            </label>
            <select
              id="filter-subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="All">All Subjects</option>
              {data?.filterOptions?.subjects?.map((sub) => (
                <option key={`${sub.code}-${sub.name}`} value={sub.name}>
                  {sub.code} — {sub.name} ({sub.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Academic Year
            </label>
            <select
              id="filter-academic-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="2025-26">2025–26</option>
              <option value="2024-25">2024–25</option>
              <option value="All">All Years</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              id="apply-feedback-filters-btn"
              onClick={handleApplyFilters}
              style={{
                flex: 1,
                padding: '9px 16px',
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)'
              }}
            >
              <Filter size={14} />
              <span>Apply Filters</span>
            </button>

            <button
              id="reset-feedback-filters-btn"
              onClick={handleResetFilters}
              style={{
                padding: '9px 14px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Overall Performance + Response Distribution & Semester Trend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '24px',
          marginBottom: '24px'
        }}
      >
        {/* OVERALL FEEDBACK PERFORMANCE (10 Questions Horizontal Bars) */}
        <div
          id="overall-feedback-performance-card"
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  OVERALL FEEDBACK PERFORMANCE
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Category & question-wise rating across 10 evaluation criteria (5-point scale)
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '4px 10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#475569'
              }}
            >
              Scale: 1.0 – 5.0
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading question performance metrics...</p>
            </div>
          ) : data?.questionPerformance && data.questionPerformance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.questionPerformance.map((q, idx) => {
                const score = q.averageRating;
                const fillPercent = Math.min(100, Math.max(0, (score / 5.0) * 100));
                const isHigh = score >= 4.4;
                const isMedium = score >= 4.0 && score < 4.4;

                return (
                  <div key={q.id} id={`question-perf-bar-${q.id}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                        {idx + 1}. {q.key}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#7c3aed' }}>
                          {q.ratingOutOf5}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isHigh ? '#ecfdf5' : isMedium ? '#eff6ff' : '#fef3c7',
                            color: isHigh ? '#065f46' : isMedium ? '#1e40af' : '#92400e'
                          }}
                        >
                          {Math.round(fillPercent)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '9px',
                        background: '#f1f5f9',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          width: `${fillPercent}%`,
                          height: '100%',
                          background:
                            score >= 4.5
                              ? 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)'
                              : score >= 4.0
                              ? 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)'
                              : 'linear-gradient(90deg, #f59e0b 0%, #7c3aed 100%)',
                          borderRadius: '9999px',
                          transition: 'width 0.6s ease-out'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              <Info size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
              <p style={{ fontSize: '0.88rem', margin: 0 }}>No evaluation criteria data available for this filter.</p>
            </div>
          )}
        </div>

        {/* Right Column: Response Distribution & Semester Trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Response Distribution Card */}
          <div
            id="response-distribution-card"
            className="card"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#ecfdf5', borderRadius: '10px', color: '#10b981' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    RESPONSE DISTRIBUTION
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Student sentiment breakdown across ratings
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '14px',
                background: '#f1f5f9',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  width: `${data?.responseDistribution?.percentages?.Excellent || 65}%`,
                  background: '#10b981',
                  transition: 'width 0.4s ease'
                }}
                title={`Excellent: ${data?.responseDistribution?.percentages?.Excellent || 0}%`}
              />
              <div
                style={{
                  width: `${data?.responseDistribution?.percentages?.Good || 25}%`,
                  background: '#6366f1',
                  transition: 'width 0.4s ease'
                }}
                title={`Good: ${data?.responseDistribution?.percentages?.Good || 0}%`}
              />
              <div
                style={{
                  width: `${data?.responseDistribution?.percentages?.Average || 8}%`,
                  background: '#f59e0b',
                  transition: 'width 0.4s ease'
                }}
                title={`Average: ${data?.responseDistribution?.percentages?.Average || 0}%`}
              />
              <div
                style={{
                  width: `${data?.responseDistribution?.percentages?.Poor || 2}%`,
                  background: '#ef4444',
                  transition: 'width 0.4s ease'
                }}
                title={`Poor: ${data?.responseDistribution?.percentages?.Poor || 0}%`}
              />
            </div>

            {/* 4 Category Pill Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>Excellent</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
                    {data?.responseDistribution?.counts?.Excellent || 0} answers
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>
                  {data?.responseDistribution?.percentages?.Excellent || 0}%
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3730a3' }}>Good</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4338ca', marginTop: '2px' }}>
                    {data?.responseDistribution?.counts?.Good || 0} answers
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3730a3' }}>
                  {data?.responseDistribution?.percentages?.Good || 0}%
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#854d0e' }}>Average</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a16207', marginTop: '2px' }}>
                    {data?.responseDistribution?.counts?.Average || 0} answers
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#854d0e' }}>
                  {data?.responseDistribution?.percentages?.Average || 0}%
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>Poor</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '2px' }}>
                    {data?.responseDistribution?.counts?.Poor || 0} answers
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b' }}>
                  {data?.responseDistribution?.percentages?.Poor || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* SEMESTER FEEDBACK TREND Card */}
          <div
            id="semester-feedback-trend-card"
            className="card"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              flex: 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    SEMESTER FEEDBACK TREND
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Average performance evolution across academic semesters
                  </p>
                </div>
              </div>
            </div>

            {data?.semesterTrend && data.semesterTrend.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {data.semesterTrend.map((st) => {
                  const percent = Math.min(100, Math.max(0, (st.averageRating / 5.0) * 100));
                  return (
                    <div key={st.semester} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '30px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                        {st.semester}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '10px',
                          background: '#f1f5f9',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                      <span style={{ width: '68px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                        {st.ratingDisplay}
                      </span>
                      <span style={{ width: '45px', textAlign: 'right', fontSize: '0.72rem', color: '#94a3b8' }}>
                        ({st.responses})
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No semester trend available for active filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FACULTY PERFORMANCE TABLE */}
      <div
        id="faculty-performance-section"
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                FACULTY PERFORMANCE
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Aggregated evaluation metrics per instructor across all assigned courses
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Total: <strong>{data?.facultyPerformance?.length || 0} Faculty</strong>
            </span>
          </div>
        </div>

        {/* Table container */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Faculty
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Subjects
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Responses
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Average Rating
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Performance
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    Loading faculty performance data...
                  </td>
                </tr>
              ) : data?.facultyPerformance && data.facultyPerformance.length > 0 ? (
                data.facultyPerformance.map((fac) => {
                  const bStyle = getBadgeStyle(fac.performance);
                  return (
                    <tr
                      key={fac.faculty}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Faculty Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#ede9fe',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem'
                            }}
                          >
                            {fac.faculty.replace(/Prof\.|Dr\./g, '').trim().substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{fac.faculty}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Dept. of Computer Science</div>
                          </div>
                        </div>
                      </td>

                      {/* Subjects */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {fac.subjectCount} {fac.subjectCount === 1 ? 'Subject' : 'Subjects'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {fac.subjects.slice(0, 2).join(', ')}
                            {fac.subjects.length > 2 ? ` +${fac.subjects.length - 2} more` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Responses */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                        {fac.responses} Responses
                      </td>

                      {/* Average Rating */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.95rem' }}>
                            {fac.averageRating}
                          </span>
                          {fac.numericRating > 0 && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                        </div>
                      </td>

                      {/* Performance Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: bStyle.bg,
                            color: bStyle.text,
                            border: `1px solid ${bStyle.border}`
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: bStyle.dot }} />
                          {fac.performance}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          id={`view-faculty-${fac.faculty.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={() => {
                            setSelectedFaculty(fac.faculty);
                            setAppliedFilters((prev) => ({ ...prev, faculty: fac.faculty }));
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#f5f3ff',
                            color: '#7c3aed',
                            border: '1px solid #ddd6fe',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No faculty found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBJECT-WISE FEEDBACK TABLE */}
      <div
        id="subject-wise-feedback-section"
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                SUBJECT-WISE FEEDBACK
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Course-level evaluation breakdown with detailed question analytics
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing: <strong>{data?.subjectWiseFeedback?.length || 0} Courses</strong>
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Subject Code
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Subject
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Faculty
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Semester
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Responses
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Average Rating
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Performance
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    Loading subject-wise feedback records...
                  </td>
                </tr>
              ) : data?.subjectWiseFeedback && data.subjectWiseFeedback.length > 0 ? (
                data.subjectWiseFeedback.map((sub) => {
                  const bStyle = getBadgeStyle(sub.performance);
                  return (
                    <tr
                      key={`${sub.subjectCode}-${sub.subjectName}`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Code */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#7c3aed',
                            background: '#f5f3ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #ddd6fe',
                            fontSize: '0.82rem'
                          }}
                        >
                          {sub.subjectCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {sub.subjectName}
                      </td>

                      {/* Faculty */}
                      <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                        {sub.faculty}
                      </td>

                      {/* Semester */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            background: '#f1f5f9',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#475569'
                          }}
                        >
                          {sub.semester}
                        </span>
                      </td>

                      {/* Responses */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                        {sub.responses}
                      </td>

                      {/* Average Rating */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 800, color: sub.responses > 0 ? '#7c3aed' : '#94a3b8', fontSize: '0.95rem' }}>
                          {sub.averageRating}
                        </span>
                      </td>

                      {/* Performance */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: bStyle.bg,
                            color: bStyle.text,
                            border: `1px solid ${bStyle.border}`
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: bStyle.dot }} />
                          {sub.performance}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          id={`view-details-${sub.subjectCode.toLowerCase()}`}
                          onClick={() => setSelectedSubjectDetail(sub)}
                          style={{
                            padding: '6px 14px',
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                          }}
                        >
                          <span>View Details</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <AlertTriangle size={24} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <p style={{ margin: 0 }}>No feedback responses available. Try changing the selected semester, faculty or subject.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ANONYMOUS STUDENT SUGGESTIONS & FEEDBACK INSIGHTS (Side by Side Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '24px'
        }}
      >
        {/* Left: Anonymous Student Suggestions Card */}
        <div
          id="anonymous-student-suggestions-section"
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  ANONYMOUS STUDENT SUGGESTIONS
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Authentic, non-identifiable feedback submitted through the evaluation form
                </p>
              </div>
            </div>

            {/* Strict Anonymity Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={12} /> 100% Anonymous
            </span>
          </div>

          {/* Search bar inside comments */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search student suggestions and comments..."
              value={commentSearch}
              onChange={(e) => setCommentSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredComments.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                <p style={{ fontSize: '0.88rem', margin: 0 }}>No student suggestions match the current criteria.</p>
              </div>
            ) : (
              filteredComments.map((c) => {
                const isPositive = c.category === 'Positive';
                const isSuggestion = c.category === 'Suggestions';
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${isPositive ? '#10b981' : isSuggestion ? '#6366f1' : '#f59e0b'}`,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.82rem' }}>
                          {c.subjectCode ? `${c.subjectCode} — ` : ''}{c.subject}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            background: '#ede9fe',
                            color: '#6d28d9',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          {c.semester}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{c.date}</span>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#334155', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{c.comment}"
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isPositive ? '#ecfdf5' : isSuggestion ? '#eff6ff' : '#fef3c7',
                          color: isPositive ? '#065f46' : isSuggestion ? '#1e40af' : '#92400e'
                        }}
                      >
                        {c.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Feedback Insights Card */}
        <div
          id="feedback-insights-section"
          className="card"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
              <Lightbulb size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                FEEDBACK INSIGHTS
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Sentiment categorization and recurring feedback themes
              </p>
            </div>
          </div>

          {/* 3 Sentiment Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {/* Positive */}
            <div
              onClick={() => setActiveSentimentTab(activeSentimentTab === 'Positive' ? 'All' : 'Positive')}
              style={{
                padding: '14px 16px',
                background: activeSentimentTab === 'Positive' ? '#ecfdf5' : '#f0fdf4',
                border: `1.5px solid ${activeSentimentTab === 'Positive' ? '#10b981' : '#bbf7d0'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: '#dcfce7', borderRadius: '8px', color: '#16a34a' }}>
                  <ThumbsUp size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Positive Feedback</div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d' }}>Appreciation of clarity, guidance, and labs</div>
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                {data?.insights?.positiveCount || 0}
              </div>
            </div>

            {/* Suggestions */}
            <div
              onClick={() => setActiveSentimentTab(activeSentimentTab === 'Suggestions' ? 'All' : 'Suggestions')}
              style={{
                padding: '14px 16px',
                background: activeSentimentTab === 'Suggestions' ? '#eef2ff' : '#f8fafc',
                border: `1.5px solid ${activeSentimentTab === 'Suggestions' ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}>
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#3730a3', fontSize: '0.88rem' }}>Constructive Suggestions</div>
                  <div style={{ fontSize: '0.72rem', color: '#4338ca' }}>Requests for more practice, quizzes, or tutorials</div>
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3730a3' }}>
                {data?.insights?.suggestionsCount || 0}
              </div>
            </div>

            {/* Concerns */}
            <div
              onClick={() => setActiveSentimentTab(activeSentimentTab === 'Concerns' ? 'All' : 'Concerns')}
              style={{
                padding: '14px 16px',
                background: activeSentimentTab === 'Concerns' ? '#fef2f2' : '#fef2f2',
                border: `1.5px solid ${activeSentimentTab === 'Concerns' ? '#ef4444' : '#fecaca'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.88rem' }}>Concerns & Difficulty</div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>Pace of complex modules or numericals</div>
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                {data?.insights?.concernsCount || 0}
              </div>
            </div>
          </div>

          {/* Academic Governance Note */}
          <div
            style={{
              marginTop: 'auto',
              padding: '14px',
              background: '#f5f3ff',
              borderRadius: '10px',
              border: '1px solid #ede9fe',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <Info size={18} color="#7c3aed" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.78rem', color: '#5b21b6', lineHeight: 1.5 }}>
              <strong>Confidentiality Assurance:</strong> Feedback data is strictly aggregated according to KTU & NBA accreditation standards. Individual student identifiers are cryptographically separated from responses.
            </div>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL (Individual Subject Question Analysis & Comments) */}
      {selectedSubjectDetail && (
        <div
          id="view-subject-details-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSubjectDetail(null);
          }}
        >
          <div
            id="view-subject-details-modal"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #ede9fe',
              padding: '28px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#7c3aed',
                      background: '#f5f3ff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.82rem'
                    }}
                  >
                    {selectedSubjectDetail.subjectCode}
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedSubjectDetail.subjectName}
                  </h2>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Faculty: <strong style={{ color: '#1e293b' }}>{selectedSubjectDetail.faculty}</strong> &bull; Semester: <strong>{selectedSubjectDetail.semester}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedSubjectDetail(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AVERAGE RATING</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                  {selectedSubjectDetail.averageRating}
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>TOTAL RESPONSES</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedSubjectDetail.responses}
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>PERFORMANCE STATUS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {selectedSubjectDetail.performance}
                </div>
              </div>
            </div>

            {/* QUESTION-WISE ANALYSIS SECTION */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#7c3aed" />
                Question-Wise Feedback Analysis
              </h3>

              {selectedSubjectDetail.questionAnalysis && selectedSubjectDetail.questionAnalysis.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedSubjectDetail.questionAnalysis.map((qa, index) => (
                    <div
                      key={qa.id}
                      style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                          {qa.text}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#7c3aed', flexShrink: 0, marginLeft: '12px' }}>
                          {qa.ratingOutOf5}
                        </div>
                      </div>

                      {/* 4-option mini bar */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.72rem' }}>
                          <div style={{ color: '#166534', fontWeight: 700 }}>Excellent ({qa.distribution?.Excellent || 0})</div>
                          <div style={{ height: '5px', background: '#dcfce7', borderRadius: '4px', marginTop: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${qa.percentages?.Excellent || 0}%`, height: '100%', background: '#16a34a' }} />
                          </div>
                        </div>

                        <div style={{ fontSize: '0.72rem' }}>
                          <div style={{ color: '#3730a3', fontWeight: 700 }}>Good ({qa.distribution?.Good || 0})</div>
                          <div style={{ height: '5px', background: '#e0e7ff', borderRadius: '4px', marginTop: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${qa.percentages?.Good || 0}%`, height: '100%', background: '#6366f1' }} />
                          </div>
                        </div>

                        <div style={{ fontSize: '0.72rem' }}>
                          <div style={{ color: '#854d0e', fontWeight: 700 }}>Average ({qa.distribution?.Average || 0})</div>
                          <div style={{ height: '5px', background: '#fef9c3', borderRadius: '4px', marginTop: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${qa.percentages?.Average || 0}%`, height: '100%', background: '#eab308' }} />
                          </div>
                        </div>

                        <div style={{ fontSize: '0.72rem' }}>
                          <div style={{ color: '#991b1b', fontWeight: 700 }}>Poor ({qa.distribution?.Poor || 0})</div>
                          <div style={{ height: '5px', background: '#fee2e2', borderRadius: '4px', marginTop: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${qa.percentages?.Poor || 0}%`, height: '100%', background: '#ef4444' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No question analysis available for this course yet.
                </div>
              )}
            </div>

            {/* ANONYMOUS COMMENTS FOR THIS SUBJECT */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#7c3aed" />
                Anonymous Student Feedback for this Course
              </h3>

              {selectedSubjectDetail.comments && selectedSubjectDetail.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedSubjectDetail.comments.map((cm) => (
                    <div
                      key={cm.id}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '3px solid #7c3aed',
                        fontSize: '0.85rem',
                        color: '#334155'
                      }}
                    >
                      <p style={{ margin: 0, fontStyle: 'italic' }}>"{cm.text}"</p>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                        Submitted {cm.date} &bull; {cm.semester}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No qualitative text comments submitted for this subject yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSubjectDetail(null)}
                style={{
                  padding: '9px 20px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
