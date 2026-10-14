import React, { useState, useEffect } from 'react';
import { Mail, Bell, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function Inbox() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('NOTIFICATIONS');
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send Message Modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const loadInbox = async () => {
    try {
      const nData = await notificationService.getNotifications();
      const nList = nData.results ? nData.results : (Array.isArray(nData) ? nData : []);
      setNotifications(nList);

      const mData = await notificationService.getMessages();
      const mList = mData.results ? mData.results : (Array.isArray(mData) ? mData : []);
      setMessages(mList);

      const uData = await authService.getUsers();
      const uList = uData.results ? uData.results : (Array.isArray(uData) ? uData : []);
      setUsersList(uList);
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!recipientId || !content) return;
    setSending(true);
    try {
      await notificationService.sendMessage({
        recipient: recipientId,
        subject: subject || 'Academic Project Discussion',
        content,
      });
      setSentSuccess(true);
      setTimeout(() => {
        setComposeOpen(false);
        setSentSuccess(false);
        setRecipientId('');
        setSubject('');
        setContent('');
      }, 1200);
      await loadInbox();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Communications & Notifications Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review official faculty feedback, milestone alerts, and coordinate with team members and mentors.
          </p>
        </div>

        <button
          onClick={() => setComposeOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          Compose Message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'border-[#2160FF] text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('MESSAGES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'MESSAGES'
              ? 'border-[#2160FF] text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Direct Messages ({messages.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'NOTIFICATIONS' ? (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No notifications in inbox.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  !n.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
                {!n.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {messages.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No direct messages yet.
            </div>
          ) : (
            messages.map((m) => {
              const isSender = m.sender === user?.id;
              return (
                <div key={m.id} className="p-5 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {isSender ? `To: ${m.recipient_details?.name}` : `From: ${m.sender_details?.name}`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {m.subject}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Compose Direct Message</h3>
              <button onClick={() => setComposeOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            {sentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                Message dispatched successfully!
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient</label>
                  <select
                    required
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="">-- Choose faculty guide or student --</option>
                    {usersList
                      .filter((u) => u.id !== user?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role} · {u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Guidance regarding Literature Survey"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2.5 text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
