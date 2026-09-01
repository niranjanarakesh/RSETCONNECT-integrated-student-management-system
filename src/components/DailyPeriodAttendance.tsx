import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  User,
  CheckCircle2,
  XCircle,
  Award,
  Info,
  X,
  Layers,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { DailyAttendanceResponse, DayAttendanceLog, PeriodAttendanceItem } from '../types.js';

interface DailyPeriodAttendanceProps {
  studentUid: string;
  semester: string;
}

const PERIOD_TIMINGS: Record<number, string> = {
  1: '08:30 AM - 09:25 AM',
  2: '09:30 AM - 10:25 AM',
  3: '10:40 AM - 11:35 AM',
  4: '11:40 AM - 12:35 PM',
  5: '01:30 PM - 02:25 PM',
  6: '02:30 PM - 03:25 PM',
  7: '03:30 PM - 04:20 PM',
};

export const DailyPeriodAttendance: React.FC<DailyPeriodAttendanceProps> = ({
  studentUid,
  semester,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [data, setData] = useState<DailyAttendanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected period modal state
  const [selectedModalItem, setSelectedModalItem] = useState<{
    item: PeriodAttendanceItem;
    day: DayAttendanceLog;
  } | null>(null);

  // Filter for table (e.g. show all or filter days with exceptions)
  const [filterType, setFilterType] = useState<'all' | 'exceptions' | 'absent' | 'duty_leave'>('all');

  const fetchDailyAttendance = async (monthToFetch: string = selectedMonth) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/students/${studentUid}/attendance/daily?semester=${semester}&month=${monthToFetch}&_t=${Date.now()}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load daily attendance (HTTP ${res.status})`);
      }
      const json: DailyAttendanceResponse = await res.json();
      setData(json);
      if (json.selectedMonth && json.selectedMonth !== selectedMonth) {
        setSelectedMonth(json.selectedMonth);
      }
    } catch (err: any) {
      console.error('Error fetching daily attendance:', err);
      setError(err.message || 'Failed to fetch daily attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAttendance(selectedMonth);
  }, [studentUid, semester, selectedMonth]);

  // Navigate to previous month in the available list
  const handlePrevMonth = () => {
    if (!data?.availableMonths || data.availableMonths.length === 0) return;
    const currentIndex = data.availableMonths.findIndex((m) => m.value === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(data.availableMonths[currentIndex - 1].value);
    }
  };

  // Navigate to next month in the available list
  const handleNextMonth = () => {
    if (!data?.availableMonths || data.availableMonths.length === 0) return;
    const currentIndex = data.availableMonths.findIndex((m) => m.value === selectedMonth);
    if (currentIndex >= 0 && currentIndex < data.availableMonths.length - 1) {
      setSelectedMonth(data.availableMonths[currentIndex + 1].value);
    }
  };

  const currentIndex = data?.availableMonths?.findIndex((m) => m.value === selectedMonth) ?? -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext =
    data?.availableMonths &&
    currentIndex >= 0 &&
    currentIndex < data.availableMonths.length - 1;

  // Filter days based on user selection
  const displayedDays = (data?.days || []).filter((d) => {
    if (filterType === 'all') return true;
    if (filterType === 'exceptions') return d.summary.absent > 0 || d.summary.dutyLeave > 0;
    if (filterType === 'absent') return d.summary.absent > 0;
    if (filterType === 'duty_leave') return d.summary.dutyLeave > 0;
    return true;
  });

  return (
    <div
      className="card"
      id="daily-period-attendance-section"
      style={{
        marginBottom: '28px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        background: '#ffffff',
      }}
    >
      {/* 1. Header & Navigation Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '18px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              PERIOD-BY-PERIOD TRACKER
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Semester {semester}</span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
            Daily / Period-wise Attendance Log
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0' }}>
            View hour-by-hour period records (1 to 7) for each college working day
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handlePrevMonth}
              disabled={!canGoPrev || loading}
              style={{
                padding: '6px 8px',
                color: canGoPrev ? '#334155' : '#cbd5e1',
                cursor: canGoPrev ? 'pointer' : 'not-allowed',
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={loading}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#1e293b',
                padding: '4px 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {data?.availableMonths && data.availableMonths.length > 0 ? (
                data.availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))
              ) : (
                <option value="2026-08">August 2026</option>
              )}
            </select>

            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleNextMonth}
              disabled={!canGoNext || loading}
              style={{
                padding: '6px 8px',
                color: canGoNext ? '#334155' : '#cbd5e1',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Monthly Summary Cards */}
      {data?.monthSummary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* Present */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Present Classes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              {data.monthSummary.presentClasses}
            </div>
          </div>

          {/* Absent */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
              Absent Classes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
              {data.monthSummary.absentClasses}
            </div>
          </div>

          {/* Duty Leave */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
              Duty Leave
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              {data.monthSummary.dutyLeave}
            </div>
          </div>

          {/* Total Scheduled */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Total Classes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {data.monthSummary.totalClasses}
            </div>
          </div>

          {/* Month Percentage */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background:
                data.monthSummary.percentage >= 80
                  ? '#ecfdf5'
                  : data.monthSummary.percentage >= 75
                  ? '#fffbeb'
                  : '#fef2f2',
              border: `1.5px solid ${
                data.monthSummary.percentage >= 80
                  ? '#a7f3d0'
                  : data.monthSummary.percentage >= 75
                  ? '#fde68a'
                  : '#fecaca'
              }`,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color:
                  data.monthSummary.percentage >= 80
                    ? '#065f46'
                    : data.monthSummary.percentage >= 75
                    ? '#92400e'
                    : '#991b1b',
                textTransform: 'uppercase',
              }}
            >
              {data.selectedMonthName.split(' ')[0]} Rate
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color:
                  data.monthSummary.percentage >= 80
                    ? '#059669'
                    : data.monthSummary.percentage >= 75
                    ? '#d97706'
                    : '#dc2626',
                marginTop: '2px',
              }}
            >
              {data.monthSummary.percentage}%
            </div>
          </div>
        </div>
      )}

      {/* 3. Legend & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#f8fafc',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
        }}
      >
        {/* Status Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Legend:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#15803d' }}>Present (P)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b91c1c' }}>Absent (A)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#f59e0b',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b45309' }}>Duty Leave (DL)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#cbd5e1',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Not Scheduled (—)</span>
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
          <button
            type="button"
            className={`btn btn-xs ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('all')}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            All Days ({data?.days.length || 0})
          </button>
          <button
            type="button"
            className={`btn btn-xs ${filterType === 'exceptions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('exceptions')}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            Exceptions
          </button>
        </div>
      </div>

      {/* 4. Daily / Period-wise Attendance Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
            <Clock size={24} />
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Loading period records for {selectedMonth}...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#991b1b', background: '#fef2f2', borderRadius: '10px' }}>
          <AlertTriangle size={24} style={{ display: 'inline-block', marginBottom: '6px' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : displayedDays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
          <Calendar size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
          <h4 style={{ fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>No Attendance Records Found</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No lecture periods were scheduled or recorded for {data?.selectedMonthName || selectedMonth}.
          </p>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                <th style={{ width: '160px', padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                  Date & Day
                </th>
                {[1, 2, 3, 4, 5, 6, 7].map((pNum) => (
                  <th
                    key={pNum}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: '#334155',
                      width: '75px',
                    }}
                  >
                    <div>P{pNum}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b', marginTop: '1px' }}>
                      {pNum === 1
                        ? '08:30'
                        : pNum === 2
                        ? '09:30'
                        : pNum === 3
                        ? '10:40'
                        : pNum === 4
                        ? '11:40'
                        : pNum === 5
                        ? '01:30'
                        : pNum === 6
                        ? '02:30'
                        : '03:30'}
                    </div>
                  </th>
                ))}
                <th style={{ width: '130px', padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                  Day Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedDays.map((dayRow) => {
                const hasException = dayRow.summary.absent > 0 || dayRow.summary.dutyLeave > 0;
                return (
                  <tr
                    key={dayRow.date}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: hasException ? '#fffdfa' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Date Column */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {dayRow.formattedDate}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                        {dayRow.dayOfWeek}
                      </div>
                    </td>

                    {/* Periods 1 to 7 */}
                    {dayRow.periods.map((periodItem, pIdx) => {
                      const periodNumber = pIdx + 1;

                      if (!periodItem) {
                        return (
                          <td
                            key={periodNumber}
                            style={{
                              textAlign: 'center',
                              padding: '8px 4px',
                              color: '#cbd5e1',
                              fontSize: '0.85rem',
                              background: '#fafbfc',
                            }}
                          >
                            <span title={`Period ${periodNumber}: Not Scheduled`}>—</span>
                          </td>
                        );
                      }

                      const isPresent = periodItem.status === 'Present';
                      const isAbsent = periodItem.status === 'Absent';
                      const isDutyLeave = periodItem.status === 'Duty Leave';

                      const bgColor = isPresent
                        ? '#dcfce7'
                        : isAbsent
                        ? '#fee2e2'
                        : '#fef3c7';

                      const textColor = isPresent
                        ? '#15803d'
                        : isAbsent
                        ? '#b91c1c'
                        : '#b45309';

                      const borderColor = isPresent
                        ? '#bbf7d0'
                        : isAbsent
                        ? '#fca5a5'
                        : '#fde68a';

                      const badgeLetter = isPresent ? 'P' : isAbsent ? 'A' : 'DL';

                      return (
                        <td
                          key={periodNumber}
                          style={{
                            textAlign: 'center',
                            padding: '6px 4px',
                            verticalAlign: 'middle',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedModalItem({ item: periodItem, day: dayRow })}
                            style={{
                              width: '100%',
                              padding: '6px 2px',
                              borderRadius: '8px',
                              background: bgColor,
                              border: `1px solid ${borderColor}`,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            title={`Period ${periodNumber}: ${periodItem.courseCode} (${periodItem.status}) - Click for details`}
                          >
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: textColor,
                                lineHeight: 1,
                              }}
                            >
                              {badgeLetter}
                            </span>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: textColor,
                                opacity: 0.9,
                                letterSpacing: '-0.2px',
                              }}
                            >
                              {periodItem.courseCode}
                            </span>
                          </button>
                        </td>
                      );
                    })}

                    {/* Day Summary */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        {dayRow.summary.present + dayRow.summary.dutyLeave}/{dayRow.summary.total} Attended
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '3px' }}>
                        {dayRow.summary.absent > 0 && (
                          <span
                            className="badge badge-below"
                            style={{ fontSize: '0.68rem', padding: '1px 5px', fontWeight: 700 }}
                          >
                            {dayRow.summary.absent} Absent
                          </span>
                        )}
                        {dayRow.summary.dutyLeave > 0 && (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: '0.68rem', padding: '1px 5px', fontWeight: 700 }}
                          >
                            {dayRow.summary.dutyLeave} DL
                          </span>
                        )}
                        {dayRow.summary.absent === 0 && dayRow.summary.dutyLeave === 0 && (
                          <span
                            className="badge badge-safe"
                            style={{ fontSize: '0.68rem', padding: '1px 5px', fontWeight: 700 }}
                          >
                            100%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Period Detail Modal / Drawer */}
      {selectedModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setSelectedModalItem(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              position: 'relative',
              animation: 'fadeIn 0.15s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span
                  className={`badge ${
                    selectedModalItem.item.status === 'Present'
                      ? 'badge-safe'
                      : selectedModalItem.item.status === 'Duty Leave'
                      ? 'badge-warning'
                      : 'badge-below'
                  }`}
                  style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px' }}
                >
                  {selectedModalItem.item.status === 'Present'
                    ? '✓ PRESENT'
                    : selectedModalItem.item.status === 'Duty Leave'
                    ? '★ DUTY LEAVE (EFFECTIVE ATTENDED)'
                    : '✕ ABSENT'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                  Period {selectedModalItem.item.period} Lecture Details
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  {selectedModalItem.day.formattedDate} ({selectedModalItem.day.dayOfWeek})
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedModalItem(null)}
                style={{ color: '#64748b', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '18px',
              }}
            >
              {/* Course */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <BookOpen size={18} color="#4f46e5" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Course
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedModalItem.item.courseCode} — {selectedModalItem.item.courseName}
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Clock size={18} color="#059669" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Class Hour / Period Time
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                    Period {selectedModalItem.item.period} ({PERIOD_TIMINGS[selectedModalItem.item.period] || 'Class Hour'})
                  </div>
                </div>
              </div>

              {/* Faculty */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <User size={18} color="#d97706" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Faculty / Instructor
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                    {selectedModalItem.item.teacher || 'Department Faculty'}
                  </div>
                </div>
              </div>

              {/* Semester & Class */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Layers size={18} color="#6366f1" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Academic Batch & Term
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                    Semester {semester} • S5 CSE A
                  </div>
                </div>
              </div>
            </div>

            {/* Note & Policy Reminder */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background:
                  selectedModalItem.item.status === 'Duty Leave'
                    ? '#fffbeb'
                    : selectedModalItem.item.status === 'Absent'
                    ? '#fef2f2'
                    : '#ecfdf5',
                border: `1px solid ${
                  selectedModalItem.item.status === 'Duty Leave'
                    ? '#fde68a'
                    : selectedModalItem.item.status === 'Absent'
                    ? '#fecaca'
                    : '#a7f3d0'
                }`,
                fontSize: '0.82rem',
                color:
                  selectedModalItem.item.status === 'Duty Leave'
                    ? '#92400e'
                    : selectedModalItem.item.status === 'Absent'
                    ? '#991b1b'
                    : '#065f46',
                lineHeight: 1.45,
                marginBottom: '16px',
              }}
            >
              {selectedModalItem.item.status === 'Duty Leave' && (
                <div>
                  <strong>Duty Leave Credit:</strong> This period counts as <strong>Effective Attended</strong> for internal eligibility and university examination criteria.
                </div>
              )}
              {selectedModalItem.item.status === 'Absent' && (
                <div>
                  <strong>Absence Recorded:</strong> You were marked absent for this lecture hour. If you participated in an approved collegiate event, submit your Duty Leave certificate to the department coordinator.
                </div>
              )}
              {selectedModalItem.item.status === 'Present' && (
                <div>
                  <strong>Attendance Verified:</strong> Physical attendance logged during regular lecture hour.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
