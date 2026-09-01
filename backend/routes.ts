import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, execute } from './db.js';

const router = express.Router();

// Configure Multer for certificate uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==================== AUTHENTICATION ====================
router.post('/login', (req: Request, res: Response) => {
  const { role, uid, username, password } = req.body;

  if (role === 'admin') {
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        role: 'admin',
        user: {
          username: 'admin',
          name: 'Prof. K. Santhosh (HOD CSE / Admin)',
          role: 'Faculty / Admin',
        },
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid Admin credentials' });
  }

  // Student login: Support login with either College UID (RSET2024CSE001) OR Institutional Email (rset2024cse001@rajagiri.edu.in)
  const lookupKey = (uid || '').trim();
  const student = queryOne(
    'SELECT * FROM students WHERE (LOWER(uid) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password = ?',
    [lookupKey, lookupKey, password]
  );

  if (student) {
    return res.json({
      success: true,
      role: 'student',
      user: student,
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid Student UID/Email or Password' });
});

// Quick Student Lookup by Email or UID (for Google / SSO or quick switch)
router.get('/auth/student-lookup', (req: Request, res: Response) => {
  const identifier = (req.query.identifier as string || '').trim();
  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required.' });
  }

  const student = queryOne(
    'SELECT * FROM students WHERE LOWER(email) = LOWER(?) OR LOWER(uid) = LOWER(?)',
    [identifier, identifier]
  );

  if (student) {
    return res.json({ success: true, student });
  }

  return res.status(404).json({ success: false, message: 'No student found with this email or UID.' });
});

// ==================== STUDENTS ====================
// Get all students (Admin search / list)
const handleGetStudents = (req: Request, res: Response) => {
  const { search, class: className } = req.query;
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params: any[] = [];

  if (className && className !== 'All') {
    sql += ' AND class = ?';
    params.push(className);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR uid LIKE ? OR class LIKE ? OR email LIKE ?)';
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
  }

  sql += ' ORDER BY uid ASC';
  const students = queryAll(sql, params);

  // Compute live attendance percentage for each student
  const studentsWithStats = students.map((s) => {
    const attStats = queryOne<{ present: number; total: number }>(
      'SELECT SUM(present_classes) as present, SUM(total_classes) as total FROM attendance WHERE student_uid = ?',
      [s.uid]
    );
    const present = attStats?.present || 0;
    const total = attStats?.total || 1;
    const attPercentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    return {
      ...s,
      attendancePercentage: attPercentage,
      totalPresent: present,
      totalClasses: total,
    };
  });

  res.json(studentsWithStats);
};

router.get('/students', handleGetStudents);
router.get('/admin/students', handleGetStudents);

// Get single student profile with summary
const handleGetStudentByUid = (req: Request, res: Response) => {
  const { uid } = req.params;
  const student = queryOne('SELECT * FROM students WHERE uid = ?', [uid]);
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  // Attendance stats
  const attStats = queryOne<{ present: number; total: number }>(
    'SELECT SUM(present_classes) as present, SUM(total_classes) as total FROM attendance WHERE student_uid = ?',
    [uid]
  );
  const present = attStats?.present || 0;
  const total = attStats?.total || 1;
  const attendancePercentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  // Activity points stats
  const approvedPoints = queryOne<{ total: number }>(
    "SELECT SUM(points) as total FROM activities WHERE student_uid = ? AND status = 'Approved'",
    [uid]
  );
  const pendingCount = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM activities WHERE student_uid = ? AND status = 'Pending'",
    [uid]
  );

  res.json({
    ...student,
    attendancePercentage: parseFloat(attendancePercentage),
    totalPresent: present,
    totalClasses: total,
    activityPoints: approvedPoints?.total || 0,
    pendingActivities: pendingCount?.count || 0,
  });
};

router.get('/students/:uid', handleGetStudentByUid);
router.get('/admin/students/:uid', handleGetStudentByUid);

// Create student
const handleCreateStudent = (req: Request, res: Response) => {
  const { uid, name, email, phone, gender, department, semester, class: studentClass, cgpa, completed_credits, signature } = req.body;
  if (!uid || !name) {
    return res.status(400).json({ message: 'Student UID and name are required.' });
  }

  const existing = queryOne('SELECT uid FROM students WHERE uid = ?', [uid]);
  if (existing) {
    return res.status(400).json({ message: `Student with UID ${uid} already exists.` });
  }

  const studentEmail = email || `${uid.toLowerCase()}@rajagiri.edu.in`;
  const studentPhone = phone || '+91 98470 12345';
  const studentGender = gender || 'Female';
  const studentDept = department || 'Computer Science & Engineering';
  const studentSem = semester || 'S5';
  const studentCls = studentClass || 'S5 CSE A';
  const studentCgpa = cgpa !== undefined ? Number(cgpa) : 8.5;
  const studentCredits = completed_credits !== undefined ? Number(completed_credits) : 84;
  const studentSig = signature || name;

  execute(
    `INSERT INTO students (uid, password, name, class, email, phone, gender, cgpa, completed_credits, department, semester, signature)
     VALUES (?, 'student123', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uid, name, studentCls, studentEmail, studentPhone, studentGender, studentCgpa, studentCredits, studentDept, studentSem, studentSig]
  );

  const created = queryOne('SELECT * FROM students WHERE uid = ?', [uid]);
  res.json({ success: true, message: 'Student created successfully.', student: created });
};

router.post('/students', handleCreateStudent);
router.post('/admin/students', handleCreateStudent);

// Update student profile
const handleUpdateStudent = (req: Request, res: Response) => {
  const { uid } = req.params;
  const { name, email, phone, gender, department, semester, class: studentClass, cgpa, completed_credits, signature } = req.body;

  execute(
    `UPDATE students 
     SET name = COALESCE(?, name), 
         email = COALESCE(?, email), 
         phone = COALESCE(?, phone), 
         gender = COALESCE(?, gender), 
         department = COALESCE(?, department), 
         semester = COALESCE(?, semester), 
         class = COALESCE(?, class),
         cgpa = COALESCE(?, cgpa),
         completed_credits = COALESCE(?, completed_credits),
         signature = COALESCE(?, signature)
     WHERE uid = ?`,
    [name, email, phone, gender, department, semester, studentClass, cgpa, completed_credits, signature, uid]
  );

  const updated = queryOne('SELECT * FROM students WHERE uid = ?', [uid]);
  res.json({ success: true, message: 'Profile updated successfully', student: updated });
};

router.put('/students/:uid', handleUpdateStudent);
router.put('/admin/students/:uid', handleUpdateStudent);

// Delete student
const handleDeleteStudent = (req: Request, res: Response) => {
  const { uid } = req.params;
  execute('DELETE FROM marks WHERE student_uid = ?', [uid]);
  execute('DELETE FROM attendance WHERE student_uid = ?', [uid]);
  execute('DELETE FROM attendance_records WHERE student_uid = ?', [uid]);
  execute('DELETE FROM activities WHERE student_uid = ?', [uid]);
  execute('DELETE FROM students WHERE uid = ?', [uid]);
  res.json({ success: true, message: `Student ${uid} deleted successfully.` });
};

router.delete('/students/:uid', handleDeleteStudent);
router.delete('/admin/students/:uid', handleDeleteStudent);

// ==================== METADATA & UTILITIES ====================
// Get distinct classes from students in SQLite
router.get('/classes', (req: Request, res: Response) => {
  const rows = queryAll<{ class: string }>('SELECT DISTINCT class FROM students WHERE class IS NOT NULL AND class != "" ORDER BY class ASC');
  const classes = rows.map((r) => r.class);
  if (classes.length === 0) classes.push('S5 CSE A');
  res.json(classes);
});

// Get distinct semesters
router.get('/semesters', (req: Request, res: Response) => {
  res.json(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']);
});

// Get subjects list with optional semester filter
router.get('/subjects', (req: Request, res: Response) => {
  const { semester } = req.query;
  let sql = 'SELECT * FROM subjects';
  const params: any[] = [];
  if (semester && semester !== 'All') {
    sql += ' WHERE semester = ?';
    params.push(semester);
  }
  sql += ' ORDER BY id ASC';
  const subjects = queryAll(sql, params);
  res.json(subjects);
});

// ==================== ATTENDANCE ====================
function formatMonthYear(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  } catch (e) {
    return 'AUGUST 2026';
  }
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Get student aggregate attendance across subjects for a given semester
router.get('/students/:uid/attendance', (req: Request, res: Response) => {
  const { uid } = req.params;
  const semester = (req.query.semester as string) || 'S5';

  const subjects = queryAll<{ id: number; code: string; name: string; teacher: string; credits: number; semester: string }>(
    'SELECT * FROM subjects WHERE semester = ? ORDER BY id ASC',
    [semester]
  );

  let totalClassesAll = 0;
  let totalPresentAll = 0;
  let totalAbsentAll = 0;
  let totalDutyLeaveAll = 0;

  const subjectsWithStats = subjects.map((s) => {
    // Query detailed attendance_records for this student & subject in this semester
    const recs = queryAll<{ id: number; date: string; status: string }>(
      'SELECT id, date, status FROM attendance_records WHERE student_uid = ? AND subject_id = ? AND semester = ? ORDER BY date ASC',
      [uid, s.id, semester]
    );

    let present = 0;
    let absent = 0;
    let dutyLeave = 0;
    let total = recs.length;

    if (total > 0) {
      for (const r of recs) {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Duty Leave') dutyLeave++;
      }
    } else {
      // Fallback to summary table
      const fallback = queryOne<{ present_classes: number; total_classes: number; absent_classes?: number; duty_leave_classes?: number }>(
        'SELECT present_classes, total_classes, absent_classes, duty_leave_classes FROM attendance WHERE student_uid = ? AND subject_id = ?',
        [uid, s.id]
      );
      if (fallback && fallback.total_classes > 0) {
        present = fallback.present_classes || 0;
        total = fallback.total_classes || 0;
        dutyLeave = fallback.duty_leave_classes || 0;
        absent = fallback.absent_classes || Math.max(0, total - (present + dutyLeave));
      }
    }

    const effectivePresent = present + dutyLeave;
    const percentage = total > 0 ? parseFloat(((effectivePresent / total) * 100).toFixed(1)) : 0;

    totalClassesAll += total;
    totalPresentAll += present;
    totalAbsentAll += absent;
    totalDutyLeaveAll += dutyLeave;

    let status = 'Safe';
    if (total === 0) {
      status = 'No Data';
    } else if (percentage < 75) {
      status = 'Below Requirement';
    } else if (percentage < 80) {
      status = 'Warning';
    }

    // Exceptions list: ONLY Absent and Duty Leave
    const exceptions = recs
      .filter((r) => r.status === 'Absent' || r.status === 'Duty Leave')
      .map((r) => ({
        id: r.id,
        date: r.date,
        formattedDate: formatDateDisplay(r.date),
        monthYear: formatMonthYear(r.date),
        status: r.status as 'Absent' | 'Duty Leave',
      }));

    return {
      subject_id: s.id,
      code: s.code,
      subject_name: s.name,
      teacher: s.teacher,
      credits: s.credits,
      semester: s.semester,
      total_classes: total,
      present_classes: present,
      absent_classes: absent,
      duty_leave_classes: dutyLeave,
      effective_present: effectivePresent,
      percentage,
      status,
      exceptions,
    };
  });

  const totalEffectiveAll = totalPresentAll + totalDutyLeaveAll;
  const overallPercentage = totalClassesAll > 0 ? parseFloat(((totalEffectiveAll / totalClassesAll) * 100).toFixed(1)) : 0;

  res.json({
    semester,
    hasRecords: totalClassesAll > 0,
    subjects: subjectsWithStats,
    overall: {
      totalClasses: totalClassesAll,
      present: totalPresentAll,
      absent: totalAbsentAll,
      dutyLeave: totalDutyLeaveAll,
      effectivePresent: totalEffectiveAll,
      percentage: overallPercentage,
      status: totalClassesAll === 0 ? 'No Data' : overallPercentage >= 80 ? 'Safe' : overallPercentage >= 75 ? 'Warning' : 'Below Requirement',
    },
  });
});

// Get student daily / period-wise attendance records for a given semester & month
router.get('/students/:uid/attendance/daily', (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const semester = (req.query.semester as string) || 'S5';
    let month = req.query.month as string; // e.g. "2026-08"

    // 1. Get available distinct months for this student & semester
    let availableMonthsRows: { month_str: string }[] = [];
    try {
      availableMonthsRows = queryAll<{ month_str: string }>(
        "SELECT DISTINCT SUBSTR(date, 1, 7) as month_str FROM attendance_records WHERE student_uid = ? AND semester = ? ORDER BY month_str ASC",
        [uid, semester]
      );
    } catch (e) {
      console.warn('Could not query distinct months:', e);
    }

    const availableMonths = availableMonthsRows
      .filter((r) => r && r.month_str && r.month_str.includes('-'))
      .map((r) => {
        const [y, m] = r.month_str.split('-');
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return { value: r.month_str, label };
      });

    // If no month is selected or requested month not in available, select the best default
    if (!month || !month.includes('-') || (availableMonths.length > 0 && !availableMonths.some((m) => m.value === month))) {
      if (availableMonths.some((m) => m.value === '2026-08')) {
        month = '2026-08';
      } else if (availableMonths.length > 0) {
        month = availableMonths[availableMonths.length - 1].value;
      } else {
        month = '2026-08';
      }
    }

    // 2. Fetch all attendance records for this student, semester, and month
    let records: {
      record_id: number;
      date: string;
      period: number;
      status: 'Present' | 'Absent' | 'Duty Leave';
      subject_id: number;
      code: string;
      name: string;
      teacher: string;
    }[] = [];

    try {
      records = queryAll<{
        record_id: number;
        date: string;
        period: number;
        status: 'Present' | 'Absent' | 'Duty Leave';
        subject_id: number;
        code: string;
        name: string;
        teacher: string;
      }>(
        `SELECT 
           ar.id as record_id,
           ar.date,
           COALESCE(ar.period, 1) as period,
           ar.status,
           ar.subject_id,
           s.code,
           s.name,
           s.teacher
         FROM attendance_records ar
         JOIN subjects s ON ar.subject_id = s.id
         WHERE ar.student_uid = ? AND ar.semester = ? AND ar.date LIKE ?
         ORDER BY ar.date ASC, ar.period ASC`,
        [uid, semester, `${month}%`]
      );
    } catch (queryErr) {
      console.error('Error querying attendance records for daily log:', queryErr);
      // Fallback query without period column if migration is pending
      records = queryAll<{
        record_id: number;
        date: string;
        period: number;
        status: 'Present' | 'Absent' | 'Duty Leave';
        subject_id: number;
        code: string;
        name: string;
        teacher: string;
      }>(
        `SELECT 
           ar.id as record_id,
           ar.date,
           1 as period,
           ar.status,
           ar.subject_id,
           s.code,
           s.name,
           s.teacher
         FROM attendance_records ar
         JOIN subjects s ON ar.subject_id = s.id
         WHERE ar.student_uid = ? AND ar.semester = ? AND ar.date LIKE ?
         ORDER BY ar.date ASC`,
        [uid, semester, `${month}%`]
      );
    }

    // Group records by date
    const dayMap = new Map<string, typeof records>();
    for (const r of records) {
      if (!dayMap.has(r.date)) {
        dayMap.set(r.date, []);
      }
      dayMap.get(r.date)!.push(r);
    }

    const days: any[] = [];
    let monthPresent = 0;
    let monthAbsent = 0;
    let monthDutyLeave = 0;
    let monthTotal = 0;

    for (const [dateStr, dayRecords] of dayMap.entries()) {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const shortDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      // Initialize 7 periods with null
      const periods: any[] = [null, null, null, null, null, null, null];
      let dayPresent = 0;
      let dayAbsent = 0;
      let dayDutyLeave = 0;

      for (const r of dayRecords) {
        const pNum = Number(r.period) || 1;
        if (pNum >= 1 && pNum <= 7) {
          periods[pNum - 1] = {
            period: pNum,
            subjectId: r.subject_id,
            courseCode: r.code,
            courseName: r.name,
            teacher: r.teacher,
            status: r.status,
            recordId: r.record_id,
            date: r.date,
          };

          if (r.status === 'Present') {
            dayPresent++;
            monthPresent++;
          } else if (r.status === 'Absent') {
            dayAbsent++;
            monthAbsent++;
          } else if (r.status === 'Duty Leave') {
            dayDutyLeave++;
            monthDutyLeave++;
          }
          monthTotal++;
        }
      }

      days.push({
        date: dateStr,
        formattedDate,
        dayOfWeek,
        shortDate,
        periods,
        summary: {
          present: dayPresent,
          absent: dayAbsent,
          dutyLeave: dayDutyLeave,
          total: dayPresent + dayAbsent + dayDutyLeave,
        },
      });
    }

    // Calculate month summary
    const effectiveAttended = monthPresent + monthDutyLeave;
    const monthPercentage = monthTotal > 0 ? parseFloat(((effectiveAttended / monthTotal) * 100).toFixed(1)) : 0;

    // Calculate semester overall
    let semTotal = 0;
    let semPresent = 0;
    let semAbsent = 0;
    let semDuty = 0;

    try {
      const semesterAgg = queryOne<{ total: number; present: number; absent: number; duty: number }>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
           SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
           SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) as duty
         FROM attendance_records
         WHERE student_uid = ? AND semester = ?`,
        [uid, semester]
      );
      semTotal = semesterAgg?.total || 0;
      semPresent = semesterAgg?.present || 0;
      semAbsent = semesterAgg?.absent || 0;
      semDuty = semesterAgg?.duty || 0;
    } catch (e) {
      console.warn('Could not query semester aggregates:', e);
    }

    const semEffective = semPresent + semDuty;
    const semPct = semTotal > 0 ? parseFloat(((semEffective / semTotal) * 100).toFixed(1)) : 0;

    let selectedMonthName = month;
    if (month && month.includes('-')) {
      const [selYear, selMo] = month.split('-');
      const selDateObj = new Date(parseInt(selYear, 10), parseInt(selMo, 10) - 1, 1);
      selectedMonthName = selDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return res.json({
      semester,
      selectedMonth: month,
      selectedMonthName,
      availableMonths,
      days,
      monthSummary: {
        presentClasses: monthPresent,
        absentClasses: monthAbsent,
        dutyLeave: monthDutyLeave,
        totalClasses: monthTotal,
        effectiveAttended,
        percentage: monthPercentage,
      },
      semesterOverall: {
        present: semPresent,
        absent: semAbsent,
        dutyLeave: semDuty,
        total: semTotal,
        effectivePresent: semEffective,
        percentage: semPct,
      },
    });
  } catch (err: any) {
    console.error('Fatal error in /api/students/:uid/attendance/daily:', err);
    return res.status(500).json({
      message: err.message || 'Internal server error processing daily attendance',
    });
  }
});

// Get individual date-wise daily attendance records for a student
router.get('/students/:uid/attendance-records', (req: Request, res: Response) => {
  const { uid } = req.params;
  const { semester, subject_id } = req.query;

  let sql = `
    SELECT 
      ar.id,
      ar.date,
      ar.period,
      ar.status,
      ar.class,
      ar.semester,
      ar.recorded_at,
      s.id as subject_id,
      s.code as subject_code,
      s.name as subject_name,
      s.teacher,
      s.credits
    FROM attendance_records ar
    JOIN subjects s ON ar.subject_id = s.id
    WHERE ar.student_uid = ?
  `;
  const params: any[] = [uid];

  if (semester && semester !== 'All') {
    sql += ' AND ar.semester = ?';
    params.push(semester);
  }
  if (subject_id) {
    sql += ' AND ar.subject_id = ?';
    params.push(Number(subject_id));
  }

  sql += ' ORDER BY ar.date DESC, ar.period ASC, ar.id DESC';

  const records = queryAll(sql, params);
  res.json(records);
});

// Get individual subject detailed attendance & exception records for a student
router.get('/students/:uid/attendance/:subjectId', (req: Request, res: Response) => {
  const { uid, subjectId } = req.params;
  const semester = (req.query.semester as string) || 'S5';
  const sId = Number(subjectId);

  if (isNaN(sId)) {
    return res.status(400).json({ message: 'Invalid subject ID.' });
  }

  const subject = queryOne('SELECT * FROM subjects WHERE id = ?', [sId]);
  if (!subject) {
    return res.status(404).json({ message: 'Subject not found.' });
  }

  const recs = queryAll<{ id: number; date: string; status: string }>(
    'SELECT id, date, status FROM attendance_records WHERE student_uid = ? AND subject_id = ? AND semester = ? ORDER BY date ASC',
    [uid, sId, semester]
  );

  let present = 0;
  let absent = 0;
  let dutyLeave = 0;
  const total = recs.length;

  for (const r of recs) {
    if (r.status === 'Present') present++;
    else if (r.status === 'Absent') absent++;
    else if (r.status === 'Duty Leave') dutyLeave++;
  }

  const effectivePresent = present + dutyLeave;
  const percentage = total > 0 ? parseFloat(((effectivePresent / total) * 100).toFixed(1)) : 0;

  // Filter exceptions: ONLY Absent and Duty Leave (NEVER Present)
  const exceptions = recs
    .filter((r) => r.status === 'Absent' || r.status === 'Duty Leave')
    .map((r) => ({
      id: r.id,
      date: r.date,
      formattedDate: formatDateDisplay(r.date),
      monthYear: formatMonthYear(r.date),
      status: r.status as 'Absent' | 'Duty Leave',
    }));

  // Group exceptions by Month-Year (e.g. "AUGUST 2026", "SEPTEMBER 2026")
  const monthGroups: Record<string, typeof exceptions> = {};
  for (const ex of exceptions) {
    if (!monthGroups[ex.monthYear]) {
      monthGroups[ex.monthYear] = [];
    }
    monthGroups[ex.monthYear].push(ex);
  }

  res.json({
    subject,
    semester,
    summary: {
      total_classes: total,
      present_classes: present,
      absent_classes: absent,
      duty_leave_classes: dutyLeave,
      effective_present: effectivePresent,
      percentage,
      status: total === 0 ? 'No Data' : percentage >= 80 ? 'Safe' : percentage >= 75 ? 'Warning' : 'Below Requirement',
    },
    exceptions,
    monthGroups,
  });
});

// Admin Class Attendance Sheet: Fetch students of selected Class/Semester/Subject/Date/Period from SQLite
router.get('/attendance/class-sheet', (req: Request, res: Response) => {
  const className = (req.query.class as string) || 'S5 CSE A';
  const semester = (req.query.semester as string) || 'S5';
  const subjectId = Number(req.query.subject_id) || 1;
  let date = (req.query.date as string) || '2026-08-05';
  const period = Number(req.query.period) || 1;

  // Normalize date format if needed
  if (date && date.includes('-')) {
    const parts = date.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      date = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // 1. Fetch students belonging to this class from SQLite (with fallback)
  let students = queryAll(
    'SELECT uid, name, class, semester, email, photo FROM students WHERE class = ? ORDER BY uid ASC',
    [className]
  );

  if (students.length === 0) {
    students = queryAll(
      'SELECT uid, name, class, semester, email, photo FROM students WHERE semester = ? OR ? = "S5" ORDER BY uid ASC',
      [semester, semester]
    );
  }

  if (students.length === 0) {
    students = queryAll(
      'SELECT uid, name, class, semester, email, photo FROM students ORDER BY uid ASC'
    );
  }

  // 2. Fetch any saved attendance records for this date, period, and semester
  const records = queryAll<{ student_uid: string; status: string }>(
    'SELECT student_uid, status FROM attendance_records WHERE semester = ? AND date = ? AND period = ?',
    [semester, date, period]
  );

  const statusMap = new Map<string, string>();
  for (const r of records) {
    statusMap.set(r.student_uid, r.status);
  }

  const subject = queryOne('SELECT * FROM subjects WHERE id = ?', [subjectId]);

  const studentRows = students.map((s) => ({
    uid: s.uid,
    name: s.name,
    class: s.class || className,
    semester: s.semester || semester,
    email: s.email,
    photo: s.photo,
    status: (statusMap.get(s.uid) || 'Present') as 'Present' | 'Absent' | 'Duty Leave',
    isAlreadyMarked: statusMap.has(s.uid),
  }));

  res.json({
    class: className,
    semester,
    subject,
    date,
    period,
    students: studentRows,
  });
});

// Admin Mark Attendance for Class (Bulk / Daily Attendance Entry per Period)
router.post('/attendance/class-sheet', (req: Request, res: Response) => {
  let { class: className = 'S5 CSE A', semester = 'S5', subject_id, date = '2026-08-05', period = 1, records } = req.body;
  // records: Array of { student_uid: string, status: 'Present' | 'Absent' | 'Duty Leave' }

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'No attendance records provided.' });
  }

  // Normalize date format if provided as DD-MM-YYYY to YYYY-MM-DD
  if (date && date.includes('-')) {
    const parts = date.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      date = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const sId = Number(subject_id);
  const pNum = Number(period) || 1;

  for (const record of records) {
    const validStatus = ['Present', 'Absent', 'Duty Leave'].includes(record.status)
      ? record.status
      : 'Present';

    // Prevent duplicates: search by (student_uid, semester, date, period)
    const existing = queryOne(
      'SELECT id FROM attendance_records WHERE student_uid = ? AND semester = ? AND date = ? AND period = ?',
      [record.student_uid, semester, date, pNum]
    );

    if (existing) {
      execute(
        'UPDATE attendance_records SET status = ?, subject_id = ?, class = ?, recorded_at = CURRENT_TIMESTAMP WHERE id = ?',
        [validStatus, sId, className, existing.id]
      );
    } else {
      execute(
        'INSERT INTO attendance_records (student_uid, subject_id, class, semester, date, period, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.student_uid, sId, className, semester, date, pNum, validStatus]
      );
    }

    // Recalculate and update aggregate attendance table for this student & subject
    const aggStats = queryOne<{ total: number; present: number; duty: number; absent: number }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) as duty,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
       FROM attendance_records
       WHERE student_uid = ? AND subject_id = ? AND semester = ?`,
      [record.student_uid, sId, semester]
    );

    const totalCount = aggStats?.total || 1;
    const presentCount = aggStats?.present || 0;
    const dutyCount = aggStats?.duty || 0;
    const absentCount = aggStats?.absent || 0;

    const existingAgg = queryOne(
      'SELECT id FROM attendance WHERE student_uid = ? AND subject_id = ?',
      [record.student_uid, sId]
    );

    if (existingAgg) {
      execute(
        'UPDATE attendance SET present_classes = ?, total_classes = ?, absent_classes = ?, duty_leave_classes = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [presentCount, totalCount, absentCount, dutyCount, existingAgg.id]
      );
    } else {
      execute(
        'INSERT INTO attendance (student_uid, subject_id, present_classes, total_classes, absent_classes, duty_leave_classes) VALUES (?, ?, ?, ?, ?, ?)',
        [record.student_uid, sId, presentCount, totalCount, absentCount, dutyCount]
      );
    }
  }

  res.json({
    success: true,
    message: `✓ Successfully saved attendance for ${records.length} students for Period ${pNum} (${date}).`,
  });
});

// Admin Mark Attendance (Generic / Single or list)
router.post('/attendance', (req: Request, res: Response) => {
  const { class: className = 'S5 CSE A', subject_id, date, period = 1, records, semester = 'S5' } = req.body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'No attendance records provided.' });
  }

  const sId = Number(subject_id);
  const pNum = Number(period) || 1;

  for (const record of records) {
    const validStatus = ['Present', 'Absent', 'Duty Leave'].includes(record.status)
      ? record.status
      : 'Present';

    const existing = queryOne(
      'SELECT id FROM attendance_records WHERE student_uid = ? AND semester = ? AND date = ? AND period = ?',
      [record.student_uid, semester, date, pNum]
    );

    if (existing) {
      execute(
        'UPDATE attendance_records SET status = ?, subject_id = ?, class = ?, recorded_at = CURRENT_TIMESTAMP WHERE id = ?',
        [validStatus, sId, className, existing.id]
      );
    } else {
      execute(
        'INSERT INTO attendance_records (student_uid, subject_id, class, semester, date, period, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.student_uid, sId, className, semester, date, pNum, validStatus]
      );
    }

    const aggStats = queryOne<{ total: number; present: number; duty: number; absent: number }>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) as duty,
         SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
       FROM attendance_records
       WHERE student_uid = ? AND subject_id = ? AND semester = ?`,
      [record.student_uid, sId, semester]
    );

    const totalCount = aggStats?.total || 1;
    const presentCount = aggStats?.present || 0;
    const dutyCount = aggStats?.duty || 0;
    const absentCount = aggStats?.absent || 0;

    const existingAgg = queryOne(
      'SELECT id FROM attendance WHERE student_uid = ? AND subject_id = ?',
      [record.student_uid, sId]
    );

    if (existingAgg) {
      execute(
        'UPDATE attendance SET present_classes = ?, total_classes = ?, absent_classes = ?, duty_leave_classes = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [presentCount, totalCount, absentCount, dutyCount, existingAgg.id]
      );
    } else {
      execute(
        'INSERT INTO attendance (student_uid, subject_id, present_classes, total_classes, absent_classes, duty_leave_classes) VALUES (?, ?, ?, ?, ?, ?)',
        [record.student_uid, sId, presentCount, totalCount, absentCount, dutyCount]
      );
    }
  }

  res.json({ success: true, message: '✓ Attendance saved successfully.' });
});

// Update specific attendance record by ID
router.put('/attendance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, date } = req.body;

  const existing = queryOne('SELECT * FROM attendance_records WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ message: 'Attendance record not found.' });
  }

  const validStatus = ['Present', 'Absent', 'Duty Leave'].includes(status) ? status : existing.status;
  const targetDate = date || existing.date;

  execute(
    'UPDATE attendance_records SET status = ?, date = ?, recorded_at = CURRENT_TIMESTAMP WHERE id = ?',
    [validStatus, targetDate, id]
  );

  res.json({ success: true, message: '✓ Attendance record updated successfully.' });
});

// Admin attendance history logs
router.get('/attendance/history', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      ar.id,
      ar.date,
      ar.class,
      ar.status,
      ar.recorded_at,
      s.name as student_name,
      s.uid as student_uid,
      sub.name as subject_name,
      sub.code as subject_code
    FROM attendance_records ar
    JOIN students s ON ar.student_uid = s.uid
    JOIN subjects sub ON ar.subject_id = sub.id
    ORDER BY ar.recorded_at DESC
    LIMIT 100
  `;
  const records = queryAll(sql);
  res.json(records);
});

// ==================== MARKS ====================
function getKTUGradePoint(percentage: number): { gradePoint: number; letterGrade: string } {
  if (percentage >= 90) return { gradePoint: 10, letterGrade: 'O' };
  if (percentage >= 85) return { gradePoint: 9.5, letterGrade: 'A+' };
  if (percentage >= 80) return { gradePoint: 9.0, letterGrade: 'A+' };
  if (percentage >= 75) return { gradePoint: 8.5, letterGrade: 'A' };
  if (percentage >= 70) return { gradePoint: 8.0, letterGrade: 'A' };
  if (percentage >= 65) return { gradePoint: 7.5, letterGrade: 'B+' };
  if (percentage >= 60) return { gradePoint: 7.0, letterGrade: 'B+' };
  if (percentage >= 55) return { gradePoint: 6.5, letterGrade: 'B' };
  if (percentage >= 50) return { gradePoint: 6.0, letterGrade: 'B' };
  if (percentage >= 45) return { gradePoint: 5.0, letterGrade: 'C' };
  if (percentage >= 40) return { gradePoint: 4.0, letterGrade: 'P' };
  return { gradePoint: 0, letterGrade: 'F' };
}

// Get student marks grouped semester-wise
router.get('/students/:uid/marks', (req: Request, res: Response) => {
  const { uid } = req.params;
  const requestedSemester = req.query.semester as string;

  const student = queryOne<{
    uid: string;
    name: string;
    class: string;
    department: string;
    semester: string;
    cgpa: number;
    completed_credits: number;
  }>('SELECT uid, name, class, department, semester, cgpa, completed_credits FROM students WHERE uid = ?', [uid]) ||
    queryOne<{
      uid: string;
      name: string;
      class: string;
      department: string;
      semester: string;
      cgpa: number;
      completed_credits: number;
    }>('SELECT uid, name, class, department, semester, cgpa, completed_credits FROM students LIMIT 1');

  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const currentSem = student.semester || 'S5';
  const currentSemNum = parseInt(currentSem.replace(/\D/g, '')) || 5;

  // Get all subjects
  const allSubjects = queryAll<{
    id: number;
    code: string;
    name: string;
    teacher: string;
    semester: string;
    credits: number;
  }>('SELECT id, code, name, teacher, semester, credits FROM subjects ORDER BY semester ASC, id ASC');

  // Get student marks
  const studentMarks = queryAll<{
    subject_id: number;
    internal1: number | null;
    internal2: number | null;
    assignment: number | null;
    project: number | null;
    max_internal1: number | null;
    max_internal2: number | null;
    max_assignment: number | null;
    max_project: number | null;
  }>('SELECT subject_id, internal1, internal2, assignment, project, max_internal1, max_internal2, max_assignment, max_project FROM marks WHERE student_uid = ?', [student.uid]);

  const marksMap = new Map<number, typeof studentMarks[0]>();
  for (const m of studentMarks) {
    marksMap.set(m.subject_id, m);
  }

  // Determine distinct semester list in order S1 to S8
  const semesterSet = new Set<string>();
  ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].forEach((s) => semesterSet.add(s));
  allSubjects.forEach((sub) => semesterSet.add(sub.semester));

  const sortedSemesters = Array.from(semesterSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const flatSubjectsList: any[] = [];
  let calculatedCompletedCredits = 0;
  let totalGradePointsAccumulated = 0;

  const semesterGroups = sortedSemesters.map((sem) => {
    const semNum = parseInt(sem.replace(/\D/g, '')) || 0;
    const subjectsInSem = allSubjects.filter((s) => s.semester === sem);
    const totalCredits = subjectsInSem.reduce((acc, s) => acc + (s.credits || 0), 0);

    let semStatus: 'Completed' | 'Current' | 'Upcoming' = 'Upcoming';
    if (sem === currentSem) {
      semStatus = 'Current';
    } else if (semNum < currentSemNum) {
      semStatus = 'Completed';
    } else {
      semStatus = 'Upcoming';
    }

    let completedSubjectsCount = 0;
    let semesterWeightedPoints = 0;
    let semesterGradedCredits = 0;

    const subjectsData = subjectsInSem.map((sub) => {
      const m = marksMap.get(sub.id);

      const rawI1 = m && m.internal1 !== null && m.internal1 !== undefined ? Number(m.internal1) : null;
      const rawI2 = m && m.internal2 !== null && m.internal2 !== undefined ? Number(m.internal2) : null;
      const rawAssign = m && m.assignment !== null && m.assignment !== undefined ? Number(m.assignment) : null;
      const rawProj = m && m.project !== null && m.project !== undefined ? Number(m.project) : null;

      const max_internal1 = (m && m.max_internal1) || 30;
      const max_internal2 = (m && m.max_internal2) || 30;
      const max_assignment = (m && m.max_assignment) || 10;
      const max_project = (m && m.max_project) || 10;
      const max_total = max_internal1 + max_internal2 + max_assignment + max_project;

      let status: 'Completed' | 'Marks in Progress' | 'Upcoming' | 'Not Started' = 'Upcoming';
      let total: number | null = null;
      let percentage: number | null = null;
      let gradePoint: number | null = null;
      let letterGrade: string | null = null;

      const hasAny = rawI1 !== null || rawI2 !== null || rawAssign !== null || rawProj !== null;
      const hasAll = rawI1 !== null && rawI2 !== null && rawAssign !== null && rawProj !== null;

      if (!hasAny) {
        status = semStatus === 'Upcoming' ? 'Upcoming' : 'Not Started';
      } else if (hasAll) {
        status = 'Completed';
        total = parseFloat(((rawI1 || 0) + (rawI2 || 0) + (rawAssign || 0) + (rawProj || 0)).toFixed(1));
        percentage = max_total > 0 ? parseFloat(((total / max_total) * 100).toFixed(1)) : 0;
        const gpInfo = getKTUGradePoint(percentage);
        gradePoint = gpInfo.gradePoint;
        letterGrade = gpInfo.letterGrade;

        completedSubjectsCount++;
        semesterWeightedPoints += (sub.credits || 0) * gradePoint;
        semesterGradedCredits += (sub.credits || 0);
      } else {
        status = 'Marks in Progress';
      }

      const item = {
        subject_id: sub.id,
        code: sub.code,
        subject_name: sub.name,
        teacher: sub.teacher,
        semester: sub.semester,
        credits: sub.credits,
        internal1: rawI1,
        internal2: rawI2,
        assignment: rawAssign,
        project: rawProj,
        max_internal1,
        max_internal2,
        max_assignment,
        max_project,
        total,
        max_total,
        percentage,
        gradePoint,
        letterGrade,
        status,
      };

      flatSubjectsList.push(item);
      return item;
    });

    let sgpa: number | null = null;
    let sgpaDisplay = '—';

    if (semStatus === 'Completed' || (subjectsInSem.length > 0 && completedSubjectsCount === subjectsInSem.length)) {
      if (semesterGradedCredits > 0) {
        sgpa = parseFloat((semesterWeightedPoints / semesterGradedCredits).toFixed(2));
        sgpaDisplay = sgpa.toFixed(2);
        calculatedCompletedCredits += totalCredits;
        totalGradePointsAccumulated += semesterWeightedPoints;
      }
    } else if (semStatus === 'Current') {
      if (subjectsInSem.length > 0 && completedSubjectsCount === subjectsInSem.length && semesterGradedCredits > 0) {
        sgpa = parseFloat((semesterWeightedPoints / semesterGradedCredits).toFixed(2));
        sgpaDisplay = sgpa.toFixed(2);
      } else {
        sgpa = null;
        sgpaDisplay = 'In Progress';
      }
    } else {
      sgpa = null;
      sgpaDisplay = '—';
    }

    return {
      semester: sem,
      semesterNumber: semNum,
      status: semStatus,
      totalSubjects: subjectsInSem.length,
      totalCredits,
      sgpa,
      sgpaDisplay,
      subjects: subjectsData,
    };
  });

  // Calculate dynamic overall CGPA and completed credits
  const finalCompletedCredits = calculatedCompletedCredits > 0 ? calculatedCompletedCredits : (student.completed_credits || 84);
  let finalCgpa = student.cgpa || 9.40;
  if (calculatedCompletedCredits > 0 && totalGradePointsAccumulated > 0) {
    finalCgpa = parseFloat((totalGradePointsAccumulated / calculatedCompletedCredits).toFixed(2));
  }

  // Academic Standing based on CGPA
  let standing = 'Distinction';
  if (finalCgpa >= 9.0) standing = 'Distinction';
  else if (finalCgpa >= 7.5) standing = 'First Class with Distinction';
  else if (finalCgpa >= 6.5) standing = 'First Class';
  else if (finalCgpa >= 5.5) standing = 'Second Class';
  else standing = 'Pass';

  // Build Journey
  const journey = semesterGroups.map((g) => ({
    semester: g.semester,
    sgpa: g.sgpa,
    displaySgpa: g.sgpaDisplay,
    status: g.status,
  }));

  // If a specific semester is requested via ?semester=SX, filter if not "All"
  const filteredSemesters = requestedSemester && requestedSemester !== 'All'
    ? semesterGroups.filter((g) => g.semester === requestedSemester)
    : semesterGroups;

  res.json({
    student: {
      uid: student.uid,
      name: student.name,
      class: student.class,
      department: student.department,
      semester: currentSem,
      cgpa: finalCgpa,
      completed_credits: finalCompletedCredits,
      total_credits: 160,
      standing,
    },
    cgpa: finalCgpa,
    completed_credits: finalCompletedCredits,
    total_credits: 160,
    current_semester: currentSem,
    standing,
    semesters: filteredSemesters,
    all_semesters: semesterGroups,
    journey,
    subjects: flatSubjectsList,
  });
});

// Admin update marks (Supports nulls for unentered / in progress)
const handleSaveMarks = (req: Request, res: Response) => {
  const { student_uid, subject_id, internal1, internal2, assignment, project } = req.body;

  if (!student_uid || !subject_id) {
    return res.status(400).json({ message: 'Student UID and Subject ID are required.' });
  }

  const sUid = String(student_uid);
  const sId = Number(subject_id);

  const i1 = internal1 !== null && internal1 !== undefined && internal1 !== '' ? Number(internal1) : null;
  const i2 = internal2 !== null && internal2 !== undefined && internal2 !== '' ? Number(internal2) : null;
  const assign = assignment !== null && assignment !== undefined && assignment !== '' ? Number(assignment) : null;
  const proj = project !== null && project !== undefined && project !== '' ? Number(project) : null;

  const existing = queryOne('SELECT id FROM marks WHERE student_uid = ? AND subject_id = ?', [sUid, sId]);

  if (existing) {
    execute(
      'UPDATE marks SET internal1 = ?, internal2 = ?, assignment = ?, project = ? WHERE id = ?',
      [i1, i2, assign, proj, existing.id]
    );
  } else {
    execute(
      'INSERT INTO marks (student_uid, subject_id, internal1, internal2, assignment, project) VALUES (?, ?, ?, ?, ?, ?)',
      [sUid, sId, i1, i2, assign, proj]
    );
  }

  res.json({ success: true, message: 'Marks updated successfully.' });
};

router.post('/marks', handleSaveMarks);
router.post('/admin/marks', handleSaveMarks);

// ==================== ACTIVITY POINTS ====================
// Get student activity points + breakdown
router.get('/activities/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  const activities = queryAll('SELECT * FROM activities WHERE student_uid = ? ORDER BY submitted_at DESC', [uid]);

  // Calculate points per category (Only Approved count)
  let cat1 = 0; // Extracurricular & National Initiatives (Target: 20)
  let cat2 = 0; // Professional (Target: 20)
  let cat3 = 0; // Volunteering & Leadership Skills (Target: 20)

  for (const act of activities) {
    if (act.status === 'Approved') {
      const p = Number(act.points) || 0;
      if (act.category === 'Extracurricular & National Initiatives') {
        cat1 += p;
      } else if (act.category === 'Professional') {
        cat2 += p;
      } else if (act.category === 'Volunteering & Leadership Skills') {
        cat3 += p;
      }
    }
  }

  const overall = cat1 + cat2 + cat3;

  res.json({
    categories: {
      extracurricular: {
        name: 'Extracurricular & National Initiatives',
        points: cat1,
        target: 20,
        completed: cat1 >= 20,
      },
      professional: {
        name: 'Professional',
        points: cat2,
        target: 20,
        completed: cat2 >= 20,
      },
      volunteering: {
        name: 'Volunteering & Leadership Skills',
        points: cat3,
        target: 20,
        completed: cat3 >= 20,
      },
    },
    overall: {
      points: overall,
      target: 100,
      completed: overall >= 100,
    },
    activities,
  });
});

// Admin get all activities (Supports both /activities and /admin/activities)
const handleGetActivities = (req: Request, res: Response) => {
  const { status } = req.query;
  let sql = `
    SELECT 
      a.*,
      s.name as student_name,
      s.class as student_class
    FROM activities a
    JOIN students s ON a.student_uid = s.uid
  `;
  const params: any[] = [];

  if (status && status !== 'All') {
    sql += ' WHERE a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.submitted_at DESC';
  const activities = queryAll(sql, params);
  res.json(activities);
};

router.get('/activities', handleGetActivities);
router.get('/admin/activities', handleGetActivities);

// Get pending activities specifically for Admin Dashboard
router.get('/admin/activities/pending', (req: Request, res: Response) => {
  const activities = queryAll(`
    SELECT 
      a.*,
      s.name as student_name,
      s.class as student_class
    FROM activities a
    JOIN students s ON a.student_uid = s.uid
    WHERE a.status = 'Pending'
    ORDER BY a.submitted_at DESC
  `);
  res.json(activities);
});

// Student submit activity with certificate upload
router.post('/activities', upload.single('certificate'), (req: Request, res: Response) => {
  const { student_uid, semester, category, title, description, requested_points } = req.body;

  if (!student_uid || !category || !title || !semester) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  let certificate_url = '';
  if (req.file) {
    certificate_url = `/uploads/${req.file.filename}`;
  } else if (req.body.certificate_url) {
    certificate_url = req.body.certificate_url;
  }

  const defaultPoints = Number(requested_points) || 10;

  execute(
    `INSERT INTO activities (student_uid, semester, category, title, description, certificate_url, points, requested_points, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'Pending', CURRENT_TIMESTAMP)`,
    [student_uid, semester, category, title, description || '', certificate_url, defaultPoints]
  );

  res.json({ success: true, message: 'Activity submitted successfully. Status: Pending approval.' });
});

// Admin Approve Activity (Handles PUT and POST for both /activities and /admin/activities)
const handleApproveActivity = (req: Request, res: Response) => {
  const { id } = req.params;
  const { points, remarks } = req.body;

  const activity = queryOne('SELECT * FROM activities WHERE id = ?', [id]);
  if (!activity) {
    return res.status(404).json({ message: 'Activity not found.' });
  }

  const finalPoints = points !== undefined ? Number(points) : activity.requested_points;

  execute(
    "UPDATE activities SET status = 'Approved', points = ?, remarks = ? WHERE id = ?",
    [finalPoints, remarks || 'Verified and approved by Faculty Advisor', id]
  );

  res.json({ success: true, message: 'Activity approved successfully.' });
};

router.put('/activities/:id/approve', handleApproveActivity);
router.post('/activities/:id/approve', handleApproveActivity);
router.put('/admin/activities/:id/approve', handleApproveActivity);
router.post('/admin/activities/:id/approve', handleApproveActivity);

// Admin Reject Activity (Handles PUT and POST for both /activities and /admin/activities)
const handleRejectActivity = (req: Request, res: Response) => {
  const { id } = req.params;
  const { remarks } = req.body;

  if (!remarks) {
    return res.status(400).json({ message: 'Please provide a rejection reason/remark.' });
  }

  execute(
    "UPDATE activities SET status = 'Rejected', points = 0, remarks = ? WHERE id = ?",
    [remarks, id]
  );

  res.json({ success: true, message: 'Activity rejected.' });
};

router.put('/activities/:id/reject', handleRejectActivity);
router.post('/activities/:id/reject', handleRejectActivity);
router.put('/admin/activities/:id/reject', handleRejectActivity);
router.post('/admin/activities/:id/reject', handleRejectActivity);

// Admin manually add activity points directly
router.post('/admin/activity-points', (req: Request, res: Response) => {
  const { student_uid, semester, category, activity, points, remarks } = req.body;

  if (!student_uid || !category || !activity || !points) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  const student = queryOne('SELECT uid FROM students WHERE uid = ?', [student_uid]);
  if (!student) {
    return res.status(404).json({ message: 'Student not found. Please enter a valid UID.' });
  }

  execute(
    `INSERT INTO activities (student_uid, semester, category, title, description, points, requested_points, status, remarks, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', ?, CURRENT_TIMESTAMP)`,
    [student_uid, semester || 'S5', category, activity, remarks || 'Faculty Direct Award', points, points, remarks || 'Directly awarded by Admin']
  );

  res.json({ success: true, message: 'Activity points awarded successfully.' });
});

// ==================== FEEDBACK ====================
// Get feedback analytics
const handleGetFeedback = (req: Request, res: Response) => {
  const { semester, faculty, subject, academic_year } = req.query;

  // Base feedback query
  let sql = 'SELECT * FROM feedback WHERE 1=1';
  const params: any[] = [];

  if (semester && semester !== 'All' && semester !== 'All Semesters') {
    sql += ' AND semester = ?';
    params.push(String(semester));
  }
  if (faculty && faculty !== 'All' && faculty !== 'All Faculty') {
    sql += ' AND teacher = ?';
    params.push(String(faculty));
  }
  if (subject && subject !== 'All' && subject !== 'All Subjects') {
    sql += ' AND (subject = ? OR subject_code = ?)';
    params.push(String(subject), String(subject));
  }
  if (academic_year && academic_year !== 'All' && academic_year !== 'All Years') {
    sql += ' AND academic_year = ?';
    params.push(String(academic_year));
  }
  sql += ' ORDER BY submitted_at DESC';

  const feedbacks = queryAll(sql, params);

  // Score mapping helper (5-point scale)
  const scoreMap: Record<string, number> = {
    Excellent: 5.0,
    Good: 4.0,
    Average: 3.0,
    Poor: 2.0,
  };

  const getPerformanceBadge = (avg: number | null): string => {
    if (avg === null || isNaN(avg) || avg === 0) return 'No Feedback Yet';
    if (avg >= 4.5) return 'Excellent';
    if (avg >= 4.0) return 'Very Good';
    if (avg >= 3.0) return 'Good';
    if (avg >= 2.0) return 'Needs Improvement';
    return 'Critical';
  };

  // 10 Question Definitions
  const QUESTIONS = [
    { id: 'q1', key: 'Syllabus Completion', text: '1. Was the syllabus completed on time?' },
    { id: 'q2', key: 'Explanation & Clarity', text: '2. Was the explanation clear and understandable?' },
    { id: 'q3', key: 'Doubt Resolution', text: '3. Were doubts and student queries addressed effectively?' },
    { id: 'q4', key: 'Practical Examples', text: '4. Were sufficient practical examples provided in class?' },
    { id: 'q5', key: 'Teaching Pace', text: '5. Was the pace of teaching appropriate for all students?' },
    { id: 'q6', key: 'Study Materials & References', text: '6. Were study materials, notes, and references provided?' },
    { id: 'q7', key: 'Student Interaction & Engagement', text: '7. Was the classroom atmosphere interactive and engaging?' },
    { id: 'q8', key: 'Practical & Real-World Applications', text: '8. Were real-world and practical applications discussed?' },
    { id: 'q9', key: 'Assessment & Evaluation', text: '9. Were internal assessments and assignments evaluated properly?' },
    { id: 'q10', key: 'Overall Course Satisfaction', text: '10. What is your overall satisfaction with the course and instructor?' },
  ];

  // Calculate Overall Question Performance
  const questionPerformance = QUESTIONS.map((q) => {
    const counts = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    let qTotalScore = 0;

    for (const f of feedbacks) {
      const val = (f[q.id] as string) || 'Good';
      if (counts[val as keyof typeof counts] !== undefined) {
        counts[val as keyof typeof counts] += 1;
      } else {
        counts.Good += 1;
      }
      qTotalScore += scoreMap[val] || 4.0;
    }

    const totalAnswers = feedbacks.length;
    const avgScore = totalAnswers > 0 ? parseFloat((qTotalScore / totalAnswers).toFixed(2)) : 0;

    return {
      id: q.id,
      key: q.key,
      text: q.text,
      averageRating: avgScore,
      ratingOutOf5: avgScore > 0 ? `${avgScore.toFixed(2)} / 5` : '—',
      percentage: avgScore > 0 ? Math.round((avgScore / 5.0) * 100) : 0,
      distribution: counts,
      distributionPercentages: {
        Excellent: totalAnswers > 0 ? Math.round((counts.Excellent / totalAnswers) * 100) : 0,
        Good: totalAnswers > 0 ? Math.round((counts.Good / totalAnswers) * 100) : 0,
        Average: totalAnswers > 0 ? Math.round((counts.Average / totalAnswers) * 100) : 0,
        Poor: totalAnswers > 0 ? Math.round((counts.Poor / totalAnswers) * 100) : 0,
      },
    };
  });

  // Calculate Overall Response Distribution
  const overallDistCounts = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
  let totalAnswerEntries = 0;

  for (const q of QUESTIONS) {
    for (const f of feedbacks) {
      const val = (f[q.id] as string) || 'Good';
      if (overallDistCounts[val as keyof typeof overallDistCounts] !== undefined) {
        overallDistCounts[val as keyof typeof overallDistCounts] += 1;
      } else {
        overallDistCounts.Good += 1;
      }
      totalAnswerEntries += 1;
    }
  }

  const responseDistribution = {
    totalAnswers: totalAnswerEntries,
    counts: overallDistCounts,
    percentages: {
      Excellent: totalAnswerEntries > 0 ? Math.round((overallDistCounts.Excellent / totalAnswerEntries) * 100) : 0,
      Good: totalAnswerEntries > 0 ? Math.round((overallDistCounts.Good / totalAnswerEntries) * 100) : 0,
      Average: totalAnswerEntries > 0 ? Math.round((overallDistCounts.Average / totalAnswerEntries) * 100) : 0,
      Poor: totalAnswerEntries > 0 ? Math.round((overallDistCounts.Poor / totalAnswerEntries) * 100) : 0,
    },
  };

  // Group by Faculty
  const facultyMap: Record<string, { teacher: string; subjects: Set<string>; count: number; totalScore: number }> = {};
  for (const f of feedbacks) {
    if (!facultyMap[f.teacher]) {
      facultyMap[f.teacher] = {
        teacher: f.teacher,
        subjects: new Set(),
        count: 0,
        totalScore: 0,
      };
    }
    facultyMap[f.teacher].subjects.add(f.subject);
    facultyMap[f.teacher].count += 1;
    facultyMap[f.teacher].totalScore += Number(f.score);
  }

  // Also include teachers who teach in this semester if no specific teacher filter
  let allSubjectsSql = 'SELECT * FROM subjects WHERE 1=1';
  const allSubParams: any[] = [];
  if (semester && semester !== 'All' && semester !== 'All Semesters') {
    allSubjectsSql += ' AND semester = ?';
    allSubParams.push(String(semester));
  }
  const allSubjects = queryAll(allSubjectsSql, allSubParams);

  if (!faculty || faculty === 'All' || faculty === 'All Faculty') {
    for (const sub of allSubjects) {
      if (sub.teacher && !facultyMap[sub.teacher]) {
        facultyMap[sub.teacher] = {
          teacher: sub.teacher,
          subjects: new Set([sub.name]),
          count: 0,
          totalScore: 0,
        };
      }
    }
  }

  const facultyPerformance = Object.values(facultyMap).map((item) => {
    const avg = item.count > 0 ? parseFloat((item.totalScore / item.count).toFixed(2)) : 0;
    return {
      faculty: item.teacher,
      subjectCount: item.subjects.size,
      subjects: Array.from(item.subjects),
      responses: item.count,
      averageRating: item.count > 0 ? `${avg.toFixed(2)} / 5` : '—',
      numericRating: avg,
      performance: getPerformanceBadge(item.count > 0 ? avg : null),
    };
  }).sort((a, b) => b.numericRating - a.numericRating || b.responses - a.responses);

  // Group by Subject (Subject-wise Feedback)
  const subjectMap: Record<string, {
    code: string;
    name: string;
    teacher: string;
    semester: string;
    count: number;
    totalScore: number;
    feedbacks: any[];
  }> = {};

  // Initialize with subjects from database
  for (const s of allSubjects) {
    const key = `${s.code}__${s.name}`;
    if (!faculty || faculty === 'All' || faculty === 'All Faculty' || s.teacher === faculty) {
      if (!subject || subject === 'All' || subject === 'All Subjects' || s.name === subject || s.code === subject) {
        subjectMap[key] = {
          code: s.code,
          name: s.name,
          teacher: s.teacher,
          semester: s.semester || 'S5',
          count: 0,
          totalScore: 0,
          feedbacks: [],
        };
      }
    }
  }

  // Populate feedback into subjects
  for (const f of feedbacks) {
    const code = f.subject_code || (allSubjects.find((s) => s.name === f.subject)?.code) || 'CST000';
    const key = `${code}__${f.subject}`;
    if (!subjectMap[key]) {
      subjectMap[key] = {
        code,
        name: f.subject,
        teacher: f.teacher,
        semester: f.semester || 'S5',
        count: 0,
        totalScore: 0,
        feedbacks: [],
      };
    }
    subjectMap[key].count += 1;
    subjectMap[key].totalScore += Number(f.score);
    subjectMap[key].feedbacks.push(f);
  }

  const subjectWiseFeedback = Object.values(subjectMap).map((subItem) => {
    const avg = subItem.count > 0 ? parseFloat((subItem.totalScore / subItem.count).toFixed(2)) : 0;

    // Calculate individual question breakdown for detail view
    const qDetails = QUESTIONS.map((q) => {
      const counts = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
      let qTotal = 0;
      for (const f of subItem.feedbacks) {
        const val = (f[q.id] as string) || 'Good';
        if (counts[val as keyof typeof counts] !== undefined) {
          counts[val as keyof typeof counts] += 1;
        } else {
          counts.Good += 1;
        }
        qTotal += scoreMap[val] || 4.0;
      }
      const qAvg = subItem.count > 0 ? parseFloat((qTotal / subItem.count).toFixed(2)) : 0;
      return {
        id: q.id,
        key: q.key,
        text: q.text,
        averageRating: qAvg,
        ratingOutOf5: qAvg > 0 ? `${qAvg.toFixed(2)} / 5` : '—',
        distribution: counts,
        percentages: {
          Excellent: subItem.count > 0 ? Math.round((counts.Excellent / subItem.count) * 100) : 0,
          Good: subItem.count > 0 ? Math.round((counts.Good / subItem.count) * 100) : 0,
          Average: subItem.count > 0 ? Math.round((counts.Average / subItem.count) * 100) : 0,
          Poor: subItem.count > 0 ? Math.round((counts.Poor / subItem.count) * 100) : 0,
        },
      };
    });

    // Subject comments (anonymous)
    const subjectComments = subItem.feedbacks
      .filter((f) => f.comments && f.comments.trim())
      .map((f, idx) => ({
        id: idx + 1,
        text: f.comments.trim(),
        semester: f.semester || 'S5',
        date: f.submitted_at ? f.submitted_at.substring(0, 10) : 'Recent',
      }));

    return {
      subjectCode: subItem.code,
      subjectName: subItem.name,
      faculty: subItem.teacher,
      semester: subItem.semester,
      responses: subItem.count,
      averageRating: subItem.count > 0 ? `${avg.toFixed(2)} / 5` : '—',
      numericRating: avg,
      performance: getPerformanceBadge(subItem.count > 0 ? avg : null),
      questionAnalysis: qDetails,
      comments: subjectComments,
    };
  }).sort((a, b) => b.numericRating - a.numericRating || b.responses - a.responses);

  // Calculate Semester Feedback Trend (S1 through S8)
  const semesterTrendData: Array<{ semester: string; averageRating: number; ratingDisplay: string; responses: number }> = [];
  const semList = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  for (const sem of semList) {
    let semSql = 'SELECT score FROM feedback WHERE semester = ?';
    const semParams: any[] = [sem];
    if (faculty && faculty !== 'All' && faculty !== 'All Faculty') {
      semSql += ' AND teacher = ?';
      semParams.push(String(faculty));
    }
    if (subject && subject !== 'All' && subject !== 'All Subjects') {
      semSql += ' AND (subject = ? OR subject_code = ?)';
      semParams.push(String(subject), String(subject));
    }
    const semRows = queryAll(semSql, semParams);
    if (semRows.length > 0) {
      const sum = semRows.reduce((acc: number, r: any) => acc + Number(r.score), 0);
      const semAvg = parseFloat((sum / semRows.length).toFixed(2));
      semesterTrendData.push({
        semester: sem,
        averageRating: semAvg,
        ratingDisplay: `${semAvg.toFixed(2)} / 5`,
        responses: semRows.length,
      });
    }
  }

  // Comments / Anonymous Student Suggestions & Sentiment Insights
  // Strict Anonymity: never include student UID, name, email or ID
  const allComments: Array<{
    id: number;
    subject: string;
    subjectCode: string;
    semester: string;
    faculty: string;
    comment: string;
    date: string;
    category: 'Positive' | 'Suggestions' | 'Concerns';
  }> = [];

  const categorizeComment = (text: string, score: number): 'Positive' | 'Suggestions' | 'Concerns' => {
    const lower = text.toLowerCase();
    const concernWords = ['rushed', 'rush', 'hard', 'difficult', 'fast', 'slow down', 'unclear', 'confusing', 'lack', 'concern', 'critical', 'need more'];
    const suggestionWords = ['more', 'please', 'suggest', 'tutorial', 'practice', 'quiz', 'moodle', 'examples', 'revision', 'would love', 'would be', 'could'];
    const positiveWords = ['excellent', 'great', 'good', 'clear', 'engaging', 'helpful', 'dedicated', 'best', 'thorough', 'systematic', 'effective', 'enjoyed', 'well'];

    if (concernWords.some((w) => lower.includes(w))) {
      return 'Concerns';
    }
    if (suggestionWords.some((w) => lower.includes(w))) {
      return 'Suggestions';
    }
    if (positiveWords.some((w) => lower.includes(w))) {
      return 'Positive';
    }
    return score >= 4.0 ? 'Positive' : 'Suggestions';
  };

  let positiveCount = 0;
  let suggestionsCount = 0;
  let concernsCount = 0;

  feedbacks.forEach((f, index) => {
    if (f.comments && f.comments.trim()) {
      const cat = categorizeComment(f.comments.trim(), Number(f.score));
      if (cat === 'Positive') positiveCount += 1;
      else if (cat === 'Suggestions') suggestionsCount += 1;
      else if (cat === 'Concerns') concernsCount += 1;

      allComments.push({
        id: index + 1,
        subject: f.subject,
        subjectCode: f.subject_code || '',
        semester: f.semester || 'S5',
        faculty: f.teacher,
        comment: f.comments.trim(),
        date: f.submitted_at ? f.submitted_at.substring(0, 10) : 'Recent',
        category: cat,
      });
    }
  });

  // Summary Metrics
  const totalResponses = feedbacks.length;
  const totalScoreSum = feedbacks.reduce((acc, f) => acc + Number(f.score), 0);
  const averageRating = totalResponses > 0 ? parseFloat((totalScoreSum / totalResponses).toFixed(2)) : 0;
  const uniqueFaculty = new Set(feedbacks.map((f) => f.teacher)).size;
  const uniqueSubjects = new Set(feedbacks.map((f) => f.subject)).size;

  // Filter dynamic options from DB
  const distinctSemesters = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  const allDbTeachers = queryAll('SELECT DISTINCT teacher FROM subjects WHERE teacher IS NOT NULL ORDER BY teacher ASC');
  const allDbSubjects = queryAll('SELECT code, name, teacher, semester FROM subjects ORDER BY code ASC');

  res.json({
    summary: {
      totalResponses,
      averageRating: totalResponses > 0 ? averageRating.toFixed(2) : '—',
      averageRatingNumeric: averageRating,
      averageRatingDisplay: totalResponses > 0 ? `${averageRating.toFixed(2)} / 5` : '—',
      facultyEvaluated: uniqueFaculty,
      subjectsEvaluated: uniqueSubjects,
      overallPerformance: getPerformanceBadge(totalResponses > 0 ? averageRating : null),
    },
    questionPerformance,
    responseDistribution,
    facultyPerformance,
    subjectWiseFeedback,
    semesterTrend: semesterTrendData,
    comments: allComments,
    insights: {
      positiveCount,
      suggestionsCount,
      concernsCount,
    },
    filterOptions: {
      semesters: distinctSemesters,
      faculty: allDbTeachers.map((t: any) => t.teacher),
      subjects: allDbSubjects,
      academicYears: ['2025-26', '2024-25', '2023-24'],
    },
  });
};

router.get('/feedback', handleGetFeedback);
router.get('/admin/feedback', handleGetFeedback);
router.get('/api/admin/feedback', handleGetFeedback);

// Student submit feedback
const handleSubmitFeedback = (req: Request, res: Response) => {
  const { teacher, subject, answers, comments, semester, academic_year } = req.body;

  if (!teacher || !subject || !answers) {
    return res.status(400).json({ message: 'Teacher, Subject, and Answers are required.' });
  }

  // Map answers (5-point scale: Excellent = 5, Good = 4, Average = 3, Poor = 2)
  const scoreMap: Record<string, number> = {
    Excellent: 5.0,
    Good: 4.0,
    Average: 3.0,
    Poor: 2.0,
  };

  let totalScore = 0;
  const qValues: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const ans = answers[`q${i}`] || 'Good';
    qValues.push(ans);
    totalScore += scoreMap[ans] || 4.0;
  }
  const avgScore = parseFloat((totalScore / 10).toFixed(2));

  // Find subject details if available
  const subRec = queryOne('SELECT code, semester FROM subjects WHERE name = ? OR code = ?', [subject, subject]);
  const subCode = subRec ? subRec.code : (req.body.subject_code || 'CST000');
  const subSem = semester || (subRec ? subRec.semester : 'S5');
  const subYear = academic_year || '2025-26';

  execute(
    `INSERT INTO feedback (teacher, subject, subject_code, semester, academic_year, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, comments, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [teacher, subject, subCode, subSem, subYear, ...qValues, avgScore, comments || '']
  );

  res.json({ success: true, message: 'Feedback submitted successfully. Thank you for your response!' });
};

router.post('/feedback', handleSubmitFeedback);
router.post('/admin/feedback', handleSubmitFeedback);
router.post('/api/feedback', handleSubmitFeedback);

// ==================== ANNOUNCEMENTS ====================
const handleGetAnnouncements = (req: Request, res: Response) => {
  const announcements = queryAll('SELECT * FROM announcements ORDER BY id DESC');
  res.json(announcements);
};

router.get('/announcements', handleGetAnnouncements);
router.get('/admin/announcements', handleGetAnnouncements);

const handleCreateAnnouncement = (req: Request, res: Response) => {
  const { title, message, date, category, author } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required.' });
  }

  execute(
    'INSERT INTO announcements (title, message, date, category, author) VALUES (?, ?, ?, ?, ?)',
    [title, message, date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), category || 'General', author || 'Academic Office']
  );

  res.json({ success: true, message: 'Announcement created successfully.' });
};

router.post('/announcements', handleCreateAnnouncement);
router.post('/admin/announcements', handleCreateAnnouncement);

const handleUpdateAnnouncement = (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, message, date, category } = req.body;

  execute(
    'UPDATE announcements SET title = ?, message = ?, date = ?, category = ? WHERE id = ?',
    [title, message, date, category, id]
  );

  res.json({ success: true, message: 'Announcement updated successfully.' });
};

router.put('/announcements/:id', handleUpdateAnnouncement);
router.put('/admin/announcements/:id', handleUpdateAnnouncement);

const handleDeleteAnnouncement = (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM announcements WHERE id = ?', [id]);
  res.json({ success: true, message: 'Announcement deleted.' });
};

router.delete('/announcements/:id', handleDeleteAnnouncement);
router.delete('/admin/announcements/:id', handleDeleteAnnouncement);

// ==================== EVENTS ====================
const handleGetEvents = (req: Request, res: Response) => {
  const events = queryAll('SELECT * FROM events ORDER BY id ASC');
  res.json(events);
};

router.get('/events', handleGetEvents);
router.get('/admin/events', handleGetEvents);

const handleCreateEvent = (req: Request, res: Response) => {
  const { title, date, time, venue, description, category } = req.body;
  if (!title || !date) {
    return res.status(400).json({ message: 'Event title and date are required.' });
  }

  execute(
    'INSERT INTO events (title, date, time, venue, description, category) VALUES (?, ?, ?, ?, ?, ?)',
    [title, date, time || '10:00 AM', venue || 'Rajagiri Campus', description || '', category || 'Academic']
  );

  res.json({ success: true, message: 'Event added successfully.' });
};

router.post('/events', handleCreateEvent);
router.post('/admin/events', handleCreateEvent);

const handleUpdateEvent = (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, date, time, venue, description, category } = req.body;

  execute(
    'UPDATE events SET title = ?, date = ?, time = ?, venue = ?, description = ?, category = ? WHERE id = ?',
    [title, date, time, venue, description, category, id]
  );

  res.json({ success: true, message: 'Event updated.' });
};

router.put('/events/:id', handleUpdateEvent);
router.put('/admin/events/:id', handleUpdateEvent);

const handleDeleteEvent = (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM events WHERE id = ?', [id]);
  res.json({ success: true, message: 'Event deleted.' });
};

router.delete('/events/:id', handleDeleteEvent);
router.delete('/admin/events/:id', handleDeleteEvent);

// ==================== TIMETABLE ====================
const handleGetTimetable = (req: Request, res: Response) => {
  const { class: className, day } = req.query;
  let sql = 'SELECT * FROM timetable WHERE 1=1';
  const params: any[] = [];

  if (className) {
    sql += ' AND class = ?';
    params.push(className);
  }
  if (day) {
    sql += ' AND day = ?';
    params.push(day);
  }

  sql += ' ORDER BY id ASC';
  const timetable = queryAll(sql, params);
  res.json(timetable);
};

router.get('/timetable', handleGetTimetable);
router.get('/admin/timetable', handleGetTimetable);

const handleCreateTimetable = (req: Request, res: Response) => {
  const { day, time, subject, room, teacher, class: className } = req.body;
  if (!day || !time || !subject || !room) {
    return res.status(400).json({ message: 'Day, Time, Subject, and Room are required.' });
  }

  execute(
    'INSERT INTO timetable (day, time, subject, room, teacher, class) VALUES (?, ?, ?, ?, ?, ?)',
    [day, time, subject, room, teacher || '', className || 'S5 CSE A']
  );

  res.json({ success: true, message: 'Timetable entry added successfully.' });
};

router.post('/timetable', handleCreateTimetable);
router.post('/admin/timetable', handleCreateTimetable);

const handleDeleteTimetable = (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM timetable WHERE id = ?', [id]);
  res.json({ success: true, message: 'Timetable entry deleted.' });
};

router.delete('/timetable/:id', handleDeleteTimetable);
router.delete('/admin/timetable/:id', handleDeleteTimetable);

// ==================== BUS TRACKING ====================
const handleGetBuses = (req: Request, res: Response) => {
  const buses = queryAll('SELECT * FROM buses ORDER BY id ASC');
  const parsed = buses.map((b) => ({
    ...b,
    stops: JSON.parse(b.stops || '[]'),
  }));
  res.json(parsed);
};

router.get('/buses', handleGetBuses);
router.get('/admin/buses', handleGetBuses);

const handleGetBusByNo = (req: Request, res: Response) => {
  const { busNo } = req.params;
  const bus = queryOne('SELECT * FROM buses WHERE bus_no = ?', [busNo]);
  if (!bus) {
    return res.status(404).json({ message: 'Bus not found.' });
  }
  res.json({
    ...bus,
    stops: JSON.parse(bus.stops || '[]'),
  });
};

router.get('/buses/:busNo', handleGetBusByNo);
router.get('/admin/buses/:busNo', handleGetBusByNo);

const handleUpdateBus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { current_stop, status, driver_name, driver_phone, route_name } = req.body;

  execute(
    'UPDATE buses SET current_stop = ?, status = ?, driver_name = ?, driver_phone = ?, route_name = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
    [current_stop, status, driver_name, driver_phone, route_name, id]
  );

  res.json({ success: true, message: 'Bus details updated successfully.' });
};

router.put('/buses/:id', handleUpdateBus);
router.post('/buses/:id', handleUpdateBus);
router.put('/admin/buses/:id', handleUpdateBus);
router.post('/admin/buses/:id', handleUpdateBus);

// ==================== HALL TICKET & EXAMINATIONS ====================
function formatExamDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year} (${dayName})`;
  } catch (e) {
    return dateStr;
  }
}

function getExamMonthYear(examList: Array<{ exam_date: string }>): { month: string; year: string } {
  if (examList.length > 0 && examList[0].exam_date) {
    try {
      const d = new Date(examList[0].exam_date);
      if (!isNaN(d.getTime())) {
        return {
          month: d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
          year: String(d.getFullYear()),
        };
      }
    } catch (e) {}
  }
  return { month: 'OCTOBER', year: '2026' };
}

// Student-Specific Hall Ticket API (Driven entirely by SQLite)
router.get('/students/:uid/hall-ticket', (req: Request, res: Response) => {
  const { uid } = req.params;
  const student = queryOne<{
    id: number;
    uid: string;
    name: string;
    class: string;
    email: string;
    phone: string;
    gender: string;
    cgpa: number;
    completed_credits: number;
    department: string;
    semester: string;
    photo?: string;
    signature?: string;
  }>('SELECT * FROM students WHERE uid = ?', [uid]) ||
    queryOne('SELECT * FROM students LIMIT 1');

  if (!student) {
    return res.status(404).json({ message: 'Student not found in database.' });
  }

  const semester = student.semester || (student.class ? student.class.split(' ')[0] : 'S5');
  const section = student.class ? student.class.replace(semester, '').trim() || 'A' : 'A';

  // Fetch applicable examinations for student's semester from SQLite
  let rawExams = queryAll<{
    id: number;
    semester: string;
    course_code: string;
    course_title: string;
    exam_date: string;
    session_time: string;
    hall_no: string;
    exam_centre: string;
  }>('SELECT * FROM examinations WHERE semester = ? ORDER BY exam_date ASC, id ASC', [semester]);

  if (rawExams.length === 0) {
    rawExams = queryAll('SELECT * FROM examinations WHERE semester = "S5" ORDER BY exam_date ASC, id ASC');
  }

  const { month, year } = getExamMonthYear(rawExams);
  const defaultCentre = rawExams.length > 0 && rawExams[0].exam_centre ? rawExams[0].exam_centre : 'RSET Main Campus, Block C';

  const examinations = rawExams.map((ex) => ({
    id: ex.id,
    semester: ex.semester,
    courseCode: ex.course_code,
    courseTitle: ex.course_title,
    examDate: ex.exam_date,
    date: formatExamDate(ex.exam_date),
    sessionTime: ex.session_time,
    hallNo: ex.hall_no,
    examCentre: ex.exam_centre || defaultCentre,
  }));

  res.json({
    student: {
      id: student.id,
      uid: student.uid,
      name: student.name,
      class: student.class,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      cgpa: student.cgpa,
      completed_credits: student.completed_credits,
      department: student.department,
      semester: student.semester,
      section: section,
      photo: student.photo,
      signature: student.signature,
    },
    examCentre: defaultCentre,
    examSession: `B.TECH ${semester} REGULAR EXAMINATION`,
    examMonth: month,
    examYear: year,
    badgeTitle: `HALL TICKET — B.TECH ${semester} REGULAR EXAMINATION (${month} ${year})`,
    examinations,
  });
});

// Admin: Get all examinations
router.get('/admin/examinations', (req: Request, res: Response) => {
  const { semester } = req.query;
  let sql = 'SELECT * FROM examinations';
  const params: any[] = [];
  if (semester && semester !== 'All') {
    sql += ' WHERE semester = ?';
    params.push(semester);
  }
  sql += ' ORDER BY semester ASC, exam_date ASC, id ASC';
  const rows = queryAll(sql, params);
  res.json(rows);
});

// Admin: Add examination
router.post('/admin/examinations', (req: Request, res: Response) => {
  const { semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre } = req.body;
  if (!semester || !course_code || !course_title || !exam_date || !session_time || !hall_no) {
    return res.status(400).json({ message: 'All examination fields are required.' });
  }

  const result = execute(
    `INSERT INTO examinations (semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre || 'RSET Main Campus, Block C']
  );

  res.json({ success: true, message: 'Examination added successfully to SQLite schedule.', id: result.lastInsertRowid });
});

// Admin: Update examination
router.put('/admin/examinations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre } = req.body;

  execute(
    `UPDATE examinations
     SET semester = ?, course_code = ?, course_title = ?, exam_date = ?, session_time = ?, hall_no = ?, exam_centre = ?
     WHERE id = ?`,
    [semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre || 'RSET Main Campus, Block C', id]
  );

  res.json({ success: true, message: 'Examination updated successfully.' });
});

// Admin: Delete examination
router.delete('/admin/examinations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM examinations WHERE id = ?', [id]);
  res.json({ success: true, message: 'Examination deleted from schedule.' });
});

router.get('/exams', (req: Request, res: Response) => {
  const uid = (req.query.uid as string) || 'RSET2024CSE001';
  const student = queryOne('SELECT uid, name, class, department, semester, photo, signature FROM students WHERE uid = ?', [uid]) ||
    queryOne('SELECT uid, name, class, department, semester, photo, signature FROM students LIMIT 1');

  const targetUid = student ? student.uid : uid;
  const targetSemester = student?.semester || 'S5';
  
  // Return examinations formatted for table
  const rawExams = queryAll('SELECT * FROM examinations WHERE semester = ? ORDER BY exam_date ASC, id ASC', [targetSemester]);
  if (rawExams.length > 0) {
    const formatted = rawExams.map((e) => ({
      id: e.id,
      student_uid: targetUid,
      course_code: e.course_code,
      course_name: e.course_title,
      date: formatExamDate(e.exam_date),
      time: e.session_time,
      room: e.hall_no,
      venue: e.exam_centre,
    }));
    return res.json(formatted);
  }

  const exams = queryAll('SELECT * FROM exams WHERE student_uid = ? ORDER BY id ASC', [targetUid]);
  res.json(exams);
});

router.get('/exams/:uid', (req: Request, res: Response) => {
  const { uid } = req.params;
  const student = queryOne('SELECT uid, name, class, department, semester, photo, signature FROM students WHERE uid = ?', [uid]);
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const semester = student.semester || 'S5';
  const rawExams = queryAll('SELECT * FROM examinations WHERE semester = ? ORDER BY exam_date ASC, id ASC', [semester]);
  const { month, year } = getExamMonthYear(rawExams);

  res.json({
    student,
    exam_session: `B.Tech ${semester} Regular Examination - ${month} ${year}`,
    institution: 'Rajagiri School of Engineering & Technology (Autonomous)',
    controller: 'Dr. Vinod Kumar P., Controller of Examinations',
    exams: rawExams,
  });
});

// ==================== SUBJECTS ====================
router.post('/subjects', (req: Request, res: Response) => {
  const { code, name, teacher, semester, credits } = req.body;
  if (!code || !name || !semester) {
    return res.status(400).json({ message: 'Course code, title, and semester are required.' });
  }
  const result = execute(
    'INSERT INTO subjects (code, name, teacher, semester, credits) VALUES (?, ?, ?, ?, ?)',
    [code, name, teacher || 'Faculty', semester, Number(credits) || 3]
  );
  res.json({ success: true, message: 'Subject created successfully.', id: result.lastInsertRowid });
});

router.put('/subjects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { code, name, teacher, semester, credits } = req.body;
  execute(
    'UPDATE subjects SET code = ?, name = ?, teacher = ?, semester = ?, credits = ? WHERE id = ?',
    [code, name, teacher || 'Faculty', semester, Number(credits) || 3, id]
  );
  res.json({ success: true, message: 'Subject updated successfully.' });
});

router.delete('/subjects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  execute('DELETE FROM marks WHERE subject_id = ?', [id]);
  execute('DELETE FROM attendance WHERE subject_id = ?', [id]);
  execute('DELETE FROM attendance_records WHERE subject_id = ?', [id]);
  execute('DELETE FROM subjects WHERE id = ?', [id]);
  res.json({ success: true, message: 'Subject deleted successfully.' });
});

// ==================== ADMIN DASHBOARD STATS ====================
router.get('/admin/stats', (req: Request, res: Response) => {
  const totalStudents = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students')?.count || 0;
  
  const attTotal = queryOne<{ present: number; total: number }>(
    'SELECT SUM(present_classes) as present, SUM(total_classes) as total FROM attendance'
  );
  const present = attTotal?.present || 0;
  const total = attTotal?.total || 1;
  const avgAttendance = total > 0 ? ((present / total) * 100).toFixed(1) : '86.4';

  const pendingActivities = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM activities WHERE status = 'Pending'"
  )?.count || 0;

  const feedbackResponses = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM feedback')?.count || 0;

  const upcomingExams = queryOne<{ count: number }>('SELECT COUNT(DISTINCT subject) as count FROM exams')?.count || 0;

  const recentPendingActivities = queryAll(`
    SELECT a.*, s.name as student_name, s.class as student_class
    FROM activities a
    JOIN students s ON a.student_uid = s.uid
    WHERE a.status = 'Pending'
    ORDER BY a.submitted_at DESC
    LIMIT 5
  `);

  res.json({
    totalStudents,
    averageAttendance: parseFloat(avgAttendance),
    pendingActivities,
    feedbackResponses,
    upcomingExams,
    recentPendingActivities,
  });
});

export default router;
