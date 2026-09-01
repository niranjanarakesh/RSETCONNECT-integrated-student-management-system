import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'rsms.sqlite');
let dbInstance: Database | null = null;

// Helper to save db state to disk atomically
export function saveDb(): void {
  if (dbInstance) {
    try {
      const data = dbInstance.export();
      const buffer = Buffer.from(data);
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, buffer);
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save SQLite database atomically:', err);
      try {
        const data = dbInstance.export();
        fs.writeFileSync(DB_FILE, Buffer.from(data));
      } catch (fallbackErr) {
        console.error('Fallback save failed:', fallbackErr);
      }
    }
  }
}

// Wrapper helpers to make sql.js feel like better-sqlite3
export function getDb(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized yet');
  }
  return dbInstance;
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const db = getDb();
  if (params && params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  saveDb();
  
  // Get last insert rowid
  const res = db.exec("SELECT last_insert_rowid() as id, changes() as ch");
  let lastId = 0;
  let changes = 0;
  if (res.length > 0 && res[0].values.length > 0) {
    lastId = Number(res[0].values[0][0]) || 0;
    changes = Number(res[0].values[0][1]) || 0;
  }
  return { lastInsertRowid: lastId, changes };
}

function setupDatabaseSchemaAndData(db: Database) {
  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'student123',
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '+91 98470 12345',
      gender TEXT DEFAULT 'Female',
      cgpa REAL NOT NULL DEFAULT 9.40,
      completed_credits INTEGER NOT NULL DEFAULT 84,
      department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
      semester TEXT NOT NULL DEFAULT 'S5',
      photo TEXT,
      signature TEXT
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      teacher TEXT NOT NULL,
      semester TEXT NOT NULL DEFAULT 'S5',
      credits INTEGER NOT NULL DEFAULT 4
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_uid TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      present_classes INTEGER NOT NULL,
      total_classes INTEGER NOT NULL,
      absent_classes INTEGER NOT NULL DEFAULT 0,
      duty_leave_classes INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_uid) REFERENCES students(uid),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      UNIQUE(student_uid, subject_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_uid TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      class TEXT NOT NULL,
      semester TEXT NOT NULL DEFAULT 'S5',
      date TEXT NOT NULL,
      period INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Duty Leave')),
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_uid) REFERENCES students(uid),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_uid TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      internal1 REAL DEFAULT 0,
      internal2 REAL DEFAULT 0,
      assignment REAL DEFAULT 0,
      project REAL DEFAULT 0,
      max_internal1 REAL DEFAULT 30,
      max_internal2 REAL DEFAULT 30,
      max_assignment REAL DEFAULT 10,
      max_project REAL DEFAULT 10,
      FOREIGN KEY (student_uid) REFERENCES students(uid),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_uid TEXT NOT NULL,
      semester TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      certificate_url TEXT,
      points INTEGER DEFAULT 0,
      requested_points INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'Pending',
      remarks TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_uid) REFERENCES students(uid)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher TEXT NOT NULL,
      subject TEXT NOT NULL,
      q1 TEXT NOT NULL,
      q2 TEXT NOT NULL,
      q3 TEXT NOT NULL,
      q4 TEXT NOT NULL,
      q5 TEXT NOT NULL,
      q6 TEXT NOT NULL,
      q7 TEXT NOT NULL,
      q8 TEXT NOT NULL,
      q9 TEXT NOT NULL,
      q10 TEXT NOT NULL,
      score REAL NOT NULL,
      comments TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      author TEXT DEFAULT 'Academic Office'
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT DEFAULT '09:30 AM',
      venue TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Academic'
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      subject TEXT NOT NULL,
      room TEXT NOT NULL,
      teacher TEXT,
      class TEXT DEFAULT 'S5 CSE A'
    );

    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_no TEXT UNIQUE NOT NULL,
      route_name TEXT NOT NULL,
      stops TEXT NOT NULL,
      current_stop TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'On Route',
      driver_name TEXT,
      driver_phone TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_uid TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      exam_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      room TEXT NOT NULL,
      seat_no TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS examinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester TEXT NOT NULL,
      course_code TEXT NOT NULL,
      course_title TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      session_time TEXT NOT NULL,
      hall_no TEXT NOT NULL,
      exam_centre TEXT DEFAULT 'RSET Main Campus, Block C'
    );
  `);

  // Run schema migrations for any existing databases with missing columns
  runSchemaMigrations(db);

  // Check if initial demo data needs to be seeded or migrated
  const studentCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
  if (!studentCount || studentCount.count === 0) {
    seedDemoData(db);
  } else {
    // Migration & ensure all semesters and records exist
    migrateStudentRecords(db);
  }

  // Ensure subjects for S1 through S8 exist
  ensureAllSemesterSubjects(db);
  // Ensure attendance records for S1..S5 exist for all students
  ensureAllAttendanceRecords(db);
  // Ensure examinations schedule for all semesters exists
  ensureAllSemesterExaminations(db);
  // Ensure marks for all completed and active semesters exist
  ensureAllSemesterMarks(db);
  // Ensure feedback responses exist
  ensureAllFeedbackData(db);
}

export async function initializeDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  
  let db: Database | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      if (fileBuffer.length > 0) {
        db = new SQL.Database(fileBuffer);
        // Verification / integrity check
        db.exec("PRAGMA schema_version; SELECT 1;");
      } else {
        throw new Error('Database file is 0 bytes');
      }
    } catch (loadErr) {
      console.warn('Existing SQLite file corrupted or malformed, recreating fresh database:', loadErr);
      try {
        const backupName = `${DB_FILE}.corrupt.${Date.now()}`;
        fs.renameSync(DB_FILE, backupName);
      } catch {
        try { fs.unlinkSync(DB_FILE); } catch {}
      }
      db = null;
    }
  }
  
  if (!db) {
    db = new SQL.Database();
  }
  dbInstance = db;

  try {
    setupDatabaseSchemaAndData(db);
  } catch (schemaErr) {
    console.error('Error during schema/seed setup, wiping and building clean database:', schemaErr);
    db = new SQL.Database();
    dbInstance = db;
    setupDatabaseSchemaAndData(db);
  }

  saveDb();
  return db;
}

function runSchemaMigrations(db: Database) {
  const getTableColumns = (table: string): string[] => {
    try {
      const res = db.exec(`PRAGMA table_info(${table})`);
      if (res.length > 0 && res[0].values) {
        return res[0].values.map((row) => String(row[1]));
      }
    } catch (err) {
      console.warn(`Could not get columns for table ${table}:`, err);
    }
    return [];
  };

  const addColumnIfNotExists = (table: string, column: string, columnDef: string) => {
    const cols = getTableColumns(table);
    if (!cols.includes(column)) {
      try {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef}`);
      } catch (err) {
        console.warn(`Migration notice: could not add column ${column} to table ${table}:`, err);
      }
    }
  };

  // Ensure period column is added
  try {
    db.run("ALTER TABLE attendance_records ADD COLUMN period INTEGER NOT NULL DEFAULT 1");
  } catch (e) {
    // Column might already exist
  }

  addColumnIfNotExists('students', 'password', "TEXT NOT NULL DEFAULT 'student123'");
  addColumnIfNotExists('students', 'gender', "TEXT DEFAULT 'Female'");
  addColumnIfNotExists('students', 'department', "TEXT NOT NULL DEFAULT 'Computer Science & Engineering'");
  addColumnIfNotExists('students', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('students', 'photo', 'TEXT');
  addColumnIfNotExists('students', 'signature', 'TEXT');

  addColumnIfNotExists('subjects', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('subjects', 'credits', 'INTEGER NOT NULL DEFAULT 4');

  addColumnIfNotExists('attendance', 'absent_classes', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExists('attendance', 'duty_leave_classes', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExists('attendance', 'last_updated', 'TEXT DEFAULT CURRENT_TIMESTAMP');

  addColumnIfNotExists('attendance_records', 'class', "TEXT NOT NULL DEFAULT 'S5 CSE A'");
  addColumnIfNotExists('attendance_records', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('attendance_records', 'period', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfNotExists('attendance_records', 'recorded_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');

  try {
    db.run('DROP INDEX IF EXISTS idx_att_rec_unique');
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_att_rec_period_unique ON attendance_records (student_uid, semester, date, period)');
  } catch (e) {
    // ignore
  }

  addColumnIfNotExists('marks', 'assignment', 'REAL DEFAULT 0');
  addColumnIfNotExists('marks', 'project', 'REAL DEFAULT 0');
  addColumnIfNotExists('marks', 'max_internal1', 'REAL DEFAULT 30');
  addColumnIfNotExists('marks', 'max_internal2', 'REAL DEFAULT 30');
  addColumnIfNotExists('marks', 'max_assignment', 'REAL DEFAULT 10');
  addColumnIfNotExists('marks', 'max_project', 'REAL DEFAULT 10');

  addColumnIfNotExists('activities', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('activities', 'requested_points', 'INTEGER NOT NULL DEFAULT 10');
  addColumnIfNotExists('activities', 'remarks', 'TEXT');

  addColumnIfNotExists('timetable', 'class', "TEXT DEFAULT 'S5 CSE A'");

  addColumnIfNotExists('examinations', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('examinations', 'course_code', 'TEXT');
  addColumnIfNotExists('examinations', 'course_title', 'TEXT');
  addColumnIfNotExists('examinations', 'exam_date', 'TEXT');
  addColumnIfNotExists('examinations', 'session_time', 'TEXT');
  addColumnIfNotExists('examinations', 'hall_no', 'TEXT');
  addColumnIfNotExists('examinations', 'exam_centre', "TEXT DEFAULT 'RSET Main Campus, Block C'");

  addColumnIfNotExists('feedback', 'subject_code', 'TEXT');
  addColumnIfNotExists('feedback', 'semester', "TEXT NOT NULL DEFAULT 'S5'");
  addColumnIfNotExists('feedback', 'academic_year', "TEXT NOT NULL DEFAULT '2025-26'");
}

function ensureAllSemesterSubjects(db: Database) {
  const allSubjects = [
    // S1 Subjects
    { code: 'MAT101', name: 'Linear Algebra & Calculus', teacher: 'Dr. Deepa K.', semester: 'S1', credits: 4 },
    { code: 'PHT100', name: 'Engineering Physics', teacher: 'Dr. Vinod Kumar', semester: 'S1', credits: 4 },
    { code: 'EST110', name: 'Engineering Graphics', teacher: 'Prof. Arun M.', semester: 'S1', credits: 3 },
    { code: 'EST100', name: 'Basics of Civil & Mechanical Engg', teacher: 'Prof. Thomas P.', semester: 'S1', credits: 4 },
    { code: 'HUN101', name: 'Life Skills', teacher: 'Prof. Sarah V.', semester: 'S1', credits: 2 },

    // S2 Subjects
    { code: 'MAT102', name: 'Vector Calculus & Diff Eq', teacher: 'Dr. Deepa K.', semester: 'S2', credits: 4 },
    { code: 'CYT100', name: 'Engineering Chemistry', teacher: 'Dr. Sunitha P.', semester: 'S2', credits: 4 },
    { code: 'EST102', name: 'Programming in C', teacher: 'Prof. Paul P. J.', semester: 'S2', credits: 4 },
    { code: 'EST130', name: 'Basics of Electrical & Electronics', teacher: 'Prof. Biju N.', semester: 'S2', credits: 4 },
    { code: 'HUN102', name: 'Professional Communication', teacher: 'Prof. Sarah V.', semester: 'S2', credits: 2 },

    // S3 Subjects
    { code: 'MAT203', name: 'Discrete Mathematical Structures', teacher: 'Dr. Deepa K.', semester: 'S3', credits: 4 },
    { code: 'CST201', name: 'Data Structures', teacher: 'Prof. Jisha G.', semester: 'S3', credits: 4 },
    { code: 'CST203', name: 'Logic System Design', teacher: 'Prof. Mary Priya', semester: 'S3', credits: 4 },
    { code: 'CST205', name: 'Object Oriented Programming Java', teacher: 'Dr. Preetha K. G.', semester: 'S3', credits: 4 },
    { code: 'EST200', name: 'Design & Engineering', teacher: 'Prof. Joseph K.', semester: 'S3', credits: 2 },

    // S4 Subjects
    { code: 'MAT206', name: 'Graph Theory', teacher: 'Dr. Deepa K.', semester: 'S4', credits: 4 },
    { code: 'CST202', name: 'Computer Organization & Architecture', teacher: 'Dr. Binu A.', semester: 'S4', credits: 4 },
    { code: 'CST204', name: 'Database Management Systems', teacher: 'Prof. Jisha G.', semester: 'S4', credits: 4 },
    { code: 'CST206', name: 'Operating Systems Concepts', teacher: 'Prof. Mary Priya', semester: 'S4', credits: 4 },
    { code: 'HUT200', name: 'Professional Ethics', teacher: 'Prof. Sarah V.', semester: 'S4', credits: 2 },

    // S5 Subjects
    { code: 'CST301', name: 'Theory of Computation', teacher: 'Dr. Binu A.', semester: 'S5', credits: 4 },
    { code: 'CST303', name: 'Operating Systems', teacher: 'Prof. Mary Priya', semester: 'S5', credits: 4 },
    { code: 'CST305', name: 'Web Programming', teacher: 'Prof. Jisha G.', semester: 'S5', credits: 4 },
    { code: 'MAT301', name: 'Probability & Statistics', teacher: 'Dr. Deepa K.', semester: 'S5', credits: 4 },
    { code: 'CST307', name: 'Python for Engineers', teacher: 'Prof. Paul P. J.', semester: 'S5', credits: 3 },
    { code: 'CST309', name: 'Software Engineering', teacher: 'Dr. Preetha K. G.', semester: 'S5', credits: 3 },
    { code: 'MCN301', name: 'Constitution of India', teacher: 'Prof. Joseph K.', semester: 'S5', credits: 2 },

    // S6 Subjects
    { code: 'CST302', name: 'Compiler Design', teacher: 'Dr. Binu A.', semester: 'S6', credits: 4 },
    { code: 'CST304', name: 'Computer Networks', teacher: 'Prof. Jisha G.', semester: 'S6', credits: 4 },
    { code: 'CST306', name: 'Data Analytics', teacher: 'Prof. Paul P. J.', semester: 'S6', credits: 4 },
    { code: 'CST308', name: 'Algorithm Analysis & Design', teacher: 'Dr. Preetha K. G.', semester: 'S6', credits: 4 },
    { code: 'HUT310', name: 'Management for Engineers', teacher: 'Prof. Sarah V.', semester: 'S6', credits: 3 },

    // S7 Subjects
    { code: 'CST401', name: 'Artificial Intelligence', teacher: 'Dr. Binu A.', semester: 'S7', credits: 4 },
    { code: 'CST403', name: 'Cloud Computing', teacher: 'Prof. Mary Priya', semester: 'S7', credits: 4 },
    { code: 'CST405', name: 'Information Security', teacher: 'Prof. Jisha G.', semester: 'S7', credits: 3 },
    { code: 'CST407', name: 'Industrial IoT', teacher: 'Prof. Paul P. J.', semester: 'S7', credits: 3 },

    // S8 Subjects
    { code: 'CST402', name: 'Distributed Computing', teacher: 'Dr. Binu A.', semester: 'S8', credits: 4 },
    { code: 'CST404', name: 'Deep Learning', teacher: 'Dr. Preetha K. G.', semester: 'S8', credits: 4 },
    { code: 'CSD416', name: 'Main Project Phase II', teacher: 'Faculty Mentors', semester: 'S8', credits: 4 },
  ];

  for (const s of allSubjects) {
    const existing = queryOne('SELECT id FROM subjects WHERE code = ?', [s.code]);
    if (!existing) {
      db.run(
        'INSERT INTO subjects (code, name, teacher, semester, credits) VALUES (?, ?, ?, ?, ?)',
        [s.code, s.name, s.teacher, s.semester, s.credits]
      );
    }
  }
}

function ensureAllAttendanceRecords(db: Database) {
  // Check if period-wise records are already seeded
  let hasPeriodRecords = false;
  try {
    const checkPeriod = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM attendance_records WHERE period >= 2'
    );
    if (checkPeriod && checkPeriod.count > 100) {
      hasPeriodRecords = true;
    }
  } catch (e) {
    hasPeriodRecords = false;
  }

  if (hasPeriodRecords) {
    return;
  }

  // Clear existing attendance records to rebuild clean period-wise dataset
  try {
    db.run('DELETE FROM attendance_records');
  } catch (e) {
    // ignore
  }

  const students = queryAll<{ uid: string; class: string; semester: string }>('SELECT uid, class, semester FROM students');
  const allSubjects = queryAll<{ id: number; code: string; name: string; semester: string }>('SELECT id, code, name, semester FROM subjects');

  const subjectMap = new Map<string, number>();
  for (const s of allSubjects) {
    subjectMap.set(`${s.semester}_${s.code}`, s.id);
  }

  // Schedule template for S5 (Semester 5)
  // Day of week: 1 (Mon), 2 (Tue), 3 (Wed), 4 (Thu), 5 (Fri)
  const s5WeeklySchedule: Record<number, { period: number; code: string }[]> = {
    1: [
      { period: 1, code: 'CST301' },
      { period: 2, code: 'CST303' },
      { period: 3, code: 'CST305' },
      { period: 4, code: 'MAT301' },
      { period: 5, code: 'CST307' },
      { period: 6, code: 'CST309' },
    ],
    2: [
      { period: 1, code: 'CST305' },
      { period: 2, code: 'CST301' },
      { period: 3, code: 'CST307' },
      { period: 4, code: 'CST303' },
      { period: 5, code: 'MAT301' },
      { period: 6, code: 'MCN301' },
    ],
    3: [
      { period: 1, code: 'MAT301' },
      { period: 2, code: 'CST305' },
      { period: 3, code: 'CST303' },
      { period: 4, code: 'CST309' },
      { period: 5, code: 'CST301' },
    ],
    4: [
      { period: 1, code: 'CST303' },
      { period: 2, code: 'MAT301' },
      { period: 3, code: 'CST301' },
      { period: 4, code: 'CST305' },
      { period: 5, code: 'CST309' },
      { period: 6, code: 'CST307' },
    ],
    5: [
      { period: 1, code: 'CST307' },
      { period: 2, code: 'CST309' },
      { period: 3, code: 'MCN301' },
      { period: 4, code: 'CST305' },
      { period: 5, code: 'CST303' },
    ],
  };

  // Define S5 dates:
  // July 2026:
  const julyDays = [
    { date: '2026-07-15', dow: 3, periods: 5 },
    { date: '2026-07-16', dow: 4, periods: 5 }, // matching 16 Jul example
    { date: '2026-07-17', dow: 5, periods: 5 },
    { date: '2026-07-18', dow: 2, periods: 6 }, // matching 18 Jul example
    { date: '2026-07-20', dow: 1, periods: 6 },
    { date: '2026-07-21', dow: 2, periods: 6 },
    { date: '2026-07-22', dow: 3, periods: 5 },
    { date: '2026-07-23', dow: 4, periods: 6 },
    { date: '2026-07-24', dow: 5, periods: 5 },
    { date: '2026-07-27', dow: 1, periods: 6 },
    { date: '2026-07-28', dow: 2, periods: 6 },
    { date: '2026-07-29', dow: 3, periods: 5 },
    { date: '2026-07-30', dow: 4, periods: 6 },
    { date: '2026-07-31', dow: 5, periods: 5 },
  ];

  // August 2026: exactly 88 total scheduled periods
  const augustDays = [
    { date: '2026-08-03', dow: 1, periods: 6 },
    { date: '2026-08-04', dow: 2, periods: 6 },
    { date: '2026-08-05', dow: 3, periods: 5 },
    { date: '2026-08-06', dow: 4, periods: 6 },
    { date: '2026-08-07', dow: 5, periods: 5 },
    { date: '2026-08-10', dow: 1, periods: 6 },
    { date: '2026-08-11', dow: 2, periods: 6 },
    { date: '2026-08-12', dow: 3, periods: 5 },
    { date: '2026-08-13', dow: 4, periods: 6 },
    { date: '2026-08-14', dow: 5, periods: 5 },
    { date: '2026-08-17', dow: 1, periods: 6 },
    { date: '2026-08-18', dow: 2, periods: 6 },
    { date: '2026-08-19', dow: 3, periods: 5 },
    { date: '2026-08-20', dow: 4, periods: 5 },
    { date: '2026-08-21', dow: 5, periods: 5 },
    { date: '2026-08-24', dow: 1, periods: 5 },
  ]; // Total scheduled = 6+6+5+6+5+6+6+5+6+5+6+6+5+5+5+5 = 88 periods!

  // September 2026:
  const septDays = [
    { date: '2026-09-01', dow: 2, periods: 6 },
    { date: '2026-09-02', dow: 3, periods: 5 },
    { date: '2026-09-03', dow: 4, periods: 6 },
    { date: '2026-09-04', dow: 5, periods: 5 },
    { date: '2026-09-07', dow: 1, periods: 6 },
    { date: '2026-09-08', dow: 2, periods: 6 },
    { date: '2026-09-09', dow: 3, periods: 5 },
    { date: '2026-09-10', dow: 4, periods: 6 },
    { date: '2026-09-11', dow: 5, periods: 5 },
    { date: '2026-09-14', dow: 1, periods: 6 },
    { date: '2026-09-15', dow: 2, periods: 6 },
    { date: '2026-09-16', dow: 3, periods: 5 },
    { date: '2026-09-17', dow: 4, periods: 6 },
    { date: '2026-09-18', dow: 5, periods: 5 },
    { date: '2026-09-21', dow: 1, periods: 6 },
    { date: '2026-09-22', dow: 2, periods: 6 },
    { date: '2026-09-23', dow: 3, periods: 5 },
    { date: '2026-09-24', dow: 4, periods: 6 },
    { date: '2026-09-25', dow: 5, periods: 5 },
  ];

  const allS5Days = [...julyDays, ...augustDays, ...septDays];

  for (const st of students) {
    for (const day of allS5Days) {
      const schedule = s5WeeklySchedule[day.dow] || [];
      const scheduledPeriods = schedule.slice(0, day.periods);

      for (const slot of scheduledPeriods) {
        const subId = subjectMap.get(`S5_${slot.code}`);
        if (!subId) continue;

        let status = 'Present';

        if (st.uid === 'RSET2024CSE001') {
          // August 2026 exact distribution for Brinda Raj:
          // 82 Present, 4 Absent, 2 Duty Leave (Total = 88, 95.5%)
          if (day.date === '2026-08-05' && slot.period === 3) {
            status = 'Absent'; // 05 Aug CST303 Operating Systems
          } else if (day.date === '2026-08-12' && slot.period === 2) {
            status = 'Duty Leave'; // 12 Aug CST305 Web Programming
          } else if (day.date === '2026-08-14' && slot.period === 4) {
            status = 'Absent'; // 14 Aug CST305 Web Programming
          } else if (day.date === '2026-08-18' && slot.period === 2) {
            status = 'Duty Leave'; // 18 Aug CST301 Theory of Computation
          } else if (day.date === '2026-08-20' && slot.period === 1) {
            status = 'Absent'; // 20 Aug CST303 Operating Systems
          } else if (day.date === '2026-08-24' && slot.period === 2) {
            status = 'Absent'; // 24 Aug
          }
          // July 2026 exceptions matching prompt examples:
          else if (day.date === '2026-07-16' && slot.period === 3) {
            status = 'Absent'; // 16 Jul Period 3 CST305
          } else if (day.date === '2026-07-18' && slot.period === 2) {
            status = 'Duty Leave'; // 18 Jul Period 2 CST301
          } else if (day.date === '2026-07-18' && slot.period === 5) {
            status = 'Absent'; // 18 Jul Period 5 MAT301
          } else if (day.date === '2026-07-28' && slot.period === 4) {
            status = 'Absent';
          }
          // September 2026:
          else if (day.date === '2026-09-03' && slot.period === 4) {
            status = 'Absent';
          } else if (day.date === '2026-09-11' && slot.period === 3) {
            status = 'Duty Leave';
          } else if (day.date === '2026-09-17' && slot.period === 1) {
            status = 'Absent';
          }
        } else {
          // Dynamic realistic attendance for other students
          const studentNum = parseInt(st.uid.slice(-2)) || 2;
          const hash = (studentNum * 7 + slot.period * 11 + parseInt(day.date.slice(-2))) % 22;
          if (hash === 1) status = 'Duty Leave';
          else if (hash === 2 || hash === 3) status = 'Absent';
          else status = 'Present';
        }

        try {
          db.run(
            `INSERT OR REPLACE INTO attendance_records (student_uid, subject_id, class, semester, date, period, status)
             VALUES (?, ?, ?, 'S5', ?, ?, ?)`,
            [st.uid, subId, st.class || 'S5 CSE A', day.date, slot.period, status]
          );
        } catch (e) {
          // ignore
        }
      }
    }

    // Also generate period-wise attendance for past semesters S1, S2, S3, S4
    const pastSemConfigs: { sem: string; prefix: string; daysCount: number }[] = [
      { sem: 'S1', prefix: '2024-09', daysCount: 15 },
      { sem: 'S2', prefix: '2025-02', daysCount: 15 },
      { sem: 'S3', prefix: '2025-09', daysCount: 15 },
      { sem: 'S4', prefix: '2026-02', daysCount: 15 },
    ];

    for (const past of pastSemConfigs) {
      const pastSubs = queryAll<{ id: number; code: string }>('SELECT id, code FROM subjects WHERE semester = ?', [past.sem]);
      if (pastSubs.length === 0) continue;

      for (let dIdx = 1; dIdx <= past.daysCount; dIdx++) {
        const dayStr = `${past.prefix}-${String(dIdx * 2).padStart(2, '0')}`;
        const periodsCount = (dIdx % 2 === 0) ? 6 : 5;

        for (let p = 1; p <= periodsCount; p++) {
          const sub = pastSubs[(dIdx + p - 1) % pastSubs.length];
          let status = 'Present';
          if ((dIdx + p) % 19 === 0) status = 'Duty Leave';
          else if ((dIdx + p) % 11 === 0) status = 'Absent';

          try {
            db.run(
              `INSERT OR REPLACE INTO attendance_records (student_uid, subject_id, class, semester, date, period, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [st.uid, sub.id, st.class || 'S5 CSE A', past.sem, dayStr, p, status]
            );
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }

  // Synchronize aggregate attendance table so it matches attendance_records 100%
  try {
    db.run('DELETE FROM attendance');
    db.run(`
      INSERT INTO attendance (student_uid, subject_id, present_classes, total_classes, absent_classes, duty_leave_classes, last_updated)
      SELECT 
        student_uid,
        subject_id,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_classes,
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_classes,
        SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) as duty_leave_classes,
        CURRENT_TIMESTAMP
      FROM attendance_records
      GROUP BY student_uid, subject_id
    `);
  } catch (e) {
    console.error('Error synchronizing aggregate attendance table:', e);
  }
}

function migrateStudentRecords(db: Database) {
  try {
    // 1. Update RSET2024CSE001 to Brinda Raj and set common default avatar
    db.run(`
      UPDATE students 
      SET name = 'Brinda Raj', 
          email = 'rset2024cse001@rajagiri.edu.in', 
          signature = 'Brinda Raj',
          photo = '/assets/default_student_avatar.svg',
          class = 'S5 CSE A',
          semester = 'S5'
      WHERE uid = 'RSET2024CSE001'
    `);

    // Ensure all students have the common default student avatar if not set or referencing old individual photo
    db.run(`
      UPDATE students
      SET photo = '/assets/default_student_avatar.svg'
      WHERE photo IS NULL OR photo = '' OR photo LIKE '%student_brinda%'
    `);

    // Ensure all students have valid class and semester
    db.run(`
      UPDATE students 
      SET class = 'S5 CSE A'
      WHERE class IS NULL OR class = '' OR class = 'undefined'
    `);
    db.run(`
      UPDATE students 
      SET semester = 'S5'
      WHERE semester IS NULL OR semester = '' OR semester = 'undefined'
    `);

    // 2. Ensure all student emails strictly follow uid@rajagiri.edu.in
    db.run(`
      UPDATE students 
      SET email = LOWER(uid) || '@rajagiri.edu.in'
      WHERE email NOT LIKE '%@rajagiri.edu.in' OR email LIKE '%niranjana%'
    `);

    // 3. Ensure other students exist
    const studentsToEnsure = [
      { uid: 'RSET2024CSE002', name: 'Abhinav Krishnan', gender: 'Male', cgpa: 8.85, phone: '+91 98470 65432', sig: 'Abhinav K.' },
      { uid: 'RSET2024CSE003', name: 'Devika Menon', gender: 'Female', cgpa: 9.12, phone: '+91 98470 76543', sig: 'Devika M.' },
      { uid: 'RSET2024CSE004', name: 'Gautam Suresh', gender: 'Male', cgpa: 8.20, phone: '+91 98470 87654', sig: 'Gautam S.' },
      { uid: 'RSET2024CSE005', name: 'Ananya Nair', gender: 'Female', cgpa: 9.60, phone: '+91 98470 98765', sig: 'Ananya N.' },
      { uid: 'RSET2024CSE006', name: 'Farhan Ali', gender: 'Male', cgpa: 8.45, phone: '+91 98470 43210', sig: 'Farhan Ali' },
      { uid: 'RSET2024CSE007', name: 'Sneha Mathew', gender: 'Female', cgpa: 9.25, phone: '+91 98470 32109', sig: 'Sneha M.' },
      { uid: 'RSET2024CSE008', name: 'Rohan Varma', gender: 'Male', cgpa: 7.90, phone: '+91 98470 21098', sig: 'Rohan V.' },
    ];

    for (const st of studentsToEnsure) {
      const existing = queryOne('SELECT uid FROM students WHERE uid = ?', [st.uid]);
      if (!existing) {
        db.run(
          `INSERT INTO students (uid, password, name, class, email, phone, gender, cgpa, completed_credits, department, semester, signature)
           VALUES (?, 'student123', ?, 'S5 CSE A', ?, ?, ?, ?, 84, 'Computer Science & Engineering', 'S5', ?)`,
          [st.uid, st.name, `${st.uid.toLowerCase()}@rajagiri.edu.in`, st.phone, st.gender, st.cgpa, st.sig]
        );
      } else {
        db.run(
          `UPDATE students SET class = 'S5 CSE A', semester = 'S5' WHERE uid = ? AND (class IS NULL OR class = '')`,
          [st.uid]
        );
      }
    }

    // 4. Ensure attendance and marks for all students
    seedMissingRecords(db);
  } catch (err) {
    console.error('Migration notice:', err);
  }
}

function seedMissingRecords(db: Database) {
  // Ensure attendance for all students RSET2024CSE001 to RSET2024CSE008
  const studentList = ['RSET2024CSE001', 'RSET2024CSE002', 'RSET2024CSE003', 'RSET2024CSE004', 'RSET2024CSE005', 'RSET2024CSE006', 'RSET2024CSE007', 'RSET2024CSE008'];
  
  for (const sUid of studentList) {
    const attCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM attendance WHERE student_uid = ?', [sUid]);
    if (!attCount || attCount.count === 0) {
      // Seed attendance for 7 subjects
      const basePresent = sUid === 'RSET2024CSE003' || sUid === 'RSET2024CSE005' ? 25 : sUid === 'RSET2024CSE004' ? 19 : 23;
      for (let sId = 1; sId <= 7; sId++) {
        const total = sId % 2 === 0 ? 26 : 27;
        const present = Math.min(total, Math.max(16, basePresent + (sId % 3) - 1));
        db.run('INSERT INTO attendance (student_uid, subject_id, present_classes, total_classes) VALUES (?, ?, ?, ?)', [sUid, sId, present, total]);
      }
    }

    const marksCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM marks WHERE student_uid = ?', [sUid]);
    if (!marksCount || marksCount.count === 0) {
      const baseMark = sUid === 'RSET2024CSE001' ? 26 : sUid === 'RSET2024CSE005' ? 29 : sUid === 'RSET2024CSE004' ? 19 : 24;
      for (let sId = 1; sId <= 7; sId++) {
        const i1 = Math.min(30, baseMark + (sId % 2));
        const i2 = Math.min(30, baseMark + ((sId + 1) % 3));
        const assign = baseMark > 25 ? 10 : 9;
        const proj = baseMark > 25 ? 10 : 8.5;
        db.run(
          'INSERT INTO marks (student_uid, subject_id, internal1, internal2, assignment, project, max_internal1, max_internal2, max_assignment, max_project) VALUES (?, ?, ?, ?, ?, ?, 30, 30, 10, 10)',
          [sUid, sId, i1, i2, assign, proj]
        );
      }
    }

    const examCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM exams WHERE student_uid = ?', [sUid]);
    if (!examCount || examCount.count === 0) {
      const examSchedule = [
        { sub: 'Web Programming (CST305)', date: '18 September 2026' },
        { sub: 'Theory of Computation (CST301)', date: '19 September 2026' },
        { sub: 'Operating Systems (CST303)', date: '21 September 2026' },
        { sub: 'Probability & Statistics (MAT301)', date: '22 September 2026' },
        { sub: 'Software Engineering (CST309)', date: '23 September 2026' },
        { sub: 'Python for Engineers (CST307)', date: '24 September 2026' },
        { sub: 'Constitution of India (MCN301)', date: '25 September 2026' },
      ];
      for (const ex of examSchedule) {
        db.run(
          'INSERT INTO exams (student_uid, exam_name, subject, exam_date, exam_time, venue, room, seat_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [sUid, 'Internal Examination 2', ex.sub, ex.date, '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', `A204-${sUid.slice(-2)}`]
        );
      }
    }
  }

  // Seed sample activities for students if needed
  const actCount002 = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM activities WHERE student_uid = 'RSET2024CSE002'");
  if (!actCount002 || actCount002.count <= 1) {
    db.run(`
      INSERT INTO activities (student_uid, semester, category, title, description, certificate_url, points, requested_points, status, remarks, submitted_at) VALUES
      ('RSET2024CSE002', 'S3', 'Extracurricular & National Initiatives', 'State Level Robotics Championship', 'Secured 2nd Runner Up in Line Follower Robot Challenge.', '/uploads/demo_cert_2.pdf', 15, 15, 'Approved', 'Sports and Robotics Club verified', '2025-10-14 11:00:00'),
      ('RSET2024CSE002', 'S4', 'Professional', 'NPTEL Cloud Computing Course', 'Completed 8-week certification with Elite grade.', '/uploads/demo_cert_3.pdf', 20, 20, 'Approved', 'NPTEL official score verified', '2026-03-20 15:30:00'),
      ('RSET2024CSE002', 'S4', 'Volunteering & Leadership Skills', 'Disaster Relief Collection Drive', 'Campus volunteer in collecting essential supplies.', '/uploads/demo_cert_5.pdf', 12, 12, 'Approved', 'NSS Coordinator verified', '2026-05-10 10:00:00');
    `);
  }

  // Seed date-wise daily attendance records if not already populated
  seedDailyAttendanceRecords(db);
}

function seedDailyAttendanceRecords(db: Database) {
  const count = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM attendance_records');
  if (count && count.count > 0) return;

  const dates = [
    '2026-08-01', '2026-08-03', '2026-08-05', '2026-08-08',
    '2026-08-10', '2026-08-12', '2026-08-15', '2026-08-18',
    '2026-08-20', '2026-08-22', '2026-08-25', '2026-08-28'
  ];

  const students = queryAll<{ uid: string; class: string; semester: string }>('SELECT uid, class, semester FROM students');
  const subjects = queryAll<{ id: number }>('SELECT id FROM subjects WHERE semester = "S5"');

  for (const date of dates) {
    for (const sub of subjects) {
      for (const st of students) {
        let status = 'Present';
        // Give realistic, diverse attendance patterns per student
        if (date === '2026-08-05' && sub.id === 3) {
          // As highlighted in the prompt's example:
          if (st.uid === 'RSET2024CSE001') status = 'Present';
          else if (st.uid === 'RSET2024CSE002') status = 'Absent';
          else if (st.uid === 'RSET2024CSE003') status = 'Duty Leave';
          else status = (Number(st.uid.slice(-1)) % 3 === 0) ? 'Absent' : 'Present';
        } else {
          const hash = (st.uid.charCodeAt(st.uid.length - 1) + sub.id * 7 + parseInt(date.slice(-2))) % 20;
          if (hash === 0) status = 'Duty Leave';
          else if (hash === 1 || hash === 2) status = 'Absent';
          else status = 'Present';
        }

        try {
          db.run(
            `INSERT INTO attendance_records (student_uid, subject_id, class, semester, date, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [st.uid, sub.id, st.class || 'S5 CSE A', st.semester || 'S5', date, status]
          );
        } catch (e) {
          // ignore duplicate
        }
      }
    }
  }
}

function seedDemoData(db: Database) {
  // 1. Students
  db.run(`
    INSERT INTO students (uid, password, name, class, email, phone, gender, cgpa, completed_credits, department, semester, photo, signature)
    VALUES 
    ('RSET2024CSE001', 'student123', 'Brinda Raj', 'S5 CSE A', 'rset2024cse001@rajagiri.edu.in', '+91 98470 54321', 'Female', 9.40, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Brinda Raj'),
    ('RSET2024CSE002', 'student123', 'Abhinav Krishnan', 'S5 CSE A', 'rset2024cse002@rajagiri.edu.in', '+91 98470 65432', 'Male', 8.85, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Abhinav K.'),
    ('RSET2024CSE003', 'student123', 'Devika Menon', 'S5 CSE A', 'rset2024cse003@rajagiri.edu.in', '+91 98470 76543', 'Female', 9.12, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Devika M.'),
    ('RSET2024CSE004', 'student123', 'Gautam Suresh', 'S5 CSE A', 'rset2024cse004@rajagiri.edu.in', '+91 98470 87654', 'Male', 8.20, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Gautam S.'),
    ('RSET2024CSE005', 'student123', 'Ananya Nair', 'S5 CSE A', 'rset2024cse005@rajagiri.edu.in', '+91 98470 98765', 'Female', 9.60, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Ananya N.'),
    ('RSET2024CSE006', 'student123', 'Farhan Ali', 'S5 CSE A', 'rset2024cse006@rajagiri.edu.in', '+91 98470 43210', 'Male', 8.45, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Farhan Ali'),
    ('RSET2024CSE007', 'student123', 'Sneha Mathew', 'S5 CSE A', 'rset2024cse007@rajagiri.edu.in', '+91 98470 32109', 'Female', 9.25, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Sneha M.'),
    ('RSET2024CSE008', 'student123', 'Rohan Varma', 'S5 CSE A', 'rset2024cse008@rajagiri.edu.in', '+91 98470 21098', 'Male', 7.90, 84, 'Computer Science & Engineering', 'S5', '/assets/default_student_avatar.svg', 'Rohan V.');
  `);

  // 2. Subjects (7 subjects)
  db.run(`
    INSERT INTO subjects (code, name, teacher, semester, credits) VALUES
    ('CST301', 'Theory of Computation', 'Dr. Binu A.', 'S5', 4),
    ('CST303', 'Operating Systems', 'Prof. Mary Priya', 'S5', 4),
    ('CST305', 'Web Programming', 'Prof. Jisha G.', 'S5', 4),
    ('MAT301', 'Probability & Statistics', 'Dr. Deepa K.', 'S5', 4),
    ('CST307', 'Python for Engineers', 'Prof. Paul P. J.', 'S5', 3),
    ('CST309', 'Software Engineering', 'Dr. Preetha K. G.', 'S5', 3),
    ('MCN301', 'Constitution of India', 'Prof. Joseph K.', 'S5', 2);
  `);

  // 3. Attendance for Niranjana
  // Theory of Computation      24/27     88.9%
  // Operating Systems          23/26     88.5%
  // Web Programming            25/27     92.6%
  // Probability & Statistics   22/26     84.6%
  // Python for Engineers       24/27     88.9%
  // Software Engineering       23/27     85.2%
  // Constitution of India      26/27     96.3%
  db.run(`
    INSERT INTO attendance (student_uid, subject_id, present_classes, total_classes) VALUES
    ('RSET2024CSE001', 1, 24, 27),
    ('RSET2024CSE001', 2, 23, 26),
    ('RSET2024CSE001', 3, 25, 27),
    ('RSET2024CSE001', 4, 22, 26),
    ('RSET2024CSE001', 5, 24, 27),
    ('RSET2024CSE001', 6, 23, 27),
    ('RSET2024CSE001', 7, 26, 27),

    ('RSET2024CSE002', 1, 22, 27),
    ('RSET2024CSE002', 2, 21, 26),
    ('RSET2024CSE002', 3, 23, 27),
    ('RSET2024CSE002', 4, 20, 26),
    ('RSET2024CSE002', 5, 22, 27),
    ('RSET2024CSE002', 6, 21, 27),
    ('RSET2024CSE002', 7, 25, 27);
  `);

  // 4. Marks for Niranjana
  db.run(`
    INSERT INTO marks (student_uid, subject_id, internal1, internal2, assignment, project, max_internal1, max_internal2, max_assignment, max_project) VALUES
    ('RSET2024CSE001', 1, 26.0, 27.5, 9.5, 9.0, 30, 30, 10, 10),
    ('RSET2024CSE001', 2, 27.0, 26.0, 10.0, 9.5, 30, 30, 10, 10),
    ('RSET2024CSE001', 3, 24.0, 25.0, 10.0, 10.0, 30, 30, 10, 10),
    ('RSET2024CSE001', 4, 25.5, 24.0, 9.0, 9.0, 30, 30, 10, 10),
    ('RSET2024CSE001', 5, 28.0, 28.5, 10.0, 10.0, 30, 30, 10, 10),
    ('RSET2024CSE001', 6, 26.5, 25.0, 9.5, 9.5, 30, 30, 10, 10),
    ('RSET2024CSE001', 7, 29.0, 28.0, 10.0, 10.0, 30, 30, 10, 10);
  `);

  // 5. Activity points
  // Target:
  // Extracurricular: 32 / 20 ✓
  // Professional: 45 / 20 ✓
  // Volunteering & Leadership: 18 / 20 ⚠
  // Overall: 95 / 100
  // Plus 2 pending activities
  db.run(`
    INSERT INTO activities (student_uid, semester, category, title, description, certificate_url, points, requested_points, status, remarks, submitted_at) VALUES
    ('RSET2024CSE001', 'S2', 'Extracurricular & National Initiatives', 'National Youth Festival Classical Dance', 'Represented college in inter-university cultural fest and won 1st prize.', '/uploads/demo_cert_1.pdf', 20, 20, 'Approved', 'Verified through university certificate portal', '2025-03-12 10:30:00'),
    ('RSET2024CSE001', 'S3', 'Extracurricular & National Initiatives', 'Inter-Collegiate Badminton Championship', 'Quarter finalist in KTU South Zone Badminton Tournament.', '/uploads/demo_cert_2.pdf', 12, 12, 'Approved', 'Sports coordinator verified', '2025-09-18 14:20:00'),
    ('RSET2024CSE001', 'S3', 'Professional', 'Smart India Hackathon 2024 Finalist', 'Developed AI-powered agricultural monitoring IoT solution.', '/uploads/demo_cert_3.pdf', 25, 25, 'Approved', 'SIH official participation certificate', '2025-10-05 11:00:00'),
    ('RSET2024CSE001', 'S4', 'Professional', 'IEEE Student Branch Technical Paper Presentation', 'Published and presented paper on Efficient Cloud Orchestration.', '/uploads/demo_cert_4.pdf', 20, 20, 'Approved', 'IEEE RSET SB endorsed', '2026-02-22 16:45:00'),
    ('RSET2024CSE001', 'S4', 'Volunteering & Leadership Skills', 'NSS Rural Health Camp Coordinator', 'Led 40 student volunteers in organizing 3-day health camp.', '/uploads/demo_cert_5.pdf', 10, 10, 'Approved', 'NSS program officer certified', '2026-04-10 09:15:00'),
    ('RSET2024CSE001', 'S4', 'Volunteering & Leadership Skills', 'Blood Donation Drive Volunteer', 'Assisted medical team during annual college blood donation camp.', '/uploads/demo_cert_6.pdf', 8, 8, 'Approved', 'Red Cross certificate verified', '2026-05-02 15:00:00'),
    
    ('RSET2024CSE001', 'S5', 'Volunteering & Leadership Skills', 'Abhiyanthriki 2026 Tech Fest Student Coordinator', 'Coordinating registrations and hospitality for 1200+ delegates.', '/uploads/demo_cert_pending1.pdf', 0, 10, 'Pending', 'Awaiting faculty advisor endorsement', '2026-08-25 14:00:00'),
    ('RSET2024CSE001', 'S5', 'Professional', 'AWS Certified Cloud Practitioner Workshop', 'Completed 30-hour intensive cloud architecture bootcamp.', '/uploads/demo_cert_pending2.pdf', 0, 15, 'Pending', 'Certificate uploaded, pending HOD sign-off', '2026-08-28 16:30:00'),
    
    ('RSET2024CSE002', 'S5', 'Professional', 'Kochi Web3 Hackathon Runner Up', 'Built decentralized attendance verification smart contract.', '/uploads/demo_cert_pending3.pdf', 0, 10, 'Pending', 'Under review', '2026-08-29 11:00:00');
  `);

  // 6. Announcements
  db.run(`
    INSERT INTO announcements (title, message, date, category, author) VALUES
    ('Internal Examination 2 Timetable', 'The timetable for B.Tech S5 Internal Examination 2 has been published. Exams commence from 18th September 2026. Hall tickets can be downloaded from the portal.', '05 Sep 2026', 'Examination', 'Controller of Examinations'),
    ('Project Review Phase 1 Submission', 'All S5 CSE teams are required to submit the preliminary literature survey and design report for the mini project by 28th September 2026.', '02 Sep 2026', 'Academic', 'Dept. Project Committee'),
    ('KTU Activity Points Upload Deadline', 'Students of S5 are requested to upload all pending activity point certificates for semester verification before 30th September 2026.', '29 Aug 2026', 'Activity Points', 'KTU Cell RSET'),
    ('Annual Onam Celebration 2026', 'Rajagiri School of Engineering & Technology cordially invites all staff and students for Onam Celebrations on 20th September 2026. Traditional attire is encouraged.', '25 Aug 2026', 'Events', 'Student Council');
  `);

  // 7. Events
  db.run(`
    INSERT INTO events (title, date, time, venue, description, category) VALUES
    ('Brahmaha 2026', '15 Sep 2026', '09:00 AM', 'Chavara Hall', 'Inter-collegiate cultural extravaganza featuring music, drama, and choreonite.', 'Cultural'),
    ('Onam Celebration 2026', '20 Sep 2026', '10:00 AM', 'Central Courtyard', 'Pookalam contest, Thiruvathira, Onasadya and traditional Onam games.', 'Festival'),
    ('Project Review 1', '28 Sep 2026', '01:30 PM', 'Computer Labs A & B', 'Mini-project Phase 1 architecture and feasibility review by faculty panel.', 'Academic'),
    ('TechTalk: AI in Systems Engineering', '04 Oct 2026', '02:00 PM', 'Auditorium 2', 'Invited lecture by Dr. V. Mohan, Lead Architect at Google Cloud AI.', 'Technical');
  `);

  // 8. Timetable for S5 CSE A
  db.run(`
    INSERT INTO timetable (day, time, subject, room, teacher, class) VALUES
    ('Monday', '09:00 - 09:55 AM', 'Theory of Computation', 'Room 204', 'Dr. Binu A.', 'S5 CSE A'),
    ('Monday', '10:00 - 10:55 AM', 'Web Programming', 'Room 204', 'Prof. Jisha G.', 'S5 CSE A'),
    ('Monday', '11:15 - 12:10 PM', 'Operating Systems', 'Room 204', 'Prof. Mary Priya', 'S5 CSE A'),
    ('Monday', '01:15 - 03:15 PM', 'Web Programming Lab', 'Lab 3 (Advanced)', 'Prof. Jisha G.', 'S5 CSE A'),
    ('Monday', '03:30 - 04:25 PM', 'Constitution of India', 'Room 204', 'Prof. Joseph K.', 'S5 CSE A'),

    ('Tuesday', '09:00 - 09:55 AM', 'Probability & Statistics', 'Room 204', 'Dr. Deepa K.', 'S5 CSE A'),
    ('Tuesday', '10:00 - 10:55 AM', 'Operating Systems', 'Room 204', 'Prof. Mary Priya', 'S5 CSE A'),
    ('Tuesday', '11:15 - 12:10 PM', 'Theory of Computation', 'Room 204', 'Dr. Binu A.', 'S5 CSE A'),
    ('Tuesday', '01:15 - 02:10 PM', 'Software Engineering', 'Room 204', 'Dr. Preetha K. G.', 'S5 CSE A'),
    ('Tuesday', '02:15 - 04:15 PM', 'OS & Systems Lab', 'Lab 2', 'Prof. Mary Priya', 'S5 CSE A'),

    ('Wednesday', '09:00 - 09:55 AM', 'Web Programming', 'Room 204', 'Prof. Jisha G.', 'S5 CSE A'),
    ('Wednesday', '10:00 - 10:55 AM', 'Python for Engineers', 'Room 204', 'Prof. Paul P. J.', 'S5 CSE A'),
    ('Wednesday', '11:15 - 12:10 PM', 'Probability & Statistics', 'Room 204', 'Dr. Deepa K.', 'S5 CSE A'),
    ('Wednesday', '01:15 - 03:15 PM', 'Mini Project Mentoring', 'Dept Library', 'Faculty Mentors', 'S5 CSE A'),
    ('Wednesday', '03:30 - 04:25 PM', 'Library / Seminar', 'Central Library', 'Staff In-charge', 'S5 CSE A'),

    ('Thursday', '09:00 - 09:55 AM', 'Software Engineering', 'Room 204', 'Dr. Preetha K. G.', 'S5 CSE A'),
    ('Thursday', '10:00 - 10:55 AM', 'Theory of Computation', 'Room 204', 'Dr. Binu A.', 'S5 CSE A'),
    ('Thursday', '11:15 - 12:10 PM', 'Operating Systems', 'Room 204', 'Prof. Mary Priya', 'S5 CSE A'),
    ('Thursday', '01:15 - 02:10 PM', 'Python for Engineers', 'Room 204', 'Prof. Paul P. J.', 'S5 CSE A'),
    ('Thursday', '02:15 - 03:10 PM', 'Web Programming', 'Room 204', 'Prof. Jisha G.', 'S5 CSE A'),
    ('Thursday', '03:30 - 04:25 PM', 'Placement Training', 'Auditorium 1', 'Training Officer', 'S5 CSE A'),

    ('Friday', '09:00 - 09:55 AM', 'Python for Engineers', 'Room 204', 'Prof. Paul P. J.', 'S5 CSE A'),
    ('Friday', '10:00 - 10:55 AM', 'Probability & Statistics', 'Room 204', 'Dr. Deepa K.', 'S5 CSE A'),
    ('Friday', '11:15 - 12:10 PM', 'Software Engineering', 'Room 204', 'Dr. Preetha K. G.', 'S5 CSE A'),
    ('Friday', '01:15 - 03:15 PM', 'Python & Data Lab', 'Lab 1', 'Prof. Paul P. J.', 'S5 CSE A'),
    ('Friday', '03:30 - 04:25 PM', 'Mentoring / Counseling', 'Cabin 12', 'Class Advisor', 'S5 CSE A'),

    ('Saturday', '09:00 - 10:00 AM', 'Special Tutorial: TOC', 'Room 204', 'Dr. Binu A.', 'S5 CSE A'),
    ('Saturday', '10:15 - 11:15 AM', 'Coding Club Workshop', 'Seminar Hall', 'Student Leads', 'S5 CSE A'),
    ('Saturday', '11:30 - 01:00 PM', 'Hackathon Prep', 'Lab 3', 'Student Leads', 'S5 CSE A');
  `);

  // 9. 10 Kochi Bus Routes
  const busData = [
    { no: 'RSET-01', route: 'Aluva Route', stops: ['Aluva Bus Stand', 'Muttom', 'Kalamassery Premier', 'HMT Junction', 'Kakkanad Infopark', 'Rajagiri Campus'], current: 'Kalamassery Premier', status: 'On Route', driver: 'M. Sasi Kumar', phone: '+91 94471 11001' },
    { no: 'RSET-02', route: 'Angamaly Route', stops: ['Angamaly KSRTC', 'Chengamanad', 'Athani', 'Aluva Bypass', 'Thrikkakara', 'Rajagiri Campus'], current: 'Aluva Bypass', status: 'On Route', driver: 'K. Rajan', phone: '+91 94471 11002' },
    { no: 'RSET-03', route: 'Aluva - Edappally Route', stops: ['Aluva', 'Kalamassery', 'Edappally Toll', 'Palarivattom', 'Rajagiri Campus'], current: 'Edappally Toll', status: 'On Route', driver: 'Babu George', phone: '+91 94471 11003' },
    { no: 'RSET-04', route: 'Tripunithura Route', stops: ['Statue Junction', 'Petta Metro', 'Vyttila Hub', 'Kaloor', 'Pipeline Junction', 'Rajagiri Campus'], current: 'Vyttila Hub', status: 'Delayed', driver: 'T. Manoj', phone: '+91 94471 11004' },
    { no: 'RSET-05', route: 'Fort Kochi / Thoppumpady', stops: ['Fort Kochi Veli', 'Thoppumpady', 'Thevara', 'Medical Trust', 'Kadavanthra', 'Rajagiri Campus'], current: 'Thevara', status: 'On Route', driver: 'P. Johnson', phone: '+91 94471 11005' },
    { no: 'RSET-06', route: 'Kothamangalam - Muvattupuzha', stops: ['Kothamangalam', 'Muvattupuzha KSRTC', 'Kolenchery', 'Puthencruz', 'Brahmapuram', 'Rajagiri Campus'], current: 'Kolenchery', status: 'On Route', driver: 'Sunny Mathew', phone: '+91 94471 11006' },
    { no: 'RSET-07', route: 'Perumbavoor Route', stops: ['Perumbavoor Private Bus Stand', 'Valayanchirangara', 'Pattiomattom', 'Kizhakkambalam', 'Morakkala', 'Rajagiri Campus'], current: 'Kizhakkambalam', status: 'Arriving Soon', driver: 'Abdul Kareem', phone: '+91 94471 11007' },
    { no: 'RSET-08', route: 'Paravur - Cherai Route', stops: ['North Paravur', 'Varapuzha Bridge', 'Container Road', 'Edappally', 'Padamugal', 'Rajagiri Campus'], current: 'Padamugal', status: 'Arriving Soon', driver: 'Sudheer V.', phone: '+91 94471 11008' },
    { no: 'RSET-09', route: 'Aroor - Cherthala Route', stops: ['Cherthala', 'Aroor Toll', 'Kumbalam', 'Kundannoor', 'Vyttila', 'Rajagiri Campus'], current: 'Rajagiri Campus', status: 'Reached Campus', driver: 'Prasad C.', phone: '+91 94471 11009' },
    { no: 'RSET-10', route: 'Piravom - Mulanthuruthy', stops: ['Piravom', 'Mulanthuruthy', 'Chottanikkara', 'Thiruvankulam', 'Seaport-Airport Rd', 'Rajagiri Campus'], current: 'Rajagiri Campus', status: 'Reached Campus', driver: 'Gireesh Kumar', phone: '+91 94471 11010' },
  ];

  for (const b of busData) {
    db.run(
      `INSERT INTO buses (bus_no, route_name, stops, current_stop, status, driver_name, driver_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [b.no, b.route, JSON.stringify(b.stops), b.current, b.status, b.driver, b.phone]
    );
  }

  // 10. Exams / Hall Ticket Data for Niranjana
  db.run(`
    INSERT INTO exams (student_uid, exam_name, subject, exam_date, exam_time, venue, room, seat_no) VALUES
    ('RSET2024CSE001', 'Internal Examination 2', 'Web Programming (CST305)', '18 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Theory of Computation (CST301)', '19 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Operating Systems (CST303)', '21 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Probability & Statistics (MAT301)', '22 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Software Engineering (CST309)', '23 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Python for Engineers (CST307)', '24 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17'),
    ('RSET2024CSE001', 'Internal Examination 2', 'Constitution of India (MCN301)', '25 September 2026', '10:00 AM – 11:30 AM', 'Academic Block A', 'Room 204', 'A204-17');
  `);

  // 11. Sample Feedback
  db.run(`
    INSERT INTO feedback (teacher, subject, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, comments, submitted_at) VALUES
    ('Prof. Jisha G.', 'Web Programming', 'Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 9.8, 'Very engaging hands-on lab sessions and clear code demonstrations.', '2026-08-20 14:10:00'),
    ('Dr. Binu A.', 'Theory of Computation', 'Excellent', 'Good', 'Excellent', 'Good', 'Good', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent', 9.1, 'Explains automata theory proofs with step-by-step clarity.', '2026-08-21 11:30:00'),
    ('Prof. Mary Priya', 'Operating Systems', 'Good', 'Good', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 8.2, 'Kernel concepts were well covered. More tutorial problems on CPU scheduling would be helpful.', '2026-08-22 09:45:00');
  `);
}

function ensureAllSemesterExaminations(db: Database) {
  const count = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM examinations');
  if (count && count.count > 0) return;

  const defaultExams = [
    // S5 Examinations (October 2026)
    { semester: 'S5', course_code: 'CST301', course_title: 'Theory of Computation', exam_date: '2026-10-05', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'CST303', course_title: 'Operating Systems', exam_date: '2026-10-08', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'CST305', course_title: 'Web Programming', exam_date: '2026-10-12', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'MAT301', course_title: 'Probability & Statistics', exam_date: '2026-10-15', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'CST307', course_title: 'Python for Engineers', exam_date: '2026-10-19', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'CST309', course_title: 'Software Engineering', exam_date: '2026-10-22', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S5', course_code: 'MCN301', course_title: 'Constitution of India', exam_date: '2026-10-26', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 204', exam_centre: 'RSET Main Campus, Block C' },

    // S1 Examinations
    { semester: 'S1', course_code: 'MAT101', course_title: 'Linear Algebra & Calculus', exam_date: '2026-10-06', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 101', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S1', course_code: 'PHT100', course_title: 'Engineering Physics', exam_date: '2026-10-09', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 101', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S1', course_code: 'EST110', course_title: 'Engineering Graphics', exam_date: '2026-10-13', session_time: '9:30 AM – 12:30 PM', hall_no: 'Drawing Hall 1', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S1', course_code: 'EST100', course_title: 'Basics of Civil & Mechanical Engg', exam_date: '2026-10-16', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 101', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S1', course_code: 'HUN101', course_title: 'Life Skills', exam_date: '2026-10-20', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 101', exam_centre: 'RSET Main Campus, Block C' },

    // S2 Examinations
    { semester: 'S2', course_code: 'MAT102', course_title: 'Vector Calculus & Diff Eq', exam_date: '2026-10-06', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 102', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S2', course_code: 'CYT100', course_title: 'Engineering Chemistry', exam_date: '2026-10-09', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 102', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S2', course_code: 'EST102', course_title: 'Programming in C', exam_date: '2026-10-13', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 102', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S2', course_code: 'EST130', course_title: 'Basics of Electrical & Electronics', exam_date: '2026-10-16', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 102', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S2', course_code: 'HUN102', course_title: 'Professional Communication', exam_date: '2026-10-20', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 102', exam_centre: 'RSET Main Campus, Block C' },

    // S3 Examinations
    { semester: 'S3', course_code: 'MAT203', course_title: 'Discrete Mathematical Structures', exam_date: '2026-10-07', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 202', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S3', course_code: 'CST201', course_title: 'Data Structures', exam_date: '2026-10-10', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 202', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S3', course_code: 'CST203', course_title: 'Logic System Design', exam_date: '2026-10-14', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 202', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S3', course_code: 'CST205', course_title: 'Object Oriented Programming Java', exam_date: '2026-10-17', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 202', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S3', course_code: 'EST200', course_title: 'Design & Engineering', exam_date: '2026-10-21', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 202', exam_centre: 'RSET Main Campus, Block C' },

    // S4 Examinations
    { semester: 'S4', course_code: 'MAT206', course_title: 'Graph Theory', exam_date: '2026-10-07', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 203', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S4', course_code: 'CST202', course_title: 'Computer Organization & Architecture', exam_date: '2026-10-10', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 203', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S4', course_code: 'CST204', course_title: 'Database Management Systems', exam_date: '2026-10-14', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 203', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S4', course_code: 'CST206', course_title: 'Operating Systems Concepts', exam_date: '2026-10-17', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 203', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S4', course_code: 'HUT200', course_title: 'Professional Ethics', exam_date: '2026-10-21', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 203', exam_centre: 'RSET Main Campus, Block C' },

    // S6 Examinations
    { semester: 'S6', course_code: 'CST302', course_title: 'Compiler Design', exam_date: '2026-10-08', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 301', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S6', course_code: 'CST304', course_title: 'Computer Networks', exam_date: '2026-10-12', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 301', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S6', course_code: 'CST306', course_title: 'Data Analytics', exam_date: '2026-10-15', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 301', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S6', course_code: 'CST308', course_title: 'Algorithm Analysis & Design', exam_date: '2026-10-19', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 301', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S6', course_code: 'HUT310', course_title: 'Management for Engineers', exam_date: '2026-10-23', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 301', exam_centre: 'RSET Main Campus, Block C' },

    // S7 Examinations
    { semester: 'S7', course_code: 'CST401', course_title: 'Artificial Intelligence', exam_date: '2026-10-09', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 302', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S7', course_code: 'CST403', course_title: 'Cloud Computing', exam_date: '2026-10-13', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 302', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S7', course_code: 'CST405', course_title: 'Information Security', exam_date: '2026-10-16', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 302', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S7', course_code: 'CST407', course_title: 'Industrial IoT', exam_date: '2026-10-20', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 302', exam_centre: 'RSET Main Campus, Block C' },

    // S8 Examinations
    { semester: 'S8', course_code: 'CST402', course_title: 'Distributed Computing', exam_date: '2026-10-10', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 303', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S8', course_code: 'CST404', course_title: 'Deep Learning', exam_date: '2026-10-14', session_time: '9:30 AM – 12:30 PM', hall_no: 'Room 303', exam_centre: 'RSET Main Campus, Block C' },
    { semester: 'S8', course_code: 'CSD416', course_title: 'Main Project Phase II Evaluation', exam_date: '2026-10-22', session_time: '9:30 AM – 12:30 PM', hall_no: 'Seminar Hall 2', exam_centre: 'RSET Main Campus, Block C' },
  ];

  for (const ex of defaultExams) {
    db.run(
      `INSERT INTO examinations (semester, course_code, course_title, exam_date, session_time, hall_no, exam_centre)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ex.semester, ex.course_code, ex.course_title, ex.exam_date, ex.session_time, ex.hall_no, ex.exam_centre]
    );
  }
}

function ensureAllSemesterMarks(db: Database) {
  const students = queryAll<{ uid: string; semester: string }>('SELECT uid, semester FROM students');
  const pastSemesters = ['S1', 'S2', 'S3', 'S4'];

  for (const st of students) {
    for (const sem of pastSemesters) {
      const semSubjects = queryAll<{ id: number; code: string; credits: number }>('SELECT id, code, credits FROM subjects WHERE semester = ?', [sem]);
      for (const sub of semSubjects) {
        const existing = queryOne('SELECT id FROM marks WHERE student_uid = ? AND subject_id = ?', [st.uid, sub.id]);
        if (!existing) {
          // Compute high quality realistic scores for past semesters
          let i1 = 26;
          let i2 = 27;
          let assign = 9.5;
          let proj = 9.5;

          if (st.uid === 'RSET2024CSE001') {
            if (sem === 'S1') {
              if (sub.code === 'MAT101') { i1 = 26; i2 = 26; assign = 9; proj = 9; } // 70/80 (8.75)
              else if (sub.code === 'PHT100') { i1 = 27; i2 = 26; assign = 9; proj = 9; } // 71/80
              else if (sub.code === 'EST110') { i1 = 28; i2 = 27; assign = 9.5; proj = 9.5; } // 74/80
              else if (sub.code === 'EST100') { i1 = 26; i2 = 25; assign = 9; proj = 9; } // 69/80
              else { i1 = 27; i2 = 26; assign = 9.5; proj = 9; }
            } else if (sem === 'S2') {
              if (sub.code === 'MAT102') { i1 = 27; i2 = 27; assign = 9.5; proj = 9; }
              else if (sub.code === 'CYT100') { i1 = 27; i2 = 28; assign = 9.5; proj = 9.5; }
              else if (sub.code === 'EST102') { i1 = 28; i2 = 28; assign = 10; proj = 9.5; }
              else if (sub.code === 'EST130') { i1 = 26; i2 = 27; assign = 9; proj = 9; }
              else { i1 = 28; i2 = 27; assign = 9.5; proj = 9.5; }
            } else if (sem === 'S3') {
              if (sub.code === 'MAT203') { i1 = 28; i2 = 28; assign = 9.5; proj = 9.5; }
              else if (sub.code === 'CST201') { i1 = 29; i2 = 28; assign = 10; proj = 10; }
              else if (sub.code === 'CST203') { i1 = 27; i2 = 28; assign = 9.5; proj = 9.5; }
              else if (sub.code === 'CST205') { i1 = 29; i2 = 29; assign = 10; proj = 10; }
              else { i1 = 28; i2 = 28; assign = 10; proj = 9.5; }
            } else if (sem === 'S4') {
              if (sub.code === 'MAT206') { i1 = 29; i2 = 29; assign = 10; proj = 9.5; }
              else if (sub.code === 'CST202') { i1 = 28; i2 = 29; assign = 10; proj = 9.5; }
              else if (sub.code === 'CST204') { i1 = 29; i2 = 29; assign = 10; proj = 10; }
              else if (sub.code === 'CST206') { i1 = 29; i2 = 28; assign = 10; proj = 10; }
              else { i1 = 29; i2 = 29; assign = 10; proj = 10; }
            }
          } else {
            const seed = (st.uid.charCodeAt(st.uid.length - 1) * 7 + sub.id * 3) % 5;
            i1 = 24 + seed;
            i2 = 25 + ((seed + 1) % 4);
            assign = 9 + (seed > 2 ? 1 : 0);
            proj = 9 + (seed > 1 ? 0.5 : 0);
          }

          db.run(
            `INSERT OR REPLACE INTO marks (student_uid, subject_id, internal1, internal2, assignment, project, max_internal1, max_internal2, max_assignment, max_project)
             VALUES (?, ?, ?, ?, ?, ?, 30, 30, 10, 10)`,
            [st.uid, sub.id, i1, i2, assign, proj]
          );
        }
      }
    }
  }
}

function ensureAllFeedbackData(db: Database) {
  try {
    const fbCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM feedback');
    // If feedback table has fewer than 100 entries, seed the complete 128 response dataset
    if (fbCount && fbCount.count >= 100) {
      return;
    }

    // Clear and rebuild clean dataset
    db.run('DELETE FROM feedback');

    // Score helper: Excellent = 5, Good = 4, Average = 3, Poor = 2
    const scoreMap: Record<string, number> = {
      Excellent: 5.0,
      Good: 4.0,
      Average: 3.0,
      Poor: 2.0,
    };

    const calcScore = (answers: string[]): number => {
      const sum = answers.reduce((acc, ans) => acc + (scoreMap[ans] || 4.0), 0);
      return parseFloat((sum / answers.length).toFixed(2));
    };

    const allFeedbackData: Array<{
      teacher: string;
      subject: string;
      subject_code: string;
      semester: string;
      academic_year: string;
      q: string[];
      comments: string;
      submitted_at: string;
    }> = [];

    // Helper generator for realistic responses
    // 1. Prof. Jisha G. - CST305 Web Programming (S5) -> 18 responses (avg ~4.45)
    const jishaS5Answers = [
      ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent'], // 4.90
      ['Excellent', 'Excellent', 'Good', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Good', 'Good', 'Excellent'], // 4.60
      ['Good', 'Excellent', 'Good', 'Average', 'Good', 'Excellent', 'Good', 'Excellent', 'Good', 'Good'], // 4.20
      ['Excellent', 'Excellent', 'Excellent', 'Good', 'Good', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent'], // 4.60
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
      ['Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent'], // 4.90
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'], // 4.20
      ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent'], // 4.80
      ['Good', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 3.90
      ['Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent'], // 4.70
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.10
      ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent'], // 4.80
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
      ['Excellent', 'Excellent', 'Good', 'Good', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent'], // 4.60
      ['Good', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 3.90
      ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent'], // 4.90
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'], // 4.20
      ['Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent'], // 4.70
    ];
    const jishaS5Comments = [
      'Very engaging hands-on lab sessions and clear code demonstrations on full-stack web development.',
      'Step-by-step code walkthroughs in class made web application development easy to understand.',
      'More practical examples would be helpful during CSS Grid and React state management sessions.',
      '',
      'Friendly and approachable faculty who always clarifies doubts patiently after class.',
      'Assignments were evaluated on time with constructive feedback on clean code practices.',
      '',
      'Would love additional reference projects or starter templates on GitHub for the mini-project.',
      '',
      'Great guidance provided during lab experiments and JavaScript frameworks.',
      '',
      'Interactive lectures with live terminal demonstrations made topics memorable.',
      '',
      'The course structure was completed well within schedule with thorough revisions.',
      '',
      'One of the best faculty in the department, very dedicated to student learning.',
      '',
      '',
    ];

    for (let i = 0; i < 18; i++) {
      allFeedbackData.push({
        teacher: 'Prof. Jisha G.',
        subject: 'Web Programming',
        subject_code: 'CST305',
        semester: 'S5',
        academic_year: '2025-26',
        q: jishaS5Answers[i],
        comments: jishaS5Comments[i] || '',
        submitted_at: `2026-08-${String(15 + (i % 12)).padStart(2, '0')} 11:${String(10 + i * 2).padStart(2, '0')}:00`,
      });
    }

    // 2. Prof. Jisha G. - CST204 Database Management Systems (S4) -> 14 responses (avg ~4.48)
    for (let i = 0; i < 14; i++) {
      const q = i % 3 === 0
        ? ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent']
        : i % 2 === 0
        ? ['Excellent', 'Excellent', 'Good', 'Good', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent']
        : ['Good', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Database query optimization and B+ tree indexing were taught exceptionally well.'
        : i === 2 ? 'More revision sessions before internal exams would help reinforce SQL normalization.'
        : i === 5 ? 'Interactive lab exercises on MySQL and transaction ACID properties were very effective.'
        : '';
      allFeedbackData.push({
        teacher: 'Prof. Jisha G.',
        subject: 'Database Management Systems',
        subject_code: 'CST204',
        semester: 'S4',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-04-${String(10 + (i % 15)).padStart(2, '0')} 14:${String(10 + i * 3).padStart(2, '0')}:00`,
      });
    }

    // 3. Prof. Jisha G. - CST201 Data Structures (S3) -> 10 responses (avg ~4.42)
    for (let i = 0; i < 10; i++) {
      const q = i % 2 === 0
        ? ['Excellent', 'Excellent', 'Good', 'Good', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent']
        : ['Good', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'AVL tree balancing and graph traversal algorithms were made very simple and intuitive.'
        : i === 3 ? 'Excellent study materials and animated visualizer references provided.'
        : '';
      allFeedbackData.push({
        teacher: 'Prof. Jisha G.',
        subject: 'Data Structures',
        subject_code: 'CST201',
        semester: 'S3',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2025-11-${String(12 + (i % 10)).padStart(2, '0')} 10:${String(15 + i * 4).padStart(2, '0')}:00`,
      });
    }

    // 4. Prof. Mary Priya - CST303 Operating Systems (S5) -> 16 responses (avg ~4.20)
    const maryS5Answers = [
      ['Good', 'Good', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 3.90
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.10
      ['Good', 'Good', 'Good', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good'], // 3.90
      ['Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Excellent'], // 4.50
      ['Good', 'Good', 'Average', 'Good', 'Average', 'Good', 'Good', 'Good', 'Good', 'Good'], // 3.70
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'], // 4.20
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
      ['Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'], // 4.40
      ['Good', 'Average', 'Average', 'Good', 'Average', 'Good', 'Good', 'Good', 'Average', 'Good'], // 3.50
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.10
      ['Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Excellent'], // 4.50
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
      ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'], // 4.20
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
      ['Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Excellent'], // 4.50
      ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'], // 4.00
    ];
    const maryS5Comments = [
      'Kernel concepts and process synchronization were well covered with practical examples.',
      'Please slow down slightly while explaining difficult topics like semaphore race conditions.',
      'More tutorial problems on CPU scheduling and Banker algorithm would be helpful before exams.',
      '',
      'The pace of Unit 3 on memory management and virtual paging felt slightly rushed towards the end.',
      'Doubt clearance and revision sessions before internal exams were extremely beneficial.',
      '',
      'Need more numerical practice problems for disk scheduling algorithms.',
      '',
      'Good explanation of virtual memory management concepts.',
      '',
      'System calls and thread programming were explained effectively.',
      '',
      'Clear slides provided on OS architectures.',
      '',
      '',
    ];

    for (let i = 0; i < 16; i++) {
      allFeedbackData.push({
        teacher: 'Prof. Mary Priya',
        subject: 'Operating Systems',
        subject_code: 'CST303',
        semester: 'S5',
        academic_year: '2025-26',
        q: maryS5Answers[i],
        comments: maryS5Comments[i] || '',
        submitted_at: `2026-08-${String(16 + (i % 10)).padStart(2, '0')} 15:${String(10 + i * 2).padStart(2, '0')}:00`,
      });
    }

    // 5. Prof. Mary Priya - CST206 Operating Systems Concepts (S4) -> 10 responses (avg ~4.18)
    for (let i = 0; i < 10; i++) {
      const q = i % 2 === 0
        ? ['Good', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good']
        : ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Deadlock prevention and paging concepts were explained with step-by-step diagrams.'
        : i === 3 ? 'More practice questions on page replacement algorithms would be helpful.'
        : '';
      allFeedbackData.push({
        teacher: 'Prof. Mary Priya',
        subject: 'Operating Systems Concepts',
        subject_code: 'CST206',
        semester: 'S4',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-04-${String(12 + (i % 12)).padStart(2, '0')} 16:${String(20 + i * 2).padStart(2, '0')}:00`,
      });
    }

    // 6. Prof. Mary Priya - CST203 Logic System Design (S3) -> 5 responses (avg ~4.22)
    for (let i = 0; i < 5; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'K-map simplification and sequential circuit counters were explained nicely.' : '';
      allFeedbackData.push({
        teacher: 'Prof. Mary Priya',
        subject: 'Logic System Design',
        subject_code: 'CST203',
        semester: 'S3',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2025-11-${String(14 + i).padStart(2, '0')} 09:30:00`,
      });
    }

    // 7. Dr. Binu A. - CST301 Theory of Computation (S5) -> 15 responses (avg ~4.55)
    for (let i = 0; i < 15; i++) {
      const q = i % 3 === 0
        ? ['Excellent', 'Excellent', 'Excellent', 'Good', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent', 'Excellent']
        : ['Excellent', 'Good', 'Excellent', 'Good', 'Good', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent'];
      const comm = i === 0 ? 'Explains automata theory proofs and Turing machine reductions with remarkable clarity.'
        : i === 2 ? 'More practice problems on pushdown automata and Chomsky Normal Form would be appreciated.'
        : i === 4 ? 'Clear lecture slides and well-structured module summaries shared before every internal exam.'
        : i === 7 ? 'Complex proofs on undecidability were explained in an intuitive and understandable manner.'
        : '';
      allFeedbackData.push({
        teacher: 'Dr. Binu A.',
        subject: 'Theory of Computation',
        subject_code: 'CST301',
        semester: 'S5',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-08-${String(18 + (i % 8)).padStart(2, '0')} 10:${String(20 + i * 2).padStart(2, '0')}:00`,
      });
    }

    // 8. Dr. Binu A. - CST202 Computer Organization & Architecture (S4) -> 9 responses (avg ~4.47)
    for (let i = 0; i < 9; i++) {
      const q = ['Excellent', 'Good', 'Excellent', 'Good', 'Good', 'Excellent', 'Good', 'Excellent', 'Good', 'Excellent'];
      const comm = i === 0 ? 'Pipeline hazard resolution and cache memory architectures were explained thoroughly.' : '';
      allFeedbackData.push({
        teacher: 'Dr. Binu A.',
        subject: 'Computer Organization & Architecture',
        subject_code: 'CST202',
        semester: 'S4',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-04-${String(15 + i).padStart(2, '0')} 11:45:00`,
      });
    }

    // 9. Dr. Deepa K. - MAT301 Probability & Statistics (S5) -> 10 responses (avg ~4.35)
    for (let i = 0; i < 10; i++) {
      const q = i % 2 === 0
        ? ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good']
        : ['Excellent', 'Excellent', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Excellent'];
      const comm = i === 0 ? 'Very systematic teaching of probability distributions and hypothesis testing.'
        : i === 3 ? 'More solved examples on two-tailed hypothesis tests and ANOVA tables would be great.'
        : i === 6 ? 'The pace of lectures is very comfortable and doubts are cleared promptly in class.'
        : '';
      allFeedbackData.push({
        teacher: 'Dr. Deepa K.',
        subject: 'Probability & Statistics',
        subject_code: 'MAT301',
        semester: 'S5',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-08-${String(20 + (i % 7)).padStart(2, '0')} 14:${String(15 + i * 3).padStart(2, '0')}:00`,
      });
    }

    // 10. Dr. Deepa K. - MAT101 Linear Algebra & Calculus (S1) -> 4 responses (avg ~4.40)
    for (let i = 0; i < 4; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Eigenvalue computations and vector spaces were explained very well with step-by-step steps.' : '';
      allFeedbackData.push({
        teacher: 'Dr. Deepa K.',
        subject: 'Linear Algebra & Calculus',
        subject_code: 'MAT101',
        semester: 'S1',
        academic_year: '2024-25',
        q,
        comments: comm,
        submitted_at: `2024-11-${String(10 + i).padStart(2, '0')} 11:00:00`,
      });
    }

    // 11. Prof. Paul P. J. - CST307 Python for Engineers (S5) -> 5 responses (avg ~4.30)
    for (let i = 0; i < 5; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Hands-on data analysis exercises with Pandas and NumPy were very interesting.'
        : i === 2 ? 'Would be helpful to have extra coding challenges on Kaggle datasets for practice.'
        : '';
      allFeedbackData.push({
        teacher: 'Prof. Paul P. J.',
        subject: 'Python for Engineers',
        subject_code: 'CST307',
        semester: 'S5',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-08-${String(22 + i).padStart(2, '0')} 16:10:00`,
      });
    }

    // 12. Prof. Paul P. J. - EST102 Programming in C (S2) -> 2 responses (avg ~4.25)
    for (let i = 0; i < 2; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Pointers and dynamic memory allocation concepts were taught clearly.' : '';
      allFeedbackData.push({
        teacher: 'Prof. Paul P. J.',
        subject: 'Programming in C',
        subject_code: 'EST102',
        semester: 'S2',
        academic_year: '2024-25',
        q,
        comments: comm,
        submitted_at: `2025-04-${String(18 + i).padStart(2, '0')} 10:20:00`,
      });
    }

    // 13. Dr. Preetha K. G. - CST309 Software Engineering (S5) -> 3 responses (avg ~4.40)
    for (let i = 0; i < 3; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Agile Scrum methodologies and design patterns were explained with real-world industry case studies.'
        : i === 1 ? 'Helpful mentoring provided for software requirement specification documentation.'
        : '';
      allFeedbackData.push({
        teacher: 'Dr. Preetha K. G.',
        subject: 'Software Engineering',
        subject_code: 'CST309',
        semester: 'S5',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-08-${String(24 + i).padStart(2, '0')} 11:30:00`,
      });
    }

    // 14. Dr. Preetha K. G. - CST205 Object Oriented Programming Java (S3) -> 2 responses (avg ~4.40)
    for (let i = 0; i < 2; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Excellent', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Multithreading and exception handling in Java were taught with good lab examples.' : '';
      allFeedbackData.push({
        teacher: 'Dr. Preetha K. G.',
        subject: 'Object Oriented Programming Java',
        subject_code: 'CST205',
        semester: 'S3',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2025-11-${String(20 + i).padStart(2, '0')} 15:40:00`,
      });
    }

    // 15. Prof. Joseph K. - MCN301 Constitution of India (S5) -> 2 responses (avg ~4.15)
    for (let i = 0; i < 2; i++) {
      const q = ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Engaging discussions on fundamental rights and landmark judicial rulings.' : '';
      allFeedbackData.push({
        teacher: 'Prof. Joseph K.',
        subject: 'Constitution of India',
        subject_code: 'MCN301',
        semester: 'S5',
        academic_year: '2025-26',
        q,
        comments: comm,
        submitted_at: `2026-08-${String(25 + i).padStart(2, '0')} 12:00:00`,
      });
    }

    // 16. Prof. Joseph K. - EST200 Design & Engineering (S3) -> 1 response (avg ~4.15)
    allFeedbackData.push({
      teacher: 'Prof. Joseph K.',
      subject: 'Design & Engineering',
      subject_code: 'EST200',
      semester: 'S3',
      academic_year: '2025-26',
      q: ['Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'],
      comments: 'Interesting design thinking workshops and team brainstorming sessions.',
      submitted_at: '2025-11-22 14:15:00',
    });

    // 17. Prof. Sarah V. - HUN101 Life Skills (S1) -> 2 responses (avg ~4.30)
    for (let i = 0; i < 2; i++) {
      const q = ['Excellent', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good', 'Good'];
      const comm = i === 0 ? 'Great group discussions and communication skill activities conducted in class.' : '';
      allFeedbackData.push({
        teacher: 'Prof. Sarah V.',
        subject: 'Life Skills',
        subject_code: 'HUN101',
        semester: 'S1',
        academic_year: '2024-25',
        q,
        comments: comm,
        submitted_at: `2024-11-${String(24 + i).padStart(2, '0')} 16:00:00`,
      });
    }

    // Insert all 128 rows into feedback table
    for (const item of allFeedbackData) {
      const score = calcScore(item.q);
      db.run(
        `INSERT INTO feedback (teacher, subject, subject_code, semester, academic_year, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, score, comments, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.teacher,
          item.subject,
          item.subject_code,
          item.semester,
          item.academic_year,
          item.q[0],
          item.q[1],
          item.q[2],
          item.q[3],
          item.q[4],
          item.q[5],
          item.q[6],
          item.q[7],
          item.q[8],
          item.q[9],
          score,
          item.comments,
          item.submitted_at,
        ]
      );
    }
  } catch (err) {
    console.error('Error ensuring feedback data:', err);
  }
}



