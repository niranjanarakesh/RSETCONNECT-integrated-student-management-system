import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Calculator,
  Award,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';
import { MarksResponse, SemesterMarksGroup, SubjectMarks } from '../../types.js';

interface StudentMarksProps {
  studentUid: string;
}

export const StudentMarks: React.FC<StudentMarksProps> = ({ studentUid }) => {
  const [data, setData] = useState<MarksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('All');
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

  // Expected CGPA Calculator State
  const [calcCgpa, setCalcCgpa] = useState<number>(9.40);
  const [calcCompletedCredits, setCalcCompletedCredits] = useState<number>(84);
  const [calcExpectedSgpa, setCalcExpectedSgpa] = useState<number>(9.50);
  const [calcSemesterCredits, setCalcSemesterCredits] = useState<number>(21);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentUid}/marks`);
      if (res.ok) {
        const d: MarksResponse = await res.json();
        setData(d);
        setCalcCgpa(d.cgpa || 9.40);
        setCalcCompletedCredits(d.completed_credits || 84);

        // Find current semester credits for calculator
        const currentSemGroup = d.semesters?.find((s) => s.status === 'Current');
        if (currentSemGroup) {
          setCalcSemesterCredits(currentSemGroup.totalCredits || 21);
        }

        // Initialize accordion: ONLY current semester is expanded by default
        const initialExpanded: Record<string, boolean> = {};
        const curSem = d.current_semester || 'S5';
        d.semesters?.forEach((sem) => {
          initialExpanded[sem.semester] = sem.semester === curSem;
        });
        setExpandedSemesters(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load marks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [studentUid]);

  // Toggle individual semester accordion
  const toggleSemester = (semKey: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semKey]: !prev[semKey],
    }));
  };

  // Expand / collapse when filter is clicked
  const handleFilterSelect = (semFilter: string) => {
    setSelectedSemesterFilter(semFilter);
    if (semFilter !== 'All') {
      setExpandedSemesters((prev) => ({
        ...prev,
        [semFilter]: true,
      }));
    }
  };

  // Dynamic Expected CGPA Calculation
  const calculateExpectedCgpa = () => {
    const prevC = Number(calcCgpa);
    const prevCredits = Number(calcCompletedCredits);
    const semS = Number(calcExpectedSgpa);
    const semCredits = Number(calcSemesterCredits);

    if (
      isNaN(prevC) ||
      isNaN(prevCredits) ||
      isNaN(semS) ||
      isNaN(semCredits) ||
      prevCredits + semCredits <= 0
    ) {
      return '0.00';
    }

    const totalGradePoints = prevC * prevCredits + semS * semCredits;
    const totalCredits = prevCredits + semCredits;
    return (totalGradePoints / totalCredits).toFixed(2);
  };

  const expectedCgpa = calculateExpectedCgpa();
  const cgpaDiffNumber = parseFloat(expectedCgpa) - calcCgpa;
  const cgpaDiff = cgpaDiffNumber.toFixed(2);

  // Available semesters list from API or standard KTU
  const allSemesters = data?.semesters || [];
  const displaySemesters = selectedSemesterFilter === 'All'
    ? allSemesters
    : allSemesters.filter((s) => s.semester === selectedSemesterFilter);

  const filterButtons = ['All', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  if (loading && !data) {
    return (
      <div className="page-body">
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Loading Academic Marks...</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
            Fetching semester-wise continuous assessments and CGPA records
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* 1. TOP ACADEMIC PERFORMANCE CARD */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Academic Performance Record
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: '4px' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {(data?.cgpa || 9.40).toFixed(2)}
              </h1>
              <span className="badge badge-safe" style={{ fontSize: '0.82rem', padding: '4px 10px', fontWeight: 700 }}>
                Current Cumulative CGPA
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
              Completed Credits: <strong style={{ color: '#0f172a' }}>{data?.completed_credits || 84}</strong> / {data?.total_credits || 160} Credits • KTU 2024 Scheme
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                background: '#eef2ff',
                border: '1.5px solid #c7d2fe',
                padding: '10px 18px',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '130px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Semester
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                {data?.current_semester ? `Semester ${data.current_semester.replace('S', '')}` : 'Semester 5'}
              </div>
            </div>

            <div
              style={{
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                padding: '10px 18px',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '130px',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Standing
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                {data?.standing || 'Distinction'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEMESTER FILTER */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Semesters
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              Filter by Semester
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filterButtons.map((sem) => {
              const isSelected = selectedSemesterFilter === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => handleFilterSelect(sem)}
                  style={{
                    padding: '7px 15px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: isSelected ? '1.5px solid #4f46e5' : '1.5px solid #e2e8f0',
                    background: isSelected ? '#4f46e5' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  }}
                >
                  {sem}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SEMESTER-WISE ACCORDION CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
        {displaySemesters.map((semGroup) => {
          const isExpanded = !!expandedSemesters[semGroup.semester];
          const isCurrent = semGroup.status === 'Current';
          const isCompleted = semGroup.status === 'Completed';
          const isUpcoming = semGroup.status === 'Upcoming';

          return (
            <div
              key={semGroup.semester}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: isCurrent
                  ? '1.5px solid #818cf8'
                  : '1px solid var(--border-light)',
                boxShadow: isCurrent ? '0 4px 16px rgba(79, 70, 229, 0.08)' : 'var(--shadow-sm)',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Semester Header (Clickable) */}
              <div
                onClick={() => toggleSemester(semGroup.semester)}
                style={{
                  padding: '18px 24px',
                  background: isCurrent
                    ? 'linear-gradient(90deg, #faf5ff 0%, #f5f3ff 100%)'
                    : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none',
                  userSelect: 'none',
                }}
              >
                {/* Left info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        SEMESTER {semGroup.semester.replace('S', '')}
                      </h3>

                      {/* Status Badges */}
                      {isCompleted && (
                        <span
                          className="badge"
                          style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Completed</span>
                        </span>
                      )}

                      {isCurrent && (
                        <span
                          className="badge"
                          style={{
                            background: '#eef2ff',
                            color: '#4f46e5',
                            border: '1px solid #c7d2fe',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: '0.4px',
                          }}
                        >
                          CURRENT SEMESTER
                        </span>
                      )}

                      {isUpcoming && (
                        <span
                          className="badge"
                          style={{
                            background: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                      {semGroup.totalSubjects} Subjects • {semGroup.totalCredits} Credits
                    </div>
                  </div>
                </div>

                {/* Right SGPA & Toggle Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      background: isCompleted ? '#f0fdf4' : isCurrent ? '#f5f3ff' : '#f8fafc',
                      border: isCompleted ? '1px solid #bbf7d0' : isCurrent ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                      textAlign: 'right',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginRight: '6px' }}>
                      SGPA
                    </span>
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: isCompleted ? '#15803d' : isCurrent ? '#6d28d9' : '#94a3b8',
                      }}
                    >
                      {semGroup.sgpaDisplay}
                    </span>
                  </div>

                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isExpanded ? '#f1f5f9' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      transition: 'transform 0.2s',
                    }}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Accordion Content: Subjects Table */}
              {isExpanded && (
                <div style={{ padding: '0' }}>
                  {semGroup.subjects.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                      <BookOpen size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>No subjects registered for this semester in the database.</p>
                    </div>
                  ) : (
                    <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Subject Code & Name</th>
                            <th>Internal 1 (30)</th>
                            <th>Internal 2 (30)</th>
                            <th>Assignment (10)</th>
                            <th>Project / Practical (10)</th>
                            <th>Total (80)</th>
                            <th>Score %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semGroup.subjects.map((subj) => {
                            const isSubjUpcoming = subj.status === 'Upcoming' || subj.status === 'Not Started';
                            const isSubjInProgress = subj.status === 'Marks in Progress';
                            const isSubjCompleted = subj.status === 'Completed';

                            return (
                              <tr key={subj.subject_id}>
                                {/* Subject Info */}
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.88rem' }}>
                                      {subj.code}
                                    </span>
                                    <span
                                      className="badge"
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 6px',
                                        background: '#f1f5f9',
                                        color: '#475569',
                                      }}
                                    >
                                      {subj.credits} Credits
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem', marginTop: '2px' }}>
                                    {subj.subject_name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px' }}>
                                    {subj.teacher}
                                  </div>
                                </td>

                                {/* Internal 1 */}
                                <td>
                                  {subj.internal1 !== null ? (
                                    <>
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{subj.internal1}</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> / {subj.max_internal1}</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                  )}
                                </td>

                                {/* Internal 2 */}
                                <td>
                                  {subj.internal2 !== null ? (
                                    <>
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{subj.internal2}</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> / {subj.max_internal2}</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                  )}
                                </td>

                                {/* Assignment */}
                                <td>
                                  {subj.assignment !== null ? (
                                    <>
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{subj.assignment}</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> / {subj.max_assignment}</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                  )}
                                </td>

                                {/* Project / Practical */}
                                <td>
                                  {subj.project !== null ? (
                                    <>
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{subj.project}</span>
                                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> / {subj.max_project}</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                  )}
                                </td>

                                {/* Total (80) */}
                                <td>
                                  {isSubjCompleted && subj.total !== null ? (
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                      {subj.total} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ {subj.max_total}</span>
                                    </div>
                                  ) : isSubjInProgress ? (
                                    <span
                                      className="badge"
                                      style={{
                                        fontSize: '0.72rem',
                                        background: '#fffbeb',
                                        color: '#b45309',
                                        border: '1px solid #fef3c7',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Marks in Progress
                                    </span>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                      <span
                                        className="badge"
                                        style={{
                                          fontSize: '0.7rem',
                                          background: '#f8fafc',
                                          color: '#64748b',
                                          border: '1px solid #e2e8f0',
                                        }}
                                      >
                                        Upcoming
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Score % & Grade */}
                                <td style={{ minWidth: '140px' }}>
                                  {isSubjCompleted && subj.percentage !== null ? (
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                                          {subj.percentage}%
                                        </span>
                                        {subj.letterGrade && (
                                          <span
                                            className="badge"
                                            style={{
                                              fontSize: '0.7rem',
                                              padding: '1px 6px',
                                              fontWeight: 800,
                                              background: subj.percentage >= 80 ? '#ecfdf5' : '#eef2ff',
                                              color: subj.percentage >= 80 ? '#065f46' : '#4f46e5',
                                              border: subj.percentage >= 80 ? '1px solid #a7f3d0' : '1px solid #c7d2fe',
                                            }}
                                          >
                                            Grade {subj.letterGrade}
                                          </span>
                                        )}
                                      </div>
                                      <div className="progress-container" style={{ height: '6px' }}>
                                        <div
                                          className="progress-fill primary"
                                          style={{ width: `${Math.min(subj.percentage, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. CGPA JOURNEY */}
      <div className="card" style={{ marginBottom: '28px', padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#4f46e5" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                CGPA Journey
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '3px' }}>
              Semester-by-semester SGPA performance and academic trajectory
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>Completed</span>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', marginLeft: '8px' }}></span>
            <span>Current</span>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', marginLeft: '8px' }}></span>
            <span>Upcoming</span>
          </div>
        </div>

        {/* Timeline Journey Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '12px',
          }}
        >
          {data?.journey?.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isCurrent = item.status === 'Current';
            const isUpcoming = item.status === 'Upcoming';

            return (
              <div
                key={item.semester}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  background: isCompleted ? '#f0fdf4' : isCurrent ? '#f5f3ff' : '#f8fafc',
                  border: isCompleted
                    ? '1.5px solid #86efac'
                    : isCurrent
                    ? '1.5px solid #a5b4fc'
                    : '1px solid #e2e8f0',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: isCompleted ? '#166534' : isCurrent ? '#4f46e5' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {item.semester}
                </div>

                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isCompleted ? '#15803d' : isCurrent ? '#4338ca' : '#94a3b8',
                    marginTop: '4px',
                  }}
                >
                  {item.displaySgpa}
                </div>

                <div style={{ marginTop: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isCompleted ? '#059669' : isCurrent ? '#6366f1' : '#94a3b8',
                    }}
                  >
                    {isCompleted ? 'SGPA' : isCurrent ? 'In Progress' : 'Upcoming'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. EXPECTED CGPA CALCULATOR CARD */}
      <div
        className="card"
        style={{
          border: '1.5px solid #c7d2fe',
          background: 'linear-gradient(145deg, #ffffff 0%, #f5f3ff 100%)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '10px' }}>
            <Calculator size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Expected CGPA Calculator
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
              Simulate your new aggregate CGPA after current semester results
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Current Cumulative CGPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="input-field"
              value={calcCgpa}
              onChange={(e) => setCalcCgpa(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Completed Credits</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={calcCompletedCredits}
              onChange={(e) => setCalcCompletedCredits(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Expected Semester SGPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="input-field"
              value={calcExpectedSgpa}
              onChange={(e) => setCalcExpectedSgpa(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Semester Credits ({data?.current_semester || 'S5'})</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={calcSemesterCredits}
              onChange={(e) => setCalcSemesterCredits(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* Dynamic Calculation Result Banner */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
              Projected Aggregate CGPA
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: '4px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
                {expectedCgpa}
              </span>
              <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>/ 10.00</span>
            </div>
            <p style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '6px' }}>
              Total Weighted Credits: <strong>{calcCompletedCredits + calcSemesterCredits} Credits</strong>
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '14px 22px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>
              Net Change
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
                marginTop: '2px',
              }}
            >
              {cgpaDiffNumber >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
              <span>{cgpaDiffNumber >= 0 ? `+${cgpaDiff}` : cgpaDiff}</span>
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>
              vs current {calcCgpa.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
