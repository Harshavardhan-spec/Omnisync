import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid2X2,
  BookOpen,
  Award,
  BarChart2,
  Mail,
  LogOut,
  FolderGit2,
  Users,
  FileCheck,
  MessageSquareCheck,
  Calendar,
  GraduationCap,
  History,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen = true, onClose }) {
  const { user, logout, isHOD, isFaculty, isStudent } = useAuth();

  const studentLinks = [
    { to: '/student', label: 'Student Overview', icon: Grid2X2 },
    { to: '/student/mini-project', label: 'Mini Project (3-1)', icon: BookOpen },
    { to: '/student/weekly-deliverables', label: 'Weekly Deliverables', icon: FileCheck },
    { to: '/student/tasks', label: 'Assessments & Tasks', icon: Award },
    { to: '/student/gradebook', label: 'My Gradebook', icon: BarChart2 },
    { to: '/student/team', label: 'Team & Mentorship', icon: Users },
    { to: '/inbox', label: 'Inbox', icon: Mail },
  ];

  const facultyLinks = [
    { to: '/faculty', label: 'Overview', icon: LayoutDashboard },
    { to: '/faculty/projects', label: 'My Projects', icon: FolderGit2 },
    { to: '/faculty/teams', label: 'Assigned Teams', icon: Users },
    { to: '/faculty/submissions', label: 'Weekly Submissions', icon: FileCheck },
    { to: '/faculty/gradebook', label: 'Gradebook & Marks', icon: Award },
    { to: '/inbox', label: 'Messages', icon: Mail },
  ];

  const hodLinks = [
    { to: '/hod', label: 'Department Overview', icon: LayoutDashboard },
    { to: '/hod/projects', label: 'All Projects', icon: FolderGit2 },
    { to: '/hod/approvals', label: 'Project Approvals', icon: CheckSquareIcon },
    { to: '/hod/deliverables-config', label: 'Milestones & Deadlines', icon: Calendar },
    { to: '/hod/gradebook', label: 'Gradebook & Weightage', icon: Award },
    { to: '/hod/reports', label: 'Reports & Analytics', icon: BarChart2 },
    { to: '/hod/audit', label: 'Audit History', icon: History },
    { to: '/hod/users', label: 'User Accounts', icon: UserPlus },
    { to: '/inbox', label: 'Notifications', icon: Mail },
  ];

  function CheckSquareIcon(props) {
    return <FileCheck {...props} />;
  }

  const links = isHOD ? hodLinks : isFaculty ? facultyLinks : studentLinks;

  return (
    <aside className="w-64 h-full min-h-screen sidebar-navy text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-800">
      <div>
        {/* Department / College Header matching screenshots */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-900/30 text-white font-black text-sm">
              VCE
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide leading-tight">
                Vardhaman
              </div>
              <div className="text-[11px] font-semibold text-blue-400 tracking-wider">
                {user?.department_details?.code || 'IT'} DEPT
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student' || link.to === '/faculty' || link.to === '/hod'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#2160FF] text-white shadow-lg shadow-blue-600/30 translate-x-1'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sign Out at bottom matching screenshots */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
