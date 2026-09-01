import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Award,
  GraduationCap,
  MessageSquare,
  Calendar,
  Bell,
  Sparkles,
  Bus,
  FileText,
  LogOut,
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  Shield,
  X
} from 'lucide-react';
import { UserSession } from '../types.js';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onSelectTab: (tab: string) => void;
  session?: UserSession | null;
  role?: 'student' | 'admin';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  session,
  role,
  collapsed = false,
  onToggleCollapse,
  onLogout,
  isOpenMobile = false,
  onCloseMobile = () => {},
}) => {
  const selectedTab = activeTab || currentTab || 'dashboard';
  const effectiveRole = session?.role || role || 'student';
  const isStudent = effectiveRole === 'student';

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'marks', label: 'Marks & CGPA', icon: GraduationCap },
    { id: 'activities', label: 'Activity Points', icon: Award },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'events', label: 'Events', icon: Sparkles },
    { id: 'buses', label: 'Bus Tracking', icon: Bus },
    { id: 'hallticket', label: 'Hall Ticket', icon: FileText },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-students', label: 'Students Roster', icon: Users },
    { id: 'admin-examinations', label: 'Exam Schedule', icon: FileText },
    { id: 'admin-attendance', label: 'Attendance & Marks', icon: UserCheck },
    { id: 'admin-approvals', label: 'Activity Approvals', icon: Award },
    { id: 'admin-announcements', label: 'Announcements', icon: Bell },
    { id: 'admin-buses', label: 'Bus Management', icon: Bus },
    { id: 'admin-feedback', label: 'Feedback Analytics', icon: MessageSquare },
    { id: 'admin-events', label: 'Events Schedule', icon: Sparkles },
    { id: 'admin-timetable', label: 'Class Timetable', icon: Clock },
  ];

  const navItems = isStudent ? studentNavItems : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 95,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">R</div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.3px' }}>
                RSMS Connect
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              {isStudent ? 'Student Portal' : 'Faculty & Admin Portal'}
            </span>
          </div>
          {isOpenMobile && (
            <button className="btn-icon" onClick={onCloseMobile} style={{ border: 'none' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-menu">
          <div style={{ padding: '0 8px 8px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (
              <div
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div
            className="sidebar-item"
            onClick={onLogout}
            style={{ color: '#ef4444', backgroundColor: 'transparent' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
};
