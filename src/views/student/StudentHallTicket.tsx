import React, { useEffect, useState } from 'react';
import { FileText, Printer, Download, CheckCircle, ShieldCheck, RefreshCw, AlertCircle, User } from 'lucide-react';
import { Student, StudentHallTicketData } from '../../types.js';
import { getInitials } from '../../utils.js';
import defaultStudentAvatar from '../../assets/images/default_student_avatar.svg';

interface StudentHallTicketProps {
  student: Student;
}

export const StudentHallTicket: React.FC<StudentHallTicketProps> = ({ student }) => {
  const [data, setData] = useState<StudentHallTicketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHallTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.uid}/hall-ticket`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Unable to load hall ticket from database.');
      }
    } catch (err) {
      console.error('Failed to fetch hall ticket:', err);
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHallTicket();
  }, [student.uid]);

  const handlePrint = () => {
    window.print();
  };

  const currentStudent = data?.student || student;
  const examinations = data?.examinations || [];
  const examCentre = data?.examCentre || 'RSET Main Campus, Block C';
  const semester = currentStudent.semester || 'S5';
  const examMonth = data?.examMonth || 'OCTOBER';
  const examYear = data?.examYear || '2026';
  const badgeTitle = data?.badgeTitle || `HALL TICKET — B.TECH ${semester} REGULAR EXAMINATION (${examMonth} ${examYear})`;

  return (
    <div className="page-body">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="glass-card no-print" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#eef2ff', color: '#4f46e5', borderRadius: '14px' }}>
              <FileText size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  End Semester Examination Hall Ticket
                </h1>
                <span className="badge badge-safe">Eligible & Approved</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
                Official Examination Admit Card issued by Office of the Controller of Examinations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-outline"
              onClick={fetchHallTicket}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              title="Refresh Hall Ticket data from database"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={18} />
              <span>Print Hall Ticket</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={18} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="card" style={{ maxWidth: '850px', margin: '40px auto', textAlign: 'center', padding: '60px' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Retrieving Official Hall Ticket...</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
            Verifying course registration and examination seat allocation from SQLite database.
          </p>
        </div>
      ) : error ? (
        <div className="card" style={{ maxWidth: '850px', margin: '40px auto', textAlign: 'center', padding: '40px', borderColor: '#fecaca' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px', color: '#ef4444' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b' }}>{error}</h3>
          <button className="btn btn-primary" onClick={fetchHallTicket} style={{ marginTop: '16px' }}>
            Try Again
          </button>
        </div>
      ) : (
        /* Hall Ticket Official Document Layout */
        <div
          id="official-hall-ticket-doc"
          className="card hall-ticket-document"
          style={{
            maxWidth: '850px',
            margin: '0 auto 40px',
            padding: '36px 40px',
            background: '#ffffff',
            border: '2px solid #0f172a',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}
        >
          {/* Document Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '22px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 2px 0' }}>
              RAJAGIRI SCHOOL OF ENGINEERING & TECHNOLOGY
            </h2>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '1px', marginBottom: '4px' }}>
              (AUTONOMOUS)
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
              Affiliated to APJ Abdul Kalam Technological University • Rajagiri Valley, Kakkanad, Kochi – 682039
            </div>

            <div
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '6px 20px',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.88rem',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              {badgeTitle}
            </div>
          </div>

          {/* Student Identification Section */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '26px',
              padding: '18px 22px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
            }}
          >
            {/* Left Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '16px', rowGap: '10px', fontSize: '0.88rem', flex: 1, minWidth: '280px' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Candidate Name:</span>
              <span style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>{currentStudent.name}</span>

              <span style={{ fontWeight: 700, color: '#475569' }}>Register / UID:</span>
              <span style={{ fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>{currentStudent.uid}</span>

              <span style={{ fontWeight: 700, color: '#475569' }}>Branch / Dept:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{currentStudent.department}</span>

              <span style={{ fontWeight: 700, color: '#475569' }}>Semester & Section:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {currentStudent.class || `${semester} CSE A`}
              </span>

              <span style={{ fontWeight: 700, color: '#475569' }}>Examination Centre:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{examCentre}</span>
            </div>

            {/* Right Photo & Signature Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '125px' }}>
              {/* Photo Box */}
              <div
                style={{
                  width: '105px',
                  height: '125px',
                  border: '1.5px solid #334155',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  position: 'relative',
                }}
              >
                <img
                  src={currentStudent.photo && !currentStudent.photo.includes('student_brinda') ? currentStudent.photo : defaultStudentAvatar}
                  alt={`Photograph of ${currentStudent.name}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = defaultStudentAvatar;
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Signature Box */}
              <div
                style={{
                  width: '130px',
                  height: '44px',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  padding: '2px 8px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="digital-signature-font"
                  style={{
                    fontSize: '1.35rem',
                    color: '#1e3a8a',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentStudent.signature || currentStudent.name || 'Brinda Raj'}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Candidate Signature
              </span>
            </div>
          </div>

          {/* Schedule of Courses Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Schedule of Courses & Examination Dates
            </h4>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table" style={{ border: '1.5px solid #0f172a' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #0f172a' }}>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>DATE & DAY</th>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>SESSION TIME</th>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>COURSE CODE</th>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem' }}>COURSE TITLE</th>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>HALL NO</th>
                    <th style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center', whiteSpace: 'nowrap' }}>INVIGILATOR SIGN</th>
                  </tr>
                </thead>
                <tbody>
                  {examinations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No examination dates scheduled yet for Semester {semester}.
                      </td>
                    </tr>
                  ) : (
                    examinations.map((exam) => (
                      <tr key={exam.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {exam.date}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {exam.sessionTime}
                        </td>
                        <td style={{ fontWeight: 800, color: '#1e3a8a', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {exam.courseCode}
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                          {exam.courseTitle}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {exam.hallNo}
                        </td>
                        <td style={{ width: '110px', borderLeft: '1px solid #cbd5e1', background: '#fcfcfc' }}>
                          {/* Empty space for physical invigilator signature during examination */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Controller of Examinations Seal & Signatures */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '32px 0 24px',
              padding: '0 12px',
            }}
          >
            {/* Circular Official Seal */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '2px dashed #1e3a8a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e3a8a',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  lineHeight: '1.2',
                  margin: '0 auto 6px',
                  background: 'rgba(238, 242, 255, 0.4)',
                }}
              >
                <span>OFFICIAL</span>
                <span>SEAL</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>RSET Autonomous</div>
            </div>

            {/* Controller of Examinations Signature */}
            <div style={{ textAlign: 'center' }}>
              <div
                className="digital-signature-font"
                style={{
                  fontSize: '1.5rem',
                  color: '#0f172a',
                  marginBottom: '4px',
                  fontWeight: 600,
                }}
              >
                Dr. Vinod Kumar P.
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Controller of Examinations
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Rajagiri School of Engineering & Technology
              </div>
            </div>
          </div>

          {/* Instructions for Candidates */}
          <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '16px' }}>
            <h5
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              INSTRUCTIONS TO CANDIDATES:
            </h5>
            <ol
              style={{
                fontSize: '0.78rem',
                color: '#334155',
                paddingLeft: '18px',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              <li>Candidates must occupy their allotted seats in the exam hall at least 15 minutes before the commencement of the examination.</li>
              <li>No candidate will be admitted to the examination hall without this official Hall Ticket and College Identity Card.</li>
              <li>Mobile phones, programmable calculators, smart watches and other unauthorized materials are strictly prohibited.</li>
              <li>Candidates are permitted to leave the examination hall only after 1 hour and 30 minutes from the start of the examination.</li>
              <li>Exchange of calculators, stationery items, or log tables inside the examination hall is strictly prohibited.</li>
              <li>Strict disciplinary action will be initiated under KTU malpractice regulations for any unauthorized assistance.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
