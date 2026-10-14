import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, User, FolderGit2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export default function HodAuditHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await notificationService.getActivityLogs();
        const list = data.results ? data.results : (Array.isArray(data) ? data : []);
        setLogs(list);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Department Audit Trail & Activity Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete, tamper-evident record of administrative approvals, mentor assignments, submission revisions, and faculty grading actions.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">System Audit Records</h3>
          <span className="text-xs text-slate-500 font-medium">
            Total Logged Events: <strong>{logs.length}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {log.actor_name || 'System Administrator'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                      {log.actor_role || 'ADMIN'}
                    </span>
                    {log.project_title && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {log.project_title}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {log.action}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
