import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { Examination } from '../../types.js';

export const AdminExaminations: React.FC = () => {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [formData, setFormData] = useState({
    semester: 'S5',
    course_code: '',
    course_title: '',
    exam_date: '2026-10-05',
    session_time: '9:30 AM – 12:30 PM',
    hall_no: 'Room 204',
    exam_centre: 'RSET Main Campus, Block C',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const semesters = ['All', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  const fetchExaminations = async () => {
    setLoading(true);
    try {
      const url = selectedSemester === 'All'
        ? '/api/admin/examinations'
        : `/api/admin/examinations?semester=${selectedSemester}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExaminations(data);
      }
    } catch (err) {
      console.error('Failed to fetch examination schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminations();
  }, [selectedSemester]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormData({
      semester: selectedSemester !== 'All' ? selectedSemester : 'S5',
      course_code: '',
      course_title: '',
      exam_date: new Date().toISOString().split('T')[0],
      session_time: '9:30 AM – 12:30 PM',
      hall_no: 'Room 204',
      exam_centre: 'RSET Main Campus, Block C',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Examination) => {
    setEditingExam(exam);
    setFormData({
      semester: exam.semester || 'S5',
      course_code: exam.course_code || '',
      course_title: exam.course_title || '',
      exam_date: exam.exam_date || '',
      session_time: exam.session_time || '9:30 AM – 12:30 PM',
      hall_no: exam.hall_no || 'Room 204',
      exam_centre: exam.exam_centre || 'RSET Main Campus, Block C',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this examination from the schedule? This will update student hall tickets immediately.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/examinations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Examination deleted from schedule.');
        fetchExaminations();
      } else {
        showNotification('error', 'Failed to delete examination.');
      }
    } catch (err) {
      showNotification('error', 'Network error while deleting examination.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_code.trim() || !formData.course_title.trim() || !formData.exam_date || !formData.session_time) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingExam) {
        // Edit existing
        const res = await fetch(`/api/admin/examinations/${editingExam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showNotification('success', 'Examination schedule updated successfully in SQLite.');
          setIsModalOpen(false);
          fetchExaminations();
        } else {
          showNotification('error', 'Failed to update examination schedule.');
        }
      } else {
        // Add new
        const res = await fetch('/api/admin/examinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showNotification('success', 'New examination added successfully to database.');
          setIsModalOpen(false);
          fetchExaminations();
        } else {
          showNotification('error', 'Failed to add examination.');
        }
      }
    } catch (err) {
      showNotification('error', 'Error saving examination details.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExams = examinations.filter((exam) => {
    const code = (exam.course_code || '').toLowerCase();
    const title = (exam.course_title || '').toLowerCase();
    const sem = (exam.semester || '').toLowerCase();
    const hall = (exam.hall_no || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return code.includes(query) || title.includes(query) || sem.includes(query) || hall.includes(query);
  });

  return (
    <div className="page-body">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '12px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-lg)',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '14px' }}>
              <FileText size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  Autonomous Examination Schedule
                </h1>
                <span className="badge badge-safe">SQLite Master Database</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
                Manage course exam dates, session timings, and examination halls. Changes directly update student Hall Tickets.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-outline"
              onClick={fetchExaminations}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              title="Refresh database records"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              <span>Add Examination</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Semester Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>
              <Filter size={15} />
              <span>Semester:</span>
            </div>
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: selectedSemester === sem ? 800 : 600,
                  background: selectedSemester === sem ? '#0f172a' : '#f1f5f9',
                  color: selectedSemester === sem ? '#ffffff' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search course, code, or hall..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.88rem' }}
            />
          </div>
        </div>
      </div>

      {/* Examinations Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            Scheduled Examinations ({filteredExams.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing {selectedSemester === 'All' ? 'all semester courses' : `Semester ${selectedSemester} examinations`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading examination schedule from SQLite database...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, color: '#334155' }}>No examinations found for the selected criteria.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "Add Examination" to create schedule entries for this semester.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sem</th>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Exam Date</th>
                  <th>Session Time</th>
                  <th>Hall No</th>
                  <th>Exam Centre</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        {exam.semester}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>{exam.course_code}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{exam.course_title}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{exam.exam_date}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#64748b" />
                        <span>{exam.session_time}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{exam.hall_no}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{exam.exam_centre || 'RSET Main Campus, Block C'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEdit(exam)}
                          title="Edit examination"
                          style={{ color: '#4f46e5' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(exam.id)}
                          title="Delete examination"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Examination Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px' }}>
                  <FileText size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingExam ? 'Edit Examination Schedule' : 'Add Examination Schedule'}
                </h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Semester *
                  </label>
                  <select
                    className="form-control"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                  >
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Course Code *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CST301 or CS301"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Theory of Computation"
                  value={formData.course_title}
                  onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Session Time *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9:30 AM – 12:30 PM"
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Hall No *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Room 204"
                    value={formData.hall_no}
                    onChange={(e) => setFormData({ ...formData, hall_no: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                    Exam Centre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.exam_centre}
                    onChange={(e) => setFormData({ ...formData, exam_centre: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{editingExam ? 'Save Changes' : 'Create Examination'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
