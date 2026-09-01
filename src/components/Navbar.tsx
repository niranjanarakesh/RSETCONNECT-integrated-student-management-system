import React from 'react';
import { Menu, Shield } from 'lucide-react';
import { UserSession } from '../types.js';
import { getInitials } from '../utils.js';

interface NavbarProps {
  session?: UserSession | null;
  onOpenMobile?: () => void;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
  activeTabTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onOpenMobile = () => {},
  onLogout,
  onNavigate,
  activeTabTitle = 'RSMS Connect',
}) => {
  const isStudent = session?.role === 'student';
  const userName = isStudent
    ? (session?.user as any)?.name || 'Brinda Raj'
    : (session?.user as any)?.name || 'Prof. Mary Priya (HOD/Admin)';
  const userSub = isStudent
    ? `${(session?.user as any)?.uid || 'RSET2024CSE001'} • ${(session?.user as any)?.class || 'S5 CSE A'}`
    : 'Faculty Advisor / Admin';

  const avatarInitials = isStudent ? getInitials(userName) : null;

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="btn-icon"
          onClick={onOpenMobile}
          style={{ display: 'inline-flex' }}
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {activeTabTitle}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* User Card in Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isStudent ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            {isStudent ? avatarInitials : <Shield size={18} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {userName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {userSub}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

