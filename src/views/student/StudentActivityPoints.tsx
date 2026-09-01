import React, { useEffect, useState } from 'react';
import { Award, Plus, CheckCircle, AlertTriangle, Clock, FileText, UploadCloud, X, RefreshCw, Eye } from 'lucide-react';
import { ActivityPointsResponse, Activity } from '../../types.js';

interface StudentActivityPointsProps {
  studentUid: string;
}

export const StudentActivityPoints: React.FC<StudentActivityPointsProps> = ({ studentUid }) => {
  const [data, setData] = useState<ActivityPointsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form State
  const [semester, setSemester] = useState('S5');
  const [category, setCategory] = useState<'Extracurricular & National Initiatives' | 'Professional' | 'Volunteering & Leadership Skills'>('Extracurricular & National Initiatives');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedPoints, setRequestedPoints] = useState(10);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${studentUid}`);
      if (res.ok) {
        const d: ActivityPointsResponse = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [studentUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormMsg({ type: 'error', text: 'Please enter an activity title.' });
      return;
    }

    setSubmitting(true);
    setFormMsg(null);

    try {
      const formData = new FormData();
      formData.append('student_uid', studentUid);
      formData.append('semester', semester);
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('requested_points', requestedPoints.toString());
      if (file) {
        formData.append('certificate', file);
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setFormMsg({ type: 'success', text: resData.message });
        setTitle('');
        setDescription('');
        setFile(null);
        setTimeout(() => {
          setShowSubmitModal(false);
          setFormMsg(null);
          fetchActivities();
        }, 1500);
      } else {
        setFormMsg({ type: 'error', text: resData.message || 'Submission failed.' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Network error submitting activity.' });
    } finally {
      setSubmitting(false);
    }
  };

  const pointPresets = [
    { label: 'Workshop (5 pts)', val: 5 },
    { label: 'Cultural Event (5 pts)', val: 5 },
    { label: 'Sports (5 pts)', val: 5 },
    { label: 'Hackathon (10 pts)', val: 10 },
    { label: 'Volunteering (10 pts)', val: 10 },
    { label: 'Leadership Role (10 pts)', val: 10 },
    { label: 'Paper Publication (20 pts)', val: 20 },
  ];

  return (
    <div className="page-body">
      {/* Overall Activity Points & Submit CTA Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              KTU Activity Points Credit Tracker
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: '4px' }}>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a' }}>
                {data?.overall.points || 95}
                <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 500 }}> / 100</span>
              </h1>
              <span className={`badge ${data?.overall.completed ? 'badge-safe' : 'badge-warning'}`}>
                {data?.overall.completed ? 'Degree Requirement Met' : '5 Points Needed for B.Tech Degree'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
              Minimum requirement: <strong>100 points overall</strong> with at least <strong>20 points</strong> in each category.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={fetchActivities} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>
              <Plus size={18} />
              <span>Submit New Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Category Cards + Overall Card Grid */}
      <div className="stat-grid-4" style={{ marginBottom: '28px' }}>
        {/* Category 1: Extracurricular */}
        <div className="stat-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                1. Extracurricular
              </span>
              {data?.categories.extracurricular.completed ? (
                <span className="badge badge-safe">20 / 20 ✓</span>
              ) : (
                <span className="badge badge-warning">Target 20 ⚠</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
              {data?.categories.extracurricular.points || 32} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 20</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>National Initiatives & Cultural</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill safe"
                style={{ width: `${Math.min(((data?.categories.extracurricular.points || 32) / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category 2: Professional */}
        <div className="stat-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                2. Professional
              </span>
              {data?.categories.professional.completed ? (
                <span className="badge badge-safe">20 / 20 ✓</span>
              ) : (
                <span className="badge badge-warning">Target 20 ⚠</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
              {data?.categories.professional.points || 45} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 20</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hackathons, Workshops, Papers</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill safe"
                style={{ width: `${Math.min(((data?.categories.professional.points || 45) / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category 3: Volunteering & Leadership */}
        <div className="stat-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                3. Volunteering
              </span>
              {data?.categories.volunteering.completed ? (
                <span className="badge badge-safe">20 / 20 ✓</span>
              ) : (
                <span className="badge badge-warning">18 / 20 ⚠</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
              {data?.categories.volunteering.points || 18} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 20</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NSS, Student Council, Camps</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill warning"
                style={{ width: `${Math.min(((data?.categories.volunteering.points || 18) / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category 4: Overall Progress */}
        <div className="stat-card" style={{ background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Overall Total
              </span>
              <span className="badge badge-info">95% Goal</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', margin: '6px 0' }}>
              {data?.overall.points || 95} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>KTU Activity Points Rule</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div className="progress-container">
              <div
                className="progress-fill primary"
                style={{ width: `${Math.min(((data?.overall.points || 95) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Submissions Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              My Activity Submissions & Approvals
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Approved points are added automatically to category counts. Pending submissions require faculty advisor approval.
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity Title</th>
                <th>Semester</th>
                <th>Category</th>
                <th>Points Awarded</th>
                <th>Certificate</th>
                <th>Status</th>
                <th>Remarks / Advisor Feedback</th>
              </tr>
            </thead>
            <tbody>
              {data?.activities.map((act) => (
                <tr key={act.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{act.title}</div>
                    {act.description && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', maxWidth: '300px' }}>
                        {act.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{act.semester}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                      {act.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: act.status === 'Approved' ? '#059669' : '#64748b' }}>
                      {act.status === 'Approved' ? `+${act.points} pts` : `(${act.requested_points} req)`}
                    </div>
                  </td>
                  <td>
                    {act.certificate_url ? (
                      <a
                        href={act.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <FileText size={12} />
                        <span>View File</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No file</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        act.status === 'Approved'
                          ? 'badge-approved'
                          : act.status === 'Pending'
                          ? 'badge-pending'
                          : 'badge-rejected'
                      }`}
                    >
                      {act.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: act.status === 'Rejected' ? '#b91c1c' : '#475569' }}>
                      {act.remarks || (act.status === 'Pending' ? 'Under Faculty Verification' : 'Verified')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Activity Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#4f46e5" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Submit Activity for Points Approval
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setShowSubmitModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      fontSize: '0.88rem',
                      background: formMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${formMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                      color: formMsg.type === 'success' ? '#065f46' : '#991b1b',
                    }}
                  >
                    {formMsg.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="select-field"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    >
                      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Requested Points</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      className="input-field"
                      value={requestedPoints}
                      onChange={(e) => setRequestedPoints(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Extracurricular & National Initiatives">
                      1. Extracurricular & National Initiatives
                    </option>
                    <option value="Professional">2. Professional</option>
                    <option value="Volunteering & Leadership Skills">
                      3. Volunteering & Leadership Skills
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. National Hackathon Winner / NSS Camp"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Point presets */}
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Quick Value Presets: </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {pointPresets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        onClick={() => setRequestedPoints(p.val)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Role</label>
                  <textarea
                    className="textarea-field"
                    placeholder="Provide details about your participation, organizer, and achievements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Certificate Upload (PDF / Image)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="input-field"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Uploaded via Multer to backend storage and linked to student record
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Uploading & Submitting...' : 'Submit for Faculty Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
