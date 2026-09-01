import React, { useState, useEffect } from 'react';
import { UserSession, Student } from './types.js';
import { LoginView } from './views/LoginView.js';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';

// Student Portal Views
import { StudentDashboard } from './views/student/StudentDashboard.js';
import { StudentProfile } from './views/student/StudentProfile.js';
import { StudentAttendance } from './views/student/StudentAttendance.js';
import { StudentMarks } from './views/student/StudentMarks.js';
import { StudentActivityPoints } from './views/student/StudentActivityPoints.js';
import { StudentFeedback } from './views/student/StudentFeedback.js';
import { StudentTimetable } from './views/student/StudentTimetable.js';
import { StudentAnnouncements } from './views/student/StudentAnnouncements.js';
import { StudentEvents } from './views/student/StudentEvents.js';
import { StudentBusTracking } from './views/student/StudentBusTracking.js';
import { StudentHallTicket } from './views/student/StudentHallTicket.js';

// Admin Portal Views
import { AdminDashboard } from './views/admin/AdminDashboard.js';
import { AdminStudents } from './views/admin/AdminStudents.js';
import { AdminExaminations } from './views/admin/AdminExaminations.js';
import { AdminAttendanceMarks } from './views/admin/AdminAttendanceMarks.js';
import { AdminActivityApprovals } from './views/admin/AdminActivityApprovals.js';
import { AdminAnnouncements } from './views/admin/AdminAnnouncements.js';
import { AdminBusManagement } from './views/admin/AdminBusManagement.js';
import { AdminFeedbackResults } from './views/admin/AdminFeedbackResults.js';

const defaultStudentSession: UserSession = {
  role: 'student',
  user: {
    id: 1,
    uid: 'RSET2024CSE001',
    name: 'Brinda Raj',
    class: 'S5 CSE A',
    email: 'rset2024cse001@rajagiri.edu.in',
    phone: '+91 98470 54321',
    gender: 'Female',
    cgpa: 9.4,
    completed_credits: 84,
    department: 'Computer Science & Engineering',
    semester: 'S5',
    photo: '/assets/default_student_avatar.svg',
    signature: 'Brinda Raj',
    attendancePercentage: 90.4,
    totalPresent: 169,
    totalClasses: 187,
    activityPoints: 95,
    pendingActivities: 2,
  },
};

const getActiveTabTitle = (tab: string, role: string): string => {
  const titles: Record<string, string> = {
    dashboard: 'Academic Overview & Analytics',
    profile: 'Student Identification & Profile',
    attendance: 'Course-wise Attendance & Calculator',
    marks: 'Continuous Assessment Marks & CGPA Simulator',
    activities: 'KTU Activity Points Credit Tracker',
    feedback: 'Faculty Evaluation & Course Feedback',
    timetable: 'Weekly Class Timetable Schedule',
    announcements: 'Official Circulars & Notice Board',
    events: 'Campus Technical & Cultural Events',
    buses: 'College Bus Fleet Live Transit Tracking',
    hallticket: 'Autonomous End-Semester Examination Hall Ticket',
    'admin-dashboard': 'Faculty Advisor & Admin Overview',
    'admin-students': 'Student Enrolment & Batch Roster',
    'admin-examinations': 'Autonomous Examination Master Schedule',
    'admin-attendance': 'Attendance & Continuous Assessment Entry',
    'admin-approvals': 'Activity Points Verification & Approvals',
    'admin-announcements': 'Notice Board & Broadcast Circulars',
    'admin-buses': 'College Bus Fleet Dispatch Management',
    'admin-feedback': 'Faculty Feedback Analytics & Suggestions',
    'admin-events': 'Campus Events Schedule',
    'admin-timetable': 'Master Class Timetable',
  };
  return titles[tab] || (role === 'admin' ? 'Faculty Admin Portal' : 'Student Portal');
};

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    // Default demo session for fast first load
    const saved = localStorage.getItem('rsms_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'student' || parsed.role === 'admin')) {
          if (parsed.role === 'student') {
            const currentPhoto = parsed.user?.photo;
            if (!currentPhoto || currentPhoto.includes('student_brinda')) {
              return {
                ...parsed,
                user: {
                  ...parsed.user,
                  photo: '/assets/default_student_avatar.svg',
                },
              };
            }
          }
          return parsed;
        }
      } catch (e) {
        return defaultStudentSession;
      }
    }
    return defaultStudentSession;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem('rsms_session', JSON.stringify(session));
      if (session.role === 'admin' && !activeTab.startsWith('admin-')) {
        setActiveTab('admin-dashboard');
      } else if (session.role === 'student' && activeTab.startsWith('admin-')) {
        setActiveTab('dashboard');
      }
    } else {
      localStorage.removeItem('rsms_session');
    }
  }, [session]);

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('rsms_session');
    setActiveTab('dashboard');
  };

  const handleRoleSwitch = async (newRole: 'student' | 'admin') => {
    if (newRole === 'student') {
      try {
        const res = await fetch('/api/students/RSET2024CSE001');
        if (res.ok) {
          const s = await res.json();
          setSession({ role: 'student', user: s });
          setActiveTab('dashboard');
        } else {
          setSession(defaultStudentSession);
          setActiveTab('dashboard');
        }
      } catch (err) {
        setSession(defaultStudentSession);
        setActiveTab('dashboard');
      }
    } else {
      setSession({
        role: 'admin',
        user: { username: 'admin', name: 'Prof. Mary Priya (HOD/Admin)', role: 'admin' },
      });
      setActiveTab('admin-dashboard');
    }
  };

  // If logged out completely, show Login view
  if (!session) {
    return <LoginView onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const currentStudent = session.role === 'student' ? (session.user as Student) : null;

  return (
    <div className="app-layout">
      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        session={session}
        onLogout={handleLogout}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar with user profile */}
        <Navbar
          session={session}
          onLogout={handleLogout}
          onOpenMobile={() => setMobileMenuOpen(true)}
          activeTabTitle={getActiveTabTitle(activeTab, session.role)}
        />

        {/* Dynamic Route View Rendering */}
        <main>
          {session.role === 'student' && currentStudent && (
            <>
              {activeTab === 'dashboard' && (
                <StudentDashboard student={currentStudent} onNavigate={setActiveTab} />
              )}
              {activeTab === 'profile' && (
                <StudentProfile
                  student={currentStudent}
                  onUpdateSuccess={(updated) => setSession({ ...session, user: updated })}
                />
              )}
              {activeTab === 'attendance' && (
                <StudentAttendance studentUid={currentStudent.uid} />
              )}
              {activeTab === 'marks' && (
                <StudentMarks studentUid={currentStudent.uid} />
              )}
              {activeTab === 'activities' && (
                <StudentActivityPoints studentUid={currentStudent.uid} />
              )}
              {activeTab === 'feedback' && <StudentFeedback />}
              {activeTab === 'timetable' && <StudentTimetable />}
              {activeTab === 'announcements' && <StudentAnnouncements />}
              {activeTab === 'events' && <StudentEvents />}
              {activeTab === 'buses' && <StudentBusTracking />}
              {activeTab === 'hallticket' && (
                <StudentHallTicket student={currentStudent} />
              )}
            </>
          )}

          {session.role === 'admin' && (
            <>
              {activeTab === 'admin-dashboard' && (
                <AdminDashboard onNavigate={setActiveTab} />
              )}
              {activeTab === 'admin-students' && <AdminStudents />}
              {activeTab === 'admin-examinations' && <AdminExaminations />}
              {activeTab === 'admin-attendance' && <AdminAttendanceMarks />}
              {(activeTab === 'admin-approvals' || activeTab === 'admin-activities') && (
                <AdminActivityApprovals />
              )}
              {activeTab === 'admin-announcements' && <AdminAnnouncements />}
              {activeTab === 'admin-buses' && <AdminBusManagement />}
              {activeTab === 'admin-feedback' && <AdminFeedbackResults />}
              {activeTab === 'admin-events' && <StudentEvents />}
              {activeTab === 'admin-timetable' && <StudentTimetable />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
