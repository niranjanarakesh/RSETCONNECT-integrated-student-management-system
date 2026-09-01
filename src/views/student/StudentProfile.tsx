import React, { useState } from 'react';
import { User, Mail, Phone, BookOpen, GraduationCap, Shield, Edit3, Check, CheckCircle2 } from 'lucide-react';
import { Student } from '../../types.js';
import { getInitials } from '../../utils.js';
import defaultStudentAvatar from '../../assets/images/default_student_avatar.svg';

interface StudentProfileProps {
  student: Student;
  onUpdateSuccess: (updated: Student) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone || '+91 98470 54321',
    gender: student.gender || 'Female',
    department: student.department || 'Computer Science & Engineering',
    semester: student.semester || 'S5',
    class: student.class || 'S5 CSE A',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/students/${student.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        onUpdateSuccess(data.student);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-body">
      {/* Profile Header Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '2.2rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
                overflow: 'hidden',
              }}
            >
              <img
                src={student.photo && !student.photo.includes('student_brinda') ? student.photo : defaultStudentAvatar}
                alt={student.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = defaultStudentAvatar;
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  {student.name}
                </h2>
                <span className="badge badge-safe">Active Student</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
                {student.department} • {student.class}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.82rem', color: '#475569' }}>
                <span><strong>UID:</strong> {student.uid}</span>
                <span><strong>Semester:</strong> {student.semester}</span>
                <span><strong>Status:</strong> KTU Regular</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Edit3 size={16} />
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Details & Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Personal & Academic Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#4f46e5" />
            <span>Personal & Contact Information</span>
          </h3>

          {isEditing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rajagiri Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="select-field"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '10px' }}>
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Full Name</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>University UID</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.uid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>College Email</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Phone Number</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.phone || '+91 98470 54321'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Gender</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.gender || 'Female'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Department</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.department}</span>
              </div>
            </div>
          )}
        </div>

        {/* Academic Overview & Verification Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#4f46e5" />
              <span>Academic Status</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Cumulative GPA</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>{student.cgpa.toFixed(2)}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Earned Credits</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{student.completed_credits} / 160</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Faculty Advisor:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Prof. Mary Priya</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Head of Department:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Prof. K. Santhosh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Admission Batch:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>2024 - 2028 (Autonomous)</span>
              </div>
            </div>
          </div>

          {/* Digital Signature Card */}
          <div className="card" style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Student Official Signature on Record
            </div>
            <div style={{ padding: '14px 0', textAlign: 'center' }}>
              <div className="digital-signature-font" style={{ fontSize: '2rem', color: '#1e3a8a' }}>
                {student.signature || student.name || 'Brinda Raj'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                Digitally cryptographically signed during admission onboarding
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
