import React, { useState } from 'react';
import { Shield, User, Lock, Sparkles, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { UserSession } from '../types.js';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [uid, setUid] = useState('rset2024cse001@rajagiri.edu.in');
  const [password, setPassword] = useState('student123');
  const [username, setUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload =
        role === 'student'
          ? { role: 'student', uid, password }
          : { role: 'admin', username, password: adminPassword };

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess({
          role: data.role,
          user: data.user,
        });
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (studentUid: string, email: string) => {
    setRole('student');
    setUid(email);
    setPassword('student123');
    setError(null);
  };

  const autofillAdmin = () => {
    setRole('admin');
    setUsername('admin');
    setAdminPassword('admin123');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, rgba(238, 242, 255, 0.8) 0%, rgba(248, 250, 252, 1) 90%)',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Decorative backdrop shapes */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(124, 58, 237, 0.15))',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '36px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.12), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.92)',
        }}
      >
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 14px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.6rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
            }}
          >
            R
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            RSMS Connect
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
            Rajagiri Student Management System
          </p>
          <div
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: '#f1f5f9',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: '#475569',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
            }}
          >
            <span>Autonomous Engineering Institution • Official Portal</span>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setError(null);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: role === 'student' ? '#ffffff' : 'transparent',
              color: role === 'student' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: role === 'student' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <User size={16} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setError(null);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: role === 'admin' ? '#ffffff' : 'transparent',
              color: role === 'admin' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: role === 'admin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Shield size={16} />
            <span>Faculty / Admin</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          {role === 'student' ? (
            <>
              <div className="form-group">
                <label className="form-label">Institutional Email or Student UID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. rset2024cse001@rajagiri.edu.in or RSET2024CSE001"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    required
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Format: <code>uid@rajagiri.edu.in</code> (Unique institutional ID)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="admin123"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : `Sign in as ${role === 'student' ? 'Student' : 'Faculty / Admin'}`}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Student Switcher for Multi-account Testing */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Student Selection (Test Individual Profiles)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => selectStudent('RSET2024CSE001', 'rset2024cse001@rajagiri.edu.in')}
              className={`btn btn-sm ${uid.toLowerCase().includes('001') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start' }}
              title="Brinda Raj (90.5% Attd, 95 Activity Pts)"
            >
              👩‍🎓 Brinda Raj (001)
            </button>
            <button
              type="button"
              onClick={() => selectStudent('RSET2024CSE002', 'rset2024cse002@rajagiri.edu.in')}
              className={`btn btn-sm ${uid.toLowerCase().includes('002') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start' }}
              title="Abhinav Krishnan (81.3% Attd, 72 Activity Pts)"
            >
              👨‍🎓 Abhinav K. (002)
            </button>
            <button
              type="button"
              onClick={() => selectStudent('RSET2024CSE003', 'rset2024cse003@rajagiri.edu.in')}
              className={`btn btn-sm ${uid.toLowerCase().includes('003') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start' }}
              title="Devika Menon (94.2% Attd, 100 Activity Pts)"
            >
              👩‍🎓 Devika M. (003)
            </button>
            <button
              type="button"
              onClick={() => selectStudent('RSET2024CSE004', 'rset2024cse004@rajagiri.edu.in')}
              className={`btn btn-sm ${uid.toLowerCase().includes('004') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start' }}
              title="Gautam Suresh (76.5% Attd, 45 Activity Pts)"
            >
              👨‍🎓 Gautam S. (004)
            </button>
          </div>
          <button
            type="button"
            onClick={autofillAdmin}
            className={`btn btn-sm ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', fontSize: '0.76rem', padding: '6px 8px' }}
          >
            🛡️ Sign in as Faculty Advisor / Admin
          </button>
        </div>
      </div>
    </div>
  );
};
