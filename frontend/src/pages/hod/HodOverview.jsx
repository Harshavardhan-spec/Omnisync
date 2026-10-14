import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Activity,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function HodOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await reportService.getDepartmentReport();
        setReport(data);
      } catch (err) {
        console.error('Failed to load department report:', err);
        setError('Unable to load the department report. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }

  const metrics = report?.metrics || {
    total_projects: 0,
    active_projects: 0,
    pending_approval: 0,
    completed_projects: 0,
    projects_at_risk: 0,
    projects_delayed: 0,
    projects_on_track: 0,
    pending_reviews: 0,
    total_faculty: 0,
  };

  const queue = report?.intervention_queue || [];
  const deadlines = report?.upcoming_deadlines || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-project-banner rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                HEAD OF DEPARTMENT
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                {user?.department_details?.name || 'Information Technology'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Department Project Overview
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Centralized Capstone Oversight, Mentor Allocation, and Academic Intervention Hub
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={reportService.exportCSVUrl}
              download
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV Report
            </a>
            <button
              onClick={() => navigate('/hod/approvals')}
              className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <FolderGit2 className="w-4 h-4" />
              Approvals ({metrics.pending_approval})
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Registered
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {metrics.total_projects}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Projects enrolled</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active in Progress
          </div>
          <div className="text-3xl font-black text-blue-600 mt-1">
            {metrics.active_projects}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Under development</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Awaiting Approval
          </div>
          <div className="text-3xl font-black text-amber-500 mt-1">
            {metrics.pending_approval}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Proposals submitted</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Faculty Guides
          </div>
          <div className="text-3xl font-black text-purple-600 mt-1">
            {metrics.total_faculty}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Mentors assigned</div>
        </div>
      </div>

      {/* Prioritized Intervention Queue matching section 14 */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Prioritized Intervention Queue (Explainable Health)
              </h3>
              <p className="text-xs text-slate-500">
                Rule-based health monitoring detecting delayed tasks, upcoming milestone risks, and required corrections.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {queue.length} Flagged
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            All department capstone projects are currently ON TRACK. No urgent interventions needed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div key={item.project_id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        item.status === 'DELAYED'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status} ({item.score}%)
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  </div>

                  <div className="space-y-1 pl-1">
                    {item.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {r}
                      </p>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                    💡 Suggested Action: {item.suggested_action}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => navigate('/hod/projects')}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 shadow-2xs transition-all"
                  >
                    View Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Academic Deadlines */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          Upcoming Academic Deliverable Deadlines
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deadlines.length === 0 ? (
            <p className="text-xs text-slate-500">No upcoming deliverable deadlines.</p>
          ) : deadlines.map((d) => (
            <div key={d.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{d.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Due Date: {d.due_date}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
