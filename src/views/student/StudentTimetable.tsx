import React, { useEffect, useState } from 'react';
import { Clock, Calendar, MapPin, User, BookOpen } from 'lucide-react';
import { TimetableEntry } from '../../types.js';

export const StudentTimetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        const res = await fetch('/api/timetable');
        if (res.ok) {
          const data = await res.json();
          setTimetable(data);
        }
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, []);

  const filteredEntries = timetable.filter((t) => t.day === selectedDay);

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Academic Schedule
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              Weekly Class Timetable
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Department of Computer Science & Engineering • Class: <strong>S5 CSE A</strong>
            </p>
          </div>

          <div className="badge badge-info" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Calendar size={14} />
            <span>Academic Year 2026 - Odd Sem</span>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        {days.map((day) => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: `1.5px solid ${isActive ? '#4f46e5' : 'var(--border-light)'}`,
                background: isActive ? '#4f46e5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Timetable Period Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredEntries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Clock size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#0f172a', fontWeight: 700 }}>No scheduled lecture sessions</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Enjoy your weekend or prep for lab projects!</p>
          </div>
        ) : (
          filteredEntries.map((period, idx) => (
            <div
              key={period.id || idx}
              className="card"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '18px 24px',
                borderLeft: '4px solid #4f46e5',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    background: '#eef2ff',
                    color: '#4f46e5',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    minWidth: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={16} />
                  <span>{period.time}</span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {period.subject}
                  </h3>
                  {period.teacher && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <User size={13} />
                      <span>{period.teacher}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  <MapPin size={14} color="#6366f1" />
                  <span>{period.room}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
