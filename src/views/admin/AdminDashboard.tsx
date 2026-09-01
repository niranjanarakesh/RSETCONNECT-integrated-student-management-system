import React, { useEffect, useState } from 'react';
import { Users, UserCheck, GraduationCap, Clock, Award, Bell, Bus, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Student, Activity, Announcement } from '../../types.js';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 85.6,
    avgCgpa: 8.64,
    pendingActivitiesCount: 0,
  });
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, actRes, annRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/admin/activities/pending'),
        fetch('/api/announcements'),
      ]);

      if (studentsRes.ok) {
        const sList: Student[] = await studentsRes.json();
        const total = sList.length;
        const totalCgpa = sList.reduce((acc, s) => acc + (s.cgpa || 0), 0);
        const avgC = total > 0 ? (totalCgpa / total).toFixed(2) : '8.50';

        setStats((prev) => ({
          ...prev,
          totalStudents: total,
          avgCgpa: parseFloat(avgC),
        }));
      }

      if (actRes.ok) {
        const acts: Activity[] = await actRes.json();
        setPendingActivities(acts);
        setStats((prev) => ({
          ...prev,
          pendingActivitiesCount: acts.length,
        }));
      }

      if (annRes.ok) {
        const anns: Announcement[] = await annRes.json();
        setAnnouncements(anns.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApprove = async (id: number, points: number) => {
    try {
      const res = await fetch(`/api/admin/activities/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, remarks: 'Approved by Faculty Advisor' }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-body">
      {/* Header Banner */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Faculty & Academic Administration Portal
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              Department Management Overview
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Rajagiri School of Engineering & Technology • CSE Academic Council
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('admin-announcements')}>
              <Bell size={14} />
              <span>Post Circular</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('admin-approvals')}>
              <Award size={14} />
              <span>Pending Approvals ({stats.pendingActivitiesCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="stat-grid-4">
        {/* Total Students */}
        <div className="stat-card" onClick={() => onNavigate('admin-students')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Enrolled Students
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {stats.totalStudents || 64}
              </h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
            Manage batch rosters →
          </div>
        </div>

        {/* Average Attendance */}
        <div className="stat-card" onClick={() => onNavigate('admin-attendance')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Average Attendance
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {stats.avgAttendance}%
              </h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            Above 80% threshold
          </div>
        </div>

        {/* Batch Average CGPA */}
        <div className="stat-card" onClick={() => onNavigate('admin-attendance')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Batch CGPA Average
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {stats.avgCgpa.toFixed(2)}
              </h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
            S5 CSE Performance
          </div>
        </div>

        {/* Pending Activity Points */}
        <div className="stat-card" onClick={() => onNavigate('admin-approvals')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Pending Verifications
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.pendingActivitiesCount > 0 ? '#d97706' : '#0f172a', margin: '4px 0' }}>
                {stats.pendingActivitiesCount}
              </h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>
            {stats.pendingActivitiesCount > 0 ? 'Requires advisor action' : 'All cleared'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Pending Submissions & Recent Notices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Pending Activity Submissions Box */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Activity Points Awaiting Approval
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('admin-approvals')}>
              View All
            </button>
          </div>

          {pendingActivities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
              <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <div>All pending student activity submissions are reviewed!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingActivities.slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                        {act.student_name || act.student_uid}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {act.title}
                      </div>
                    </div>
                    <span className="badge badge-pending">+{act.requested_points} pts req</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.category}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        onClick={() => handleQuickApprove(act.id, act.requested_points)}
                      >
                        Approve ({act.requested_points} pts)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Admin Actions */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Administrative Quick Tools
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={() => onNavigate('admin-attendance')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Enter Attendance & Marks</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Update subject-wise records</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </div>

            <div
              onClick={() => onNavigate('admin-buses')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '8px' }}>
                  <Bus size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Update College Buses</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Change live bus stops and status</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </div>

            <div
              onClick={() => onNavigate('admin-feedback')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '8px' }}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Faculty Feedback Reports</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>View student evaluation analytics</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
