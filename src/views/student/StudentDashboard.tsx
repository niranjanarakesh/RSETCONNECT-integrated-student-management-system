import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Award,
  GraduationCap,
  Clock,
  Sparkles,
  Bell,
  ArrowRight,
  FileText,
  Bus,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Student, Announcement, CollegeEvent } from '../../types.js';
import { getInitials } from '../../utils.js';
import defaultStudentAvatar from '../../assets/images/default_student_avatar.svg';

interface StudentDashboardProps {
  student: Student;
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, onNavigate }) => {
  const [profile, setProfile] = useState<Student>(student);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [studentRes, annRes, evRes] = await Promise.all([
          fetch(`/api/students/${student.uid}`),
          fetch('/api/announcements'),
          fetch('/api/events'),
        ]);

        if (studentRes.ok) {
          const sData = await studentRes.json();
          setProfile(sData);
        }
        if (annRes.ok) {
          const aData = await annRes.json();
          setAnnouncements(aData.slice(0, 3));
        }
        if (evRes.ok) {
          const eData = await evRes.json();
          setEvents(eData.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [student.uid]);

  const attPercent = profile.attendancePercentage ?? 87.4;
  const actPoints = profile.activityPoints ?? 95;
  const pendingAct = profile.pendingActivities ?? 2;

  return (
    <div className="page-body">
      {/* Student Profile Card (Hero Header) */}
      <div
        className="glass-card"
        style={{
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 255, 0.9) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative corner accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(147, 51, 234, 0.08) 100%)',
            borderBottomLeftRadius: '100px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Student Photo / Avatar */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
                border: '3px solid #ffffff',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <img
                src={profile.photo && !profile.photo.includes('student_brinda') ? profile.photo : defaultStudentAvatar}
                alt={profile.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = defaultStudentAvatar;
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  {profile.name}
                </h1>
                <span className="badge badge-safe">Enrolled</span>
                <span className="badge badge-info">{profile.class}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px', color: '#64748b', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>UID:</span> {profile.uid}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Email:</span> {profile.email}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Dept:</span> {profile.department}
                </div>
              </div>
            </div>
          </div>

          {/* Digital Signature & CGPA pill */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              background: '#ffffff',
              padding: '12px 18px',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Student Digital Signature
            </div>
            <div className="digital-signature-font" style={{ marginTop: '2px' }}>
              {profile.signature || profile.name || 'Brinda Raj'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <CheckCircle2 size={12} />
              <span>Identity Verified (KTU e-Gov)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dashboard Statistics Cards */}
      <div className="stat-grid-4">
        {/* Attendance Card */}
        <div className="stat-card" onClick={() => onNavigate('attendance')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Attendance
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {attPercent}%
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className={`progress-fill ${attPercent >= 80 ? 'safe' : attPercent >= 75 ? 'warning' : 'danger'}`}
                style={{ width: `${Math.min(attPercent, 100)}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Target: 80.0%</span>
              <span style={{ color: attPercent >= 80 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                {attPercent >= 80 ? 'Safe Zone' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>

        {/* CGPA Card */}
        <div className="stat-card" onClick={() => onNavigate('marks')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Current CGPA
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {profile.cgpa.toFixed(2)}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill primary"
                style={{ width: `${(profile.cgpa / 10) * 100}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Credits: {profile.completed_credits} Completed</span>
              <span style={{ color: '#4f46e5', fontWeight: 700 }}>First Class Distinction</span>
            </div>
          </div>
        </div>

        {/* Activity Points Card */}
        <div className="stat-card" onClick={() => onNavigate('activities')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Activity Points
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {actPoints} <span style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 500 }}>/ 100</span>
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill warning"
                style={{ width: `${Math.min(actPoints, 100)}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
              <span>5 Points to Goal</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>95% Completed</span>
            </div>
          </div>
        </div>

        {/* Pending Activities Card */}
        <div className="stat-card" onClick={() => onNavigate('activities')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Pending Activities
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {pendingAct}
              </h2>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span className="badge badge-pending">Under Verification</span>
              <span>Awaiting Advisor Sign-off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Events & Recent Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Upcoming Events */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px' }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Upcoming Events
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('events')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      textAlign: 'center',
                      minWidth: '55px',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                      {ev.date.split(' ')[1] || 'SEP'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      {ev.date.split(' ')[0] || '15'}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {ev.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {ev.time} • {ev.venue}
                    </p>
                  </div>
                </div>
                <span className="badge badge-info">{ev.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}>
                <Bell size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Recent Announcements
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('announcements')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                    {ann.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {ann.date}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  {ann.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="card" style={{ background: '#ffffff' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          Quick Action Shortcuts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div
            onClick={() => onNavigate('attendance')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f8fafc',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ padding: '8px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Attendance Calc</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Check required classes</div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('activities')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f8fafc',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ padding: '8px', background: '#fffbeb', color: '#f59e0b', borderRadius: '8px' }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Submit Activity</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Upload certificates</div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('hallticket')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f8fafc',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Exam Hall Ticket</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Print admit card</div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('buses')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#f8fafc',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ padding: '8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '8px' }}>
              <Bus size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>College Bus</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live route status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
