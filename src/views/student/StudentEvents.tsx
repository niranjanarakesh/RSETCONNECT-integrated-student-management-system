import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar as CalendarIcon, MapPin, Clock, Tag } from 'lucide-react';
import { CollegeEvent } from '../../types.js';

export const StudentEvents: React.FC = () => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '14px' }}>
            <Sparkles size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              College Events & Technical Fests
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Stay updated with campus cultural festivals, hackathons, seminars, and project milestones
            </p>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {events.map((ev) => {
          const [day, month, year] = ev.date.split(' ');
          return (
            <div
              key={ev.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid #4f46e5',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  {/* Date Badge */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                      border: '1.5px solid #c7d2fe',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.08)',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>
                      {month || 'SEP'}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      {day || '15'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{year || '2026'}</div>
                  </div>

                  <span className="badge badge-info">{ev.category}</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {ev.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  {ev.description}
                </p>
              </div>

              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} color="#6366f1" />
                  <span>{ev.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#6366f1" />
                  <span>{ev.venue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
