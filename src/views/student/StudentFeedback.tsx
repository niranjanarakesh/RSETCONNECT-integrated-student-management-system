import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Send, Star, AlertCircle } from 'lucide-react';

export const StudentFeedback: React.FC = () => {
  const teachersList = [
    { teacher: 'Prof. Jisha G.', subject: 'Web Programming (CST305)' },
    { teacher: 'Dr. Binu A.', subject: 'Theory of Computation (CST301)' },
    { teacher: 'Prof. Mary Priya', subject: 'Operating Systems (CST303)' },
    { teacher: 'Dr. Deepa K.', subject: 'Probability & Statistics (MAT301)' },
    { teacher: 'Prof. Paul P. J.', subject: 'Python for Engineers (CST307)' },
    { teacher: 'Dr. Preetha K. G.', subject: 'Software Engineering (CST309)' },
    { teacher: 'Prof. Joseph K.', subject: 'Constitution of India (MCN301)' },
  ];

  const [selectedPair, setSelectedPair] = useState(teachersList[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: 'Excellent',
    q2: 'Excellent',
    q3: 'Good',
    q4: 'Excellent',
    q5: 'Good',
    q6: 'Excellent',
    q7: 'Good',
    q8: 'Excellent',
    q9: 'Good',
    q10: 'Excellent',
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const questions = [
    { id: 'q1', text: '1. Was the syllabus completed on time?' },
    { id: 'q2', text: '2. Was the explanation clear and understandable?' },
    { id: 'q3', text: '3. Were doubts and student queries addressed effectively?' },
    { id: 'q4', text: '4. Were sufficient practical examples provided in class?' },
    { id: 'q5', text: '5. Was the pace of teaching appropriate for all students?' },
    { id: 'q6', text: '6. Were study materials, notes, and references provided?' },
    { id: 'q7', text: '7. Was the classroom atmosphere interactive and engaging?' },
    { id: 'q8', text: '8. Were real-world and practical applications discussed?' },
    { id: 'q9', text: '9. Were internal assessments and assignments evaluated properly?' },
    { id: 'q10', text: '10. What is your overall satisfaction with the course and instructor?' },
  ];

  const options = ['Excellent', 'Good', 'Average', 'Poor'];

  const handleOptionChange = (qId: string, opt: string) => {
    setAnswers({ ...answers, [qId]: opt });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: selectedPair.teacher,
          subject: selectedPair.subject.split(' (')[0],
          answers,
          comments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Feedback submitted successfully. Thank you for your valuable response!');
        setComments('');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '14px' }}>
            <MessageSquare size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              Faculty Feedback & Evaluation Module
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Your constructive feedback helps maintain high standards of teaching and academic quality. Submissions are strictly confidential and anonymous.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '16px 20px',
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle size={22} color="#059669" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {/* Select Teacher & Course */}
        <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Select Faculty & Subject
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Subject & Faculty Member</label>
              <select
                className="select-field"
                value={`${selectedPair.teacher}__${selectedPair.subject}`}
                onChange={(e) => {
                  const [t, s] = e.target.value.split('__');
                  setSelectedPair({ teacher: t, subject: s });
                  setSuccessMsg(null);
                }}
              >
                {teachersList.map((item, idx) => (
                  <option key={idx} value={`${item.teacher}__${item.subject}`}>
                    {item.subject} — {item.teacher}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 10 Questions Evaluation Matrix */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Course Evaluation Questions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a', marginBottom: '12px' }}>
                {q.text}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                {options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleOptionChange(q.id, opt)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                        background: isSelected ? '#eef2ff' : '#ffffff',
                        color: isSelected ? '#4f46e5' : '#475569',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions / Complaints */}
        <div style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.95rem' }}>
              Suggestions / Comments / Areas for Improvement
            </label>
            <textarea
              className="textarea-field"
              placeholder="Share specific suggestions or appreciation regarding teaching methodologies, lab experiments, or resources..."
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            <Send size={16} />
            <span>{submitting ? 'Submitting Feedback...' : 'Submit Faculty Feedback'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
