export interface Student {
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
  attendancePercentage?: number;
  totalPresent?: number;
  totalClasses?: number;
  activityPoints?: number;
  pendingActivities?: number;
}

export interface AttendanceException {
  id: number;
  date: string;
  formattedDate: string;
  monthYear: string;
  status: 'Absent' | 'Duty Leave';
}

export interface SubjectAttendance {
  subject_id: number;
  code: string;
  subject_name: string;
  teacher: string;
  credits: number;
  semester?: string;
  present_classes: number;
  absent_classes?: number;
  duty_leave_classes?: number;
  effective_present?: number;
  total_classes: number;
  percentage: number;
  status: 'Safe' | 'Warning' | 'Below Requirement' | 'No Data';
  exceptions?: AttendanceException[];
}

export interface AttendanceResponse {
  semester: string;
  hasRecords?: boolean;
  subjects: SubjectAttendance[];
  overall: {
    totalClasses: number;
    present: number;
    absent: number;
    dutyLeave: number;
    effectivePresent: number;
    percentage: number;
    status: 'Safe' | 'Warning' | 'Below Requirement' | 'No Data';
  };
}

export interface PeriodAttendanceItem {
  period: number; // 1 to 7
  subjectId: number;
  courseCode: string;
  courseName: string;
  teacher: string;
  status: 'Present' | 'Absent' | 'Duty Leave';
  recordId: number;
  date: string;
}

export interface DayAttendanceLog {
  date: string; // "2026-08-18"
  formattedDate: string; // "18 Aug 2026"
  dayOfWeek: string; // "Tuesday"
  shortDate: string; // "18 Aug"
  periods: (PeriodAttendanceItem | null)[]; // 7 periods (indices 0..6)
  summary: {
    present: number;
    absent: number;
    dutyLeave: number;
    total: number;
  };
}

export interface DailyAttendanceMonthOption {
  value: string; // "2026-08"
  label: string; // "August 2026"
}

export interface DailyAttendanceResponse {
  semester: string;
  selectedMonth: string;
  selectedMonthName: string;
  availableMonths: DailyAttendanceMonthOption[];
  days: DayAttendanceLog[];
  monthSummary: {
    presentClasses: number;
    absentClasses: number;
    dutyLeave: number;
    totalClasses: number;
    effectiveAttended: number;
    percentage: number;
  };
  semesterOverall: {
    present: number;
    absent: number;
    dutyLeave: number;
    total: number;
    effectivePresent: number;
    percentage: number;
  };
}

export interface SubjectAttendanceDetail {
  subject: {
    id: number;
    code: string;
    name: string;
    teacher: string;
    credits: number;
    semester: string;
  };
  semester: string;
  summary: {
    total_classes: number;
    present_classes: number;
    absent_classes: number;
    duty_leave_classes: number;
    effective_present: number;
    percentage: number;
    status: 'Safe' | 'Warning' | 'Below Requirement' | 'No Data';
  };
  exceptions: AttendanceException[];
  monthGroups: Record<string, AttendanceException[]>;
}

export interface SubjectMarks {
  subject_id: number;
  code: string;
  subject_name: string;
  teacher: string;
  semester?: string;
  credits: number;
  internal1: number | null;
  internal2: number | null;
  assignment: number | null;
  project: number | null;
  max_internal1: number;
  max_internal2: number;
  max_assignment: number;
  max_project: number;
  total: number | null;
  max_total: number;
  percentage: number | null;
  gradePoint?: number | null;
  letterGrade?: string | null;
  status?: 'Completed' | 'Marks in Progress' | 'Upcoming' | 'Not Started';
}

export interface SemesterMarksGroup {
  semester: string;
  semesterNumber: number;
  status: 'Completed' | 'Current' | 'Upcoming';
  totalSubjects: number;
  totalCredits: number;
  sgpa: number | null;
  sgpaDisplay: string;
  subjects: SubjectMarks[];
}

export interface CgpaJourneyItem {
  semester: string;
  sgpa: number | null;
  displaySgpa: string;
  status: 'Completed' | 'Current' | 'Upcoming';
}

export interface MarksResponse {
  student?: Student;
  cgpa: number;
  completed_credits: number;
  total_credits?: number;
  current_semester?: string;
  standing?: string;
  semesters?: SemesterMarksGroup[];
  all_semesters?: SemesterMarksGroup[];
  journey?: CgpaJourneyItem[];
  subjects?: SubjectMarks[];
}

export interface Activity {
  id: number;
  student_uid: string;
  student_name?: string;
  student_class?: string;
  semester: string;
  category: 'Extracurricular & National Initiatives' | 'Professional' | 'Volunteering & Leadership Skills';
  title: string;
  description: string;
  certificate_url?: string;
  points: number;
  requested_points: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  submitted_at: string;
}

export interface ActivityPointsResponse {
  categories: {
    extracurricular: {
      name: string;
      points: number;
      target: number;
      completed: boolean;
    };
    professional: {
      name: string;
      points: number;
      target: number;
      completed: boolean;
    };
    volunteering: {
      name: string;
      points: number;
      target: number;
      completed: boolean;
    };
  };
  overall: {
    points: number;
    target: number;
    completed: boolean;
  };
  activities: Activity[];
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  date: string;
  category: string;
  author: string;
}

export interface CollegeEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  category: string;
}

export interface TimetableEntry {
  id: number;
  day: string;
  time: string;
  subject: string;
  room: string;
  teacher?: string;
  class: string;
}

export interface Bus {
  id: number;
  bus_no: string;
  route_name: string;
  stops: string[];
  current_stop: string;
  status: 'On Route' | 'Delayed' | 'Arriving Soon' | 'Reached Campus';
  driver_name: string;
  driver_phone: string;
  last_updated: string;
}

export interface ExamInfo {
  id: number;
  student_uid: string;
  exam_name: string;
  subject: string;
  exam_date: string;
  exam_time: string;
  venue: string;
  room: string;
  seat_no: string;
}

export interface Examination {
  id: number;
  semester: string;
  course_code: string;
  course_title: string;
  exam_date: string;
  session_time: string;
  hall_no: string;
  exam_centre: string;
}

export interface StudentHallTicketData {
  student: {
    id?: number;
    uid: string;
    name: string;
    class: string;
    department: string;
    semester: string;
    section?: string;
    email?: string;
    phone?: string;
    gender?: string;
    photo?: string;
    signature?: string;
  };
  examCentre: string;
  examSession: string;
  examMonth: string;
  examYear: string;
  badgeTitle: string;
  examinations: Array<{
    id: number;
    semester: string;
    courseCode: string;
    courseTitle: string;
    examDate: string;
    date: string;
    sessionTime: string;
    hallNo: string;
    examCentre: string;
  }>;
}

export interface HallTicketResponse {
  student: Student;
  exam_session: string;
  institution: string;
  controller: string;
  exams: ExamInfo[];
}

export interface FeedbackAnalytics {
  teacher: string;
  subject: string;
  responses: number;
  averageRating: string;
  comments: string[];
}

export interface AdminStats {
  totalStudents: number;
  averageAttendance: number;
  pendingActivities: number;
  feedbackResponses: number;
  upcomingExams: number;
  recentPendingActivities: Activity[];
}

export interface ExamSchedule {
  id: number;
  course_code: string;
  course_name: string;
  date: string;
  time: string;
  room: string;
}

export interface Feedback {
  id: number;
  teacher: string;
  subject: string;
  answers: Record<string, string> | string;
  comments: string;
  submitted_at: string;
}

export interface UserSession {
  role: 'student' | 'admin';
  user: Student | { username: string; name: string; role: string };
}
