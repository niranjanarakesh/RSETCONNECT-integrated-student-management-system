import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, XCircle, FileText, AlertCircle, RefreshCw, X, Filter } from 'lucide-react';
import { Activity } from '../../types.js';

export const AdminActivityApprovals: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [activeItem, setActiveItem] = useState<Activity | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [pointsToAward, setPointsToAward] = useState<number>(10);
  const [remarks, setRemarks] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openApproveModal = (act: Activity) => {
    setActiveItem(act);
    setActionType('approve');
    setPointsToAward(act.requested_points || 5);
    setRemarks('Approved by Faculty Advisor (KTU Activity Points)');
  };

  const openRejectModal = (act: Activity) => {
    setActiveItem(act);
    setActionType('reject');
    setRemarks('Certificate does not meet KTU verification criteria or is missing required seal.');
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    setProcessing(true);
    setToastMsg(null);

    try {
      if (actionType === 'approve') {
        const res = await fetch(`/api/admin/activities/${activeItem.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: pointsToAward, remarks }),
        });
        if (res.ok) {
          setToastMsg({ type: 'success', text: `Approved ${pointsToAward} points for ${activeItem.title}!` });
          setActiveItem(null);
          fetchActivities();
        }
      } else {
        const res = await fetch(`/api/admin/activities/${activeItem.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarks }),
        });
        if (res.ok) {
          setToastMsg({ type: 'success', text: `Rejected submission for ${activeItem.title}.` });
          setActiveItem(null);
          fetchActivities();
        }
      }
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Error processing activity decision' });
    } finally {
      setProcessing(false);
    }
  };

  const filtered = activities.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#fffbeb', color: '#f59e0b', borderRadius: '14px' }}>
              <Award size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                Activity Points Verification & Approvals
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Faculty Advisor approval portal for KTU extracurricular, professional, and leadership credit points
              </p>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={fetchActivities} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: toastMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${toastMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: toastMsg.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
          <button
            key={st}
            type="button"
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(st)}
          >
            {st} Submissions
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Activity Title & Category</th>
                <th>Semester</th>
                <th>Requested / Awarded</th>
                <th>Certificate Document</th>
                <th>Status</th>
                <th>Action & Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act) => (
                <tr key={act.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {act.student_name || act.student_uid}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      UID: {act.student_uid}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{act.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>{act.category}</div>
                    {act.description && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', maxWidth: '280px' }}>
                        {act.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info">{act.semester}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: act.status === 'Approved' ? '#059669' : '#0f172a' }}>
                      {act.status === 'Approved' ? `+${act.points} pts awarded` : `${act.requested_points} pts requested`}
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
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No attachment</span>
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
                    {act.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => openApproveModal(act)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => openRejectModal(act)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {act.remarks || 'Processed'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Review Modal */}
      {activeItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {actionType === 'approve' ? 'Approve Activity Points' : 'Reject Activity Submission'}
              </h3>
              <button className="btn-icon" onClick={() => setActiveItem(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDecision}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{activeItem.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    Student: <strong>{activeItem.student_name || activeItem.student_uid}</strong> ({activeItem.student_uid})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Category: <strong>{activeItem.category}</strong>
                  </div>
                </div>

                {actionType === 'approve' && (
                  <div className="form-group">
                    <label className="form-label">Activity Points to Award</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      className="input-field"
                      value={pointsToAward}
                      onChange={(e) => setPointsToAward(parseInt(e.target.value) || 5)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Advisor Remarks / Reason</label>
                  <textarea
                    className="textarea-field"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveItem(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${actionType === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
