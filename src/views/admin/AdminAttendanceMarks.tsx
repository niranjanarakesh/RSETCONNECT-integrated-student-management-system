import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  GraduationCap,
  Save,
  CheckCircle,
  RefreshCw,
  Calendar,
  Layers,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock
} from 'lucide-react';
import { Student, SubjectMarks } from '../../types.js';
import { getInitials } from '../../utils.js';

interface ClassStudentAttendance {
  uid: string;
  name: string;
  class: string;
  semester: string;
  email: string;
  photo?: string;
  status: 'Present' | 'Absent' | 'Duty Leave';
  isAlreadyMarked?: boolean;
}

interface SubjectItem {
  id: number;
  code: string;
  name: string;
  teacher: string;
  semester: string;
  credits: number;
}

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

export const AdminAttendanceMarks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'subjects'>('attendance');

  // Attendance Sheet Filter State
  const [classesList, setClassesList] = useState<string[]>(['S5 CSE A']);
  const [selectedClass, setSelectedClass] = useState<string>('S5 CSE A');
  const [selectedSemester, setSelectedSemester] = useState<string>('S5');
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(3);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-05');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // Class Sheet Data
  const [classStudents, setClassStudents] = useState<ClassStudentAttendance[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Marks Tab State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>('RSET2024CSE001');
  const [marksList, setMarksList] = useState<SubjectMarks[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [marksSemesterFilter, setMarksSemesterFilter] = useState<string>('All');

  // Subject Management State
  const [allSubjectsList, setAllSubjectsList] = useState<SubjectItem[]>([]);
  const [subjectFilterSemester, setSubjectFilterSemester] = useState<string>('All');
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    teacher: '',
    semester: 'S5',
    credits: 3,
  });

  // 1. Initial Load: Classes and Student list
  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, stRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/students'),
        ]);

        if (clsRes.ok) {
          const cls = await clsRes.json();
          setClassesList(cls);
          if (cls.length > 0) setSelectedClass(cls[0]);
        }

        if (stRes.ok) {
          const stList = await stRes.json();
          setStudents(stList);
          if (stList.length > 0) setSelectedStudentUid(stList[0].uid);
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // 2. Load subjects whenever selectedSemester changes
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch(`/api/subjects?semester=${selectedSemester}`);
        if (res.ok) {
          const subs: SubjectItem[] = await res.json();
          setSubjectsList(subs);
          if (subs.length > 0) {
            const match = subs.find((s) => s.id === selectedSubjectId);
            setSelectedSubjectId(match ? match.id : subs[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      }
    }
    loadSubjects();
  }, [selectedSemester]);

  // Load all subjects for the subjects management tab
  const fetchAllSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const subs: SubjectItem[] = await res.json();
        setAllSubjectsList(subs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchAllSubjects();
    }
  }, [activeTab]);

  // 3. Fetch Class Attendance Sheet for selected (Class, Semester, Subject, Date, Period)
  const fetchClassSheet = async () => {
    if (!selectedClass || !selectedSemester || !selectedSubjectId || !selectedDate) return;
    setLoadingSheet(true);
    setSaveMsg(null);

    try {
      const res = await fetch(
        `/api/attendance/class-sheet?class=${encodeURIComponent(selectedClass)}&semester=${encodeURIComponent(selectedSemester)}&subject_id=${selectedSubjectId}&date=${selectedDate}&period=${selectedPeriod}`
      );
      if (res.ok) {
        const data = await res.json();
        setClassStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load class sheet:', err);
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && selectedSubjectId) {
      fetchClassSheet();
    }
  }, [selectedClass, selectedSemester, selectedSubjectId, selectedDate, selectedPeriod, activeTab]);

  // 4. Update a student's status in the local sheet
  const handleStatusChange = (uid: string, newStatus: 'Present' | 'Absent' | 'Duty Leave') => {
    setClassStudents((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, status: newStatus } : s))
    );
  };

  // Bulk actions: Mark all as Present, Absent, or Duty Leave
  const handleBulkStatus = (status: 'Present' | 'Absent' | 'Duty Leave') => {
    setClassStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  // 5. Save Class Attendance to SQLite
  const handleSaveAttendance = async () => {
    if (!selectedSubjectId || classStudents.length === 0) return;
    setSavingAttendance(true);
    setSaveMsg(null);

    try {
      const payload = {
        class: selectedClass,
        semester: selectedSemester,
        subject_id: selectedSubjectId,
        date: selectedDate,
        period: selectedPeriod,
        records: classStudents.map((s) => ({
          student_uid: s.uid,
          status: s.status,
        })),
      };

      const res = await fetch('/api/attendance/class-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setSaveMsg({ type: 'success', text: result.message || '✓ Attendance saved successfully.' });
        fetchClassSheet();
      } else {
        setSaveMsg({ type: 'error', text: result.message || 'Failed to save attendance.' });
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Network error while saving attendance.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // 6. Marks Mode Handlers
  const fetchStudentMarks = async () => {
    if (!selectedStudentUid) return;
    setLoadingMarks(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentUid}/marks`);
      if (res.ok) {
        const data = await res.json();
        setMarksList(data.subjects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMarks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'marks') {
      fetchStudentMarks();
    }
  }, [selectedStudentUid, activeTab]);

  const handleSaveMarksRow = async (row: SubjectMarks) => {
    try {
      const res = await fetch('/api/admin/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_uid: selectedStudentUid,
          subject_id: row.subject_id,
          internal1: row.internal1,
          internal2: row.internal2,
          assignment: row.assignment,
          project: row.project,
        }),
      });
      if (res.ok) {
        setSaveMsg({ type: 'success', text: `✓ Updated continuous assessment marks for ${row.subject_name}` });
        fetchStudentMarks();
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Failed to update marks' });
    }
  };

  // 7. Subject CRUD handlers
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        const res = await fetch(`/api/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectFormData),
        });
        if (res.ok) {
          setSaveMsg({ type: 'success', text: `✓ Updated subject ${subjectFormData.code}` });
          setEditingSubject(null);
          fetchAllSubjects();
        }
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectFormData),
        });
        if (res.ok) {
          setSaveMsg({ type: 'success', text: `✓ Added new subject ${subjectFormData.code}` });
          setIsAddingSubject(false);
          setSubjectFormData({ code: '', name: '', teacher: '', semester: 'S5', credits: 3 });
          fetchAllSubjects();
        }
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Failed to save subject' });
    }
  };

  const handleDeleteSubject = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete ${code}?`)) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSaveMsg({ type: 'success', text: `✓ Deleted subject ${code}` });
        fetchAllSubjects();
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Failed to delete subject' });
    }
  };

  // Filtered marks list for selected student
  const filteredMarks = marksSemesterFilter === 'All'
    ? marksList
    : marksList.filter((m) => m.semester === marksSemesterFilter);

  // Filtered subjects list for subjects tab
  const filteredSubjectsList = subjectFilterSemester === 'All'
    ? allSubjectsList
    : allSubjectsList.filter((s) => s.semester === subjectFilterSemester);

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Operations Portal
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
              Attendance, Marks & Curriculum
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
              Record daily lecture attendance, enter Continuous Assessment marks, and manage semester course catalogs
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('attendance')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserCheck size={16} />
              <span>Attendance Sheet</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'marks' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('marks')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GraduationCap size={16} />
              <span>Assessment Marks</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('subjects')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={16} />
              <span>Course Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Save Banner */}
      {saveMsg && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: saveMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${saveMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: saveMsg.type === 'success' ? '#065f46' : '#991b1b',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {saveMsg.type === 'success' ? <CheckCircle2 size={20} color="#059669" /> : <AlertCircle size={20} color="#dc2626" />}
          <span>{saveMsg.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: ATTENDANCE SHEET ENTRY */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <>
          {/* Controls Card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Class
                </label>
                <select
                  className="select-field"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Semester
                </label>
                <select
                  className="select-field"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem.replace('S', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Subject
                </label>
                <select
                  className="select-field"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                >
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Class Hour / Period
                </label>
                <select
                  className="select-field"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                >
                  <option value={1}>Period 1 (08:30 - 09:25)</option>
                  <option value={2}>Period 2 (09:30 - 10:25)</option>
                  <option value={3}>Period 3 (10:40 - 11:35)</option>
                  <option value={4}>Period 4 (11:40 - 12:35)</option>
                  <option value={5}>Period 5 (01:30 - 02:25)</option>
                  <option value={6}>Period 6 (02:30 - 03:25)</option>
                  <option value={7}>Period 7 (03:30 - 04:20)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Attendance Roster ({classStudents.length} Students)
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleBulkStatus('Present')}
                  style={{ color: '#059669', borderColor: '#a7f3d0' }}
                >
                  All Present
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleBulkStatus('Absent')}
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                >
                  All Absent
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || classStudents.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Class</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((st) => (
                    <tr key={st.uid}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{st.uid}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{st.class}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(['Present', 'Absent', 'Duty Leave'] as const).map((status) => {
                            const isSelected = st.status === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(st.uid, status)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: isSelected
                                    ? status === 'Present'
                                      ? '1.5px solid #059669'
                                      : status === 'Absent'
                                      ? '1.5px solid #dc2626'
                                      : '1.5px solid #d97706'
                                    : '1px solid #e2e8f0',
                                  background: isSelected
                                    ? status === 'Present'
                                      ? '#ecfdf5'
                                      : status === 'Absent'
                                      ? '#fef2f2'
                                      : '#fffbeb'
                                    : '#ffffff',
                                  color: isSelected
                                    ? status === 'Present'
                                      ? '#065f46'
                                      : status === 'Absent'
                                      ? '#991b1b'
                                      : '#92400e'
                                    : '#64748b',
                                }}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CONTINUOUS ASSESSMENT (MARKS) ENTRY */}
      {/* ========================================================================= */}
      {activeTab === 'marks' && (
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Continuous Assessment Marks Entry
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Enter Series Tests (Internal 1 & 2), Assignment, and Project components
              </p>
            </div>

            {/* Student Selector */}
            <div style={{ minWidth: '260px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Select Student
              </label>
              <select
                className="select-field"
                value={selectedStudentUid}
                onChange={(e) => setSelectedStudentUid(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.name} ({s.uid})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester Filter Pills in Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Filter Semester:
            </span>
            {['All', ...SEMESTERS].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setMarksSemesterFilter(sem)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: marksSemesterFilter === sem ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  background: marksSemesterFilter === sem ? '#4f46e5' : '#ffffff',
                  color: marksSemesterFilter === sem ? '#ffffff' : '#475569',
                }}
              >
                {sem}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code & Title</th>
                  <th>Semester</th>
                  <th>Internal 1 (30)</th>
                  <th>Internal 2 (30)</th>
                  <th>Assignment (10)</th>
                  <th>Project (10)</th>
                  <th>Total (80)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((row, idx) => {
                  const rawI1 = row.internal1;
                  const rawI2 = row.internal2;
                  const rawAssign = row.assignment;
                  const rawProj = row.project;

                  const hasAll = rawI1 !== null && rawI2 !== null && rawAssign !== null && rawProj !== null;
                  const tot = hasAll ? (rawI1 || 0) + (rawI2 || 0) + (rawAssign || 0) + (rawProj || 0) : null;

                  return (
                    <tr key={row.subject_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#4f46e5' }}>{row.code}</div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.subject_name}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                          {row.semester || 'S5'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          className="input-field"
                          placeholder="—"
                          value={row.internal1 === null || row.internal1 === undefined ? '' : row.internal1}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.min(30, Math.max(0, parseInt(e.target.value) || 0));
                            const updated = [...marksList];
                            const targetIdx = marksList.findIndex((m) => m.subject_id === row.subject_id);
                            if (targetIdx >= 0) {
                              updated[targetIdx].internal1 = val;
                              setMarksList(updated);
                            }
                          }}
                          style={{ width: '75px', padding: '6px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          className="input-field"
                          placeholder="—"
                          value={row.internal2 === null || row.internal2 === undefined ? '' : row.internal2}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.min(30, Math.max(0, parseInt(e.target.value) || 0));
                            const updated = [...marksList];
                            const targetIdx = marksList.findIndex((m) => m.subject_id === row.subject_id);
                            if (targetIdx >= 0) {
                              updated[targetIdx].internal2 = val;
                              setMarksList(updated);
                            }
                          }}
                          style={{ width: '75px', padding: '6px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className="input-field"
                          placeholder="—"
                          value={row.assignment === null || row.assignment === undefined ? '' : row.assignment}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                            const updated = [...marksList];
                            const targetIdx = marksList.findIndex((m) => m.subject_id === row.subject_id);
                            if (targetIdx >= 0) {
                              updated[targetIdx].assignment = val;
                              setMarksList(updated);
                            }
                          }}
                          style={{ width: '75px', padding: '6px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className="input-field"
                          placeholder="—"
                          value={row.project === null || row.project === undefined ? '' : row.project}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                            const updated = [...marksList];
                            const targetIdx = marksList.findIndex((m) => m.subject_id === row.subject_id);
                            if (targetIdx >= 0) {
                              updated[targetIdx].project = val;
                              setMarksList(updated);
                            }
                          }}
                          style={{ width: '75px', padding: '6px 8px' }}
                        />
                      </td>
                      <td>
                        {tot !== null ? (
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                            {tot} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ 80</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 12px' }}
                          onClick={() => handleSaveMarksRow(row)}
                        >
                          <Save size={14} />
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CURRICULUM & SUBJECT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Curriculum & Subject Catalog
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Add courses, adjust credits, or move subjects between semesters (S1–S8)
              </p>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingSubject(null);
                setSubjectFormData({ code: '', name: '', teacher: '', semester: 'S5', credits: 3 });
                setIsAddingSubject(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Filter by semester */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Filter Semester:
            </span>
            {['All', ...SEMESTERS].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSubjectFilterSemester(sem)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: subjectFilterSemester === sem ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  background: subjectFilterSemester === sem ? '#4f46e5' : '#ffffff',
                  color: subjectFilterSemester === sem ? '#ffffff' : '#475569',
                }}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* Add / Edit Form Modal or Inline */}
          {(isAddingSubject || editingSubject) && (
            <form
              onSubmit={handleSaveSubject}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #c7d2fe',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                  {editingSubject ? `Edit Subject: ${editingSubject.code}` : 'Add New Subject'}
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsAddingSubject(false);
                    setEditingSubject(null);
                  }}
                  style={{ padding: '4px 8px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CST301"
                    className="input-field"
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Course Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Formal Languages & Automata"
                    className="input-field"
                    value={subjectFormData.name}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Assigned Faculty</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Priya S."
                    className="input-field"
                    value={subjectFormData.teacher}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, teacher: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Semester</label>
                  <select
                    className="select-field"
                    value={subjectFormData.semester}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: e.target.value })}
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem.replace('S', '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    className="input-field"
                    value={subjectFormData.credits}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsAddingSubject(false);
                    setEditingSubject(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} />
                  <span>{editingSubject ? 'Update Subject' : 'Save Subject'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Subjects Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjectsList.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#4f46e5' }}>{sub.code}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{sub.name}</span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: '0.88rem' }}>{sub.teacher}</span>
                    </td>
                    <td>
                      <span className="badge badge-safe" style={{ fontWeight: 700 }}>
                        {sub.semester}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{sub.credits} Credits</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          onClick={() => {
                            setIsAddingSubject(false);
                            setEditingSubject(sub);
                            setSubjectFormData({
                              code: sub.code,
                              name: sub.name,
                              teacher: sub.teacher,
                              semester: sub.semester,
                              credits: sub.credits,
                            });
                          }}
                          title="Edit Course"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: '#dc2626', borderColor: '#fecaca' }}
                          onClick={() => handleDeleteSubject(sub.id, sub.code)}
                          title="Delete Course"
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
      )}
    </div>
  );
};
