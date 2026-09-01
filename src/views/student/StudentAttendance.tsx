import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Calendar,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Award,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Info,
  Clock,
  Layers
} from 'lucide-react';
import { SubjectAttendance, AttendanceResponse, AttendanceException } from '../../types.js';

interface StudentAttendanceProps {
  studentUid: string;
}

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({ studentUid }) => {
  const [selectedSemester, setSelectedSemester] = useState<string>('S5');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Attendance Target Calculator State
  const [calcPresent, setCalcPresent] = useState<number>(207);
  const [calcTotal, setCalcTotal] = useState<number>(229);
  const [calcTarget, setCalcTarget] = useState<number>(80);
  const [calcSubjectName, setCalcSubjectName] = useState<string>('');

  const fetchAttendance = async (sem: string = selectedSemester) => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/students/${studentUid}/attendance?semester=${sem}&_t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Failed to load attendance (HTTP ${res.status})`);
      }
      const d: AttendanceResponse = await res.json();
      setData(d);
      
      if (d.subjects && d.subjects.length > 0) {
        const found = d.subjects.find((s) => s.subject_id === selectedSubjectId);
        const activeSubj = found || d.subjects[0];
        setSelectedSubjectId(activeSubj.subject_id);
      } else {
        setSelectedSubjectId(null);
      }

      if (d.overall) {
        setCalcPresent(d.overall.effectivePresent);
        setCalcTotal(d.overall.totalClasses || 1);
        setCalcSubjectName('');
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setFetchError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedSemester);
  }, [studentUid, selectedSemester]);

  const handleSemesterChange = (newSem: string) => {
    setSelectedSemester(newSem);
    setSelectedSubjectId(null);
  };

  const handleSelectSubject = (subj: SubjectAttendance) => {
    setSelectedSubjectId(subj.subject_id);
    const effPresent = (subj.present_classes || 0) + (subj.duty_leave_classes || 0);
    setCalcPresent(effPresent);
    setCalcTotal(subj.total_classes);
    setCalcSubjectName(`${subj.code} - ${subj.subject_name}`);
  };

  const handleResetToOverall = () => {
    if (data?.overall) {
      setCalcPresent(data.overall.effectivePresent);
      setCalcTotal(data.overall.totalClasses);
      setCalcSubjectName('');
    }
  };

  // Currently active subject for detail view
  const currentSubject =
    data?.subjects.find((s) => s.subject_id === selectedSubjectId) ||
    (data?.subjects && data.subjects.length > 0 ? data.subjects[0] : null);

  // Group exceptions by month for the active subject (ONLY Absent and Duty Leave)
  const currentExceptions: AttendanceException[] = currentSubject?.exceptions || [];
  const monthGroups: Record<string, AttendanceException[]> = {};
  for (const ex of currentExceptions) {
    if (!monthGroups[ex.monthYear]) {
      monthGroups[ex.monthYear] = [];
    }
    monthGroups[ex.monthYear].push(ex);
  }

  // Dynamic Attendance Calculation Engine
  const calculateRequiredClasses = () => {
    const P = Number(calcPresent);
    const T = Number(calcTotal);
    const targetPct = Number(calcTarget);

    if (isNaN(P) || isNaN(T) || isNaN(targetPct) || T <= 0) {
      return { status: 'invalid', currentPct: '0.0', message: 'Enter valid positive numbers to calculate attendance requirements.' };
    }

    if (P > T) {
      return { status: 'invalid', currentPct: '0.0', message: 'Effective attended classes cannot exceed total classes conducted.' };
    }

    const currentPct = (P / T) * 100;
    const targetDecimal = targetPct / 100;

    if (targetPct >= 100) {
      if (P === T) {
        return {
          status: 'already_met',
          currentPct: currentPct.toFixed(1),
          safeToMiss: 0,
          message: '✓ You have already crossed the required attendance.',
          subMessage: 'Your attendance is currently 100%. You must attend every future class to maintain it.',
        };
      }
      return {
        status: 'impossible',
        currentPct: currentPct.toFixed(1),
        message: 'Mathematically impossible: Since classes have been missed, 100% cannot be attained.',
      };
    }

    if (currentPct >= targetPct) {
      const safeToMiss = Math.floor((P - targetDecimal * T) / targetDecimal);
      const safeCount = Math.max(0, safeToMiss);
      return {
        status: 'already_met',
        currentPct: currentPct.toFixed(1),
        safeToMiss: safeCount,
        message: '✓ You have already crossed the required attendance.',
        subMessage: `You can safely miss up to ${safeCount} future consecutive ${safeCount === 1 ? 'class' : 'classes'} without falling below your target (${targetPct}%).`,
      };
    } else {
      const x = Math.ceil((targetDecimal * T - P) / (1 - targetDecimal));
      return {
        status: 'needed',
        currentPct: currentPct.toFixed(1),
        classesNeeded: x,
        newTotal: T + x,
        newPresent: P + x,
        projectedPct: (((P + x) / (T + x)) * 100).toFixed(1),
        message: `You need to attend the next ${x} consecutive ${x === 1 ? 'class' : 'classes'} to reach ${targetPct}%.`,
        subMessage: `By attending the next ${x} consecutive classes, your attendance will rise to ${P + x} / ${T + x} (${(((P + x) / (T + x)) * 100).toFixed(1)}%).`,
      };
    }
  };

  const calcResult = calculateRequiredClasses();

  return (
    <div className="page-body">
      {/* 1. SEMESTER SELECTION & REFRESH HEADER */}
      <div
        className="glass-card"
        style={{
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Attendance Tracker
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Attendance & Course Analytics
            </h1>
          </div>

          {/* Semester Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
              Semester:
            </span>
            <select
              className="select-field"
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                padding: '6px 14px',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#4f46e5',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '90px',
              }}
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchAttendance(selectedSemester)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {fetchError && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fetchError}</span>
          </div>
          <button className="btn btn-secondary btn-xs" onClick={() => fetchAttendance(selectedSemester)}>
            Retry
          </button>
        </div>
      )}

      {/* 2. OVERALL ATTENDANCE SUMMARY CARD */}
      {data && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-info">{selectedSemester} Overall Attendance</span>
                <span
                  className={`badge ${
                    data.overall.percentage >= 80
                      ? 'badge-safe'
                      : data.overall.percentage >= 75
                      ? 'badge-warning'
                      : data.overall.totalClasses === 0
                      ? 'badge-pending'
                      : 'badge-below'
                  }`}
                >
                  {data.overall.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
                <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {data.overall.percentage}%
                </h2>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Effective Attended: <strong>{data.overall.effectivePresent}</strong> / {data.overall.totalClasses} total lecture hours
                </span>
              </div>
            </div>

            {/* Attendance Target Guidelines Pills */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Internal Target</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>80.0%</div>
              </div>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>End-Sem (Boys)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>75.0%</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>End-Sem (Girls)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>73.0%</div>
              </div>
            </div>
          </div>

          {/* Progress Bar & Breakdown */}
          <div style={{ marginTop: '16px' }}>
            <div className="progress-container" style={{ height: '10px' }}>
              <div
                className={`progress-fill ${
                  data.overall.percentage >= 80
                    ? 'safe'
                    : data.overall.percentage >= 75
                    ? 'warning'
                    : data.overall.totalClasses === 0
                    ? 'neutral'
                    : 'danger'
                }`}
                style={{ width: `${Math.min(data.overall.percentage, 100)}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
              <span>
                Present: <strong>{data.overall.present}</strong> | Duty Leave: <strong>{data.overall.dutyLeave}</strong> | Absent: <strong>{data.overall.absent}</strong>
              </span>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                Effective Attended = Present ({data.overall.present}) + Duty Leave ({data.overall.dutyLeave}) = {data.overall.effectivePresent}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {data && data.subjects.length === 0 && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            marginBottom: '28px',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileSpreadsheet size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            No attendance records available for Semester {selectedSemester}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 18px' }}>
            There are no subject attendance entries recorded for this semester yet.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSemester('S5')}>
            Switch to Active Semester (S5)
          </button>
        </div>
      )}

      {/* 3. COURSE-WISE ATTENDANCE GRID */}
      {data && data.subjects.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Course-wise Attendance
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                Select any course below to view full details and monthly attendance exceptions
              </p>
            </div>
            <span className="badge badge-info">{data.subjects.length} Subjects ({selectedSemester})</span>
          </div>

          {/* Grid of Course Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {data.subjects.map((subj) => {
              const isSelected = selectedSubjectId === subj.subject_id;
              const dutyLeave = subj.duty_leave_classes || 0;
              const effPresent = subj.effective_present ?? (subj.present_classes + dutyLeave);

              return (
                <div
                  key={subj.subject_id}
                  onClick={() => handleSelectSubject(subj)}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border-light)',
                    background: isSelected ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: isSelected ? '0 6px 16px rgba(79, 70, 229, 0.14)' : 'var(--shadow-sm)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#4f46e5' : '#64748b', letterSpacing: '0.5px' }}>
                        {subj.code}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px', lineHeight: 1.3 }}>
                        {subj.subject_name}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                        {subj.teacher}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                        {subj.percentage}%
                      </div>
                      <span
                        className={`badge ${
                          subj.percentage >= 80
                            ? 'badge-safe'
                            : subj.percentage >= 75
                            ? 'badge-warning'
                            : subj.total_classes === 0
                            ? 'badge-pending'
                            : 'badge-below'
                        }`}
                        style={{ fontSize: '0.68rem', marginTop: '2px' }}
                      >
                        {subj.status}
                      </span>
                    </div>
                  </div>

                  {/* Class Counts Line */}
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    {dutyLeave > 0 ? (
                      <span>
                        <strong>{subj.present_classes}</strong> Present + <strong>{dutyLeave}</strong> Duty Leave / {subj.total_classes} Classes
                      </span>
                    ) : (
                      <span>
                        <strong>{subj.present_classes}</strong> Present / {subj.total_classes} Classes
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-container" style={{ height: '8px', marginBottom: '12px' }}>
                    <div
                      className={`progress-fill ${
                        subj.percentage >= 80
                          ? 'safe'
                          : subj.percentage >= 75
                          ? 'warning'
                          : 'danger'
                      }`}
                      style={{ width: `${Math.min(subj.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Card Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <span>
                      Effective: <strong>{effPresent}</strong> / {subj.total_classes}
                    </span>
                    <span
                      style={{
                        color: isSelected ? '#4f46e5' : '#64748b',
                        fontWeight: isSelected ? 800 : 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isSelected ? 'Details Selected' : 'View Exceptions & Details'}
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SELECTED COURSE DETAILS & ATTENDANCE EXCEPTIONS */}
      {currentSubject && (
        <div
          className="card"
          style={{
            border: '2px solid #e0e7ff',
            background: '#ffffff',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '28px',
          }}
        >
          {/* Detailed Course Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1.5px solid #f1f5f9',
              paddingBottom: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#eef2ff', color: '#4f46e5', borderRadius: '12px' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.5px' }}>
                  {currentSubject.code} • {selectedSemester}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
                  {currentSubject.subject_name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Faculty: <strong>{currentSubject.teacher}</strong> • Credits: {currentSubject.credits}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                {currentSubject.percentage}%
              </div>
              <span
                className={`badge ${
                  currentSubject.percentage >= 80
                    ? 'badge-safe'
                    : currentSubject.percentage >= 75
                    ? 'badge-warning'
                    : 'badge-below'
                }`}
              >
                {currentSubject.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Left Column: Attendance Summary */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Attendance Summary
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>Present</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                    {currentSubject.present_classes}
                  </div>
                </div>

                <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔴</span> Absent
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991b1b', marginTop: '2px' }}>
                    {currentSubject.absent_classes ?? 0}
                  </div>
                </div>

                <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🟡</span> Duty Leave
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e', marginTop: '2px' }}>
                    {currentSubject.duty_leave_classes ?? 0}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Total Classes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {currentSubject.total_classes}
                  </div>
                </div>
              </div>

              {/* Effective Attended highlight banner */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Effective Attended (Present + Duty Leave)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                    Formula: ({currentSubject.present_classes} + {currentSubject.duty_leave_classes || 0}) / {currentSubject.total_classes}
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5' }}>
                  {(currentSubject.present_classes || 0) + (currentSubject.duty_leave_classes || 0)} / {currentSubject.total_classes}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: currentSubject.percentage >= 80 ? '#ecfdf5' : currentSubject.percentage >= 75 ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${currentSubject.percentage >= 80 ? '#a7f3d0' : currentSubject.percentage >= 75 ? '#fde68a' : '#fecaca'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Effective Attendance Percentage:
                </span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: currentSubject.percentage >= 80 ? '#065f46' : currentSubject.percentage >= 75 ? '#92400e' : '#991b1b',
                  }}
                >
                  {currentSubject.percentage}%
                </span>
              </div>
            </div>

            {/* Right Column: Attendance Exceptions (ONLY Absent and Duty Leave, Grouped by Month) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    Attendance Exceptions
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Showing only recorded Absences and Duty Leaves
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem' }}>
                  <span className="badge badge-below" style={{ padding: '2px 8px' }}>🔴 Absent</span>
                  <span className="badge badge-warning" style={{ padding: '2px 8px' }}>🟡 Duty Leave</span>
                </div>
              </div>

              {currentExceptions.length === 0 ? (
                <div
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    background: '#f0fdf4',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    No attendance exceptions
                  </h5>
                  <p style={{ fontSize: '0.82rem', color: '#15803d', margin: 0 }}>
                    You have no recorded absences or duty leaves for this course.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {Object.keys(monthGroups).map((monthKey) => (
                    <div key={monthKey}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#64748b',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={13} />
                        <span>{monthKey}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {monthGroups[monthKey].map((exc) => {
                          const isAbsent = exc.status === 'Absent';
                          return (
                            <div
                              key={exc.id}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: isAbsent ? '#fef2f2' : '#fffbeb',
                                border: `1px solid ${isAbsent ? '#fecaca' : '#fde68a'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.1rem' }}>{isAbsent ? '🔴' : '🟡'}</span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isAbsent ? '#991b1b' : '#92400e' }}>
                                    {exc.formattedDate} — {exc.status}
                                  </div>
                                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                                    Date: {exc.date}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`badge ${isAbsent ? 'badge-below' : 'badge-warning'}`}
                                style={{ fontWeight: 700, padding: '3px 8px', fontSize: '0.72rem' }}
                              >
                                {exc.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. ATTENDANCE TARGET CALCULATOR */}
      <div
        className="card"
        style={{
          border: '1.5px solid #c7d2fe',
          background: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '10px' }}>
              <Calculator size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Attendance Target Calculator
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                "How many classes can I miss?" or "How many classes do I need to attend?" — Dynamic Projection Engine
              </p>
            </div>
          </div>

          {calcSubjectName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                Evaluating: <strong>{calcSubjectName}</strong> ({selectedSemester})
              </span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={handleResetToOverall}
                title="Reset calculator to overall semester attendance"
                style={{ fontSize: '0.75rem', color: '#64748b' }}
              >
                Use Overall
              </button>
            </div>
          ) : (
            <span className="badge badge-pending" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Evaluating: <strong>{selectedSemester} Overall Attendance</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Effective Attended (Present + Duty Leave)
            </label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={calcPresent}
              onChange={(e) => setCalcPresent(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Total Classes (Conducted)
            </label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={calcTotal}
              onChange={(e) => setCalcTotal(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Target Percentage (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="input-field"
              value={calcTarget}
              onChange={(e) => setCalcTarget(parseInt(e.target.value) || 80)}
            />
          </div>
        </div>

        {/* Target Preset Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Quick Target Presets:</span>
          <button
            type="button"
            className={`btn btn-sm ${calcTarget === 80 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalcTarget(80)}
          >
            Internal Examination (80%)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${calcTarget === 75 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalcTarget(75)}
          >
            End Semester Boys (75%)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${calcTarget === 73 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalcTarget(73)}
          >
            End Semester Girls (73%)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${calcTarget === 85 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCalcTarget(85)}
          >
            High Safe Zone (85%)
          </button>
        </div>

        {/* Dynamic Calculation Result Banner */}
        <div
          style={{
            padding: '20px',
            borderRadius: '14px',
            background:
              calcResult.status === 'already_met'
                ? '#ecfdf5'
                : calcResult.status === 'needed'
                ? '#eff6ff'
                : '#fef2f2',
            border: `1.5px solid ${
              calcResult.status === 'already_met'
                ? '#a7f3d0'
                : calcResult.status === 'needed'
                ? '#bfdbfe'
                : '#fecaca'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {calcResult.status === 'already_met' && <CheckCircle2 size={24} color="#059669" />}
            {calcResult.status === 'needed' && <HelpCircle size={24} color="#2563eb" />}
            {calcResult.status === 'impossible' && <AlertTriangle size={24} color="#dc2626" />}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Current Attendance: <strong>{calcResult.currentPct}%</strong>
                </span>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Target: <strong>{calcTarget}%</strong>
                </span>
              </div>

              <h4
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  marginTop: '6px',
                  color:
                    calcResult.status === 'already_met'
                      ? '#065f46'
                      : calcResult.status === 'needed'
                      ? '#1e40af'
                      : '#991b1b',
                }}
              >
                {calcResult.message}
              </h4>

              {calcResult.subMessage && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '0.9rem',
                    color: calcResult.status === 'already_met' ? '#047857' : '#1e40af',
                    lineHeight: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {calcResult.subMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
