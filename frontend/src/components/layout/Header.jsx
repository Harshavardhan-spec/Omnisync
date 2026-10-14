import React from 'react';
import { Bell, LogOut, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function Header({ title = 'Student' }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead } = useNotification();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors relative text-slate-600 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 py-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {n.notification_type === 'DEADLINE_UPCOMING' ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : n.notification_type === 'REVIEW_COMPLETED' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill Badge matching reference screenshots */}
        <div className="flex items-center gap-3 bg-white pl-3 pr-1 py-1 rounded-full border border-slate-200/60 shadow-xs hover:border-slate-300 transition-all">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || 'Authorized User'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">
              {user?.role} {user?.roll_number ? `· ${user.roll_number}` : ''}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">
            {getInitials(user?.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
