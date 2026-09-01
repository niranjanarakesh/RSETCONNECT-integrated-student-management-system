import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Student } from '../../types.js';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    email: '',
    phone: '',
    gender: 'Female',
    department: 'Computer Science & Engineering',
    semester: 'S5',
    class: 'S5 CSE A',
    cgpa: 8.5,
    completed_credits: 84,
    signature: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenAdd = () => {
    const nextUid = `RSET2024CSE00${students.length + 1}`;
    setEditingStudent(null);
    setFormData({
      uid: nextUid,
      name: '',
      email: `${nextUid.toLowerCase()}@rajagiri.edu.in`,
      phone: '+91 98470 00000',
      gender: 'Female',
      department: 'Computer Science & Engineering',
      semester: 'S5',
      class: 'S5 CSE A',
      cgpa: 8.5,
      completed_credits: 84,
      signature: '',
    });
    setMessage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      uid: s.uid,
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      gender: s.gender || 'Female',
      department: s.department,
      semester: s.semester,
      class: s.class,
      cgpa: s.cgpa,
      completed_credits: s.completed_credits,
      signature: s.signature || '',
    });
    setMessage(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingStudent) {
        // Edit existing
        const res = await fetch(`/api/students/${editingStudent.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: 'Student updated successfully!' });
          setTimeout(() => {
            setShowModal(false);
            fetchStudents();
          }, 1000);
        } else {
          setMessage({ type: 'error', text: data.message || 'Update failed' });
        }
      } else {
        // Create new
        const res = await fetch('/api/admin/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: 'Student created successfully!' });
          setTimeout(() => {
            setShowModal(false);
            fetchStudents();
          }, 1000);
        } else {
          setMessage({ type: 'error', text: data.message || 'Creation failed' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to communicate with server.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${uid}?`)) return;
    try {
      const res = await fetch(`/api/admin/students/${uid}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '14px' }}>
              <Users size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                Student Registry & Roster Management
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Manage student records, enrollments, credentials, and digital academic identities
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={fetchStudents} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              <span>Enroll New Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '400px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Name, UID, or Class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: '4px', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Student Name</th>
                <th>Class & Dept</th>
                <th>Email</th>
                <th>CGPA</th>
                <th>Attendance %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.uid}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>{s.uid}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.gender}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{s.class}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.department}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#475569' }}>{s.email}</td>
                  <td>
                    <span className="badge badge-info">{s.cgpa ? s.cgpa.toFixed(2) : '9.40'}</span>
                  </td>
                  <td>
                    <span className="badge badge-safe">{s.attendancePercentage || 87.4}%</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px' }}
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Student"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px' }}
                        onClick={() => handleDelete(s.uid)}
                        title="Delete Student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {message && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      fontSize: '0.88rem',
                      background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                      color: message.type === 'success' ? '#065f46' : '#991b1b',
                    }}
                  >
                    {message.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Student UID</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.uid}
                      disabled={!!editingStudent}
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                      required
                    />
                  </div>

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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Rajagiri Email</label>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="select-field"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Current CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="input-field"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Completed Credits</label>
                    <input
                      type="number"
                      min="0"
                      max="160"
                      className="input-field"
                      value={formData.completed_credits}
                      onChange={(e) => setFormData({ ...formData, completed_credits: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Digital Signature Text</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Candidate Signature Name"
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingStudent ? 'Update Student Record' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
