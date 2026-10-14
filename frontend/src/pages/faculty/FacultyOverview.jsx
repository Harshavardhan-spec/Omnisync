import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { projectService } from '../../services/projectService';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';

export default function FacultyOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await reportService.getFacultyReport();
        setReport(data);
      } catch (err) {
        console.error('Failed to load faculty report:', err);
        setError('Unable to load your faculty report. Please try again.');
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
    total_assigned_projects: 0,
    submissions_awaiting_review: 0,
    reviews_completed: 0,
  };
  const projects = report?.projects || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-project-banner rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              FACULTY & MENTOR PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Project Guide · {user?.department_details?.name || 'Department of Information Technology'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/faculty/submissions')}
              className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileCheck className="w-4 h-4" />
              Review Submissions ({metrics.submissions_awaiting_review})
            </button>
          </div>
        </div>
      </div>

      {/* Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Projects
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {metrics.total_assigned_projects}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderGit2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Submissions Awaiting Review
            </div>
            <div className="text-3xl font-black text-amber-500 mt-1">
              {metrics.submissions_awaiting_review}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Reviews Completed
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {metrics.reviews_completed}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Assigned Projects Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Supervised Capstone Projects</h3>
          <span className="text-xs text-slate-500">
            Total Supervised: <strong>{projects.length}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500">No projects are currently assigned to you.</p>
          ) : projects.map((p) => (
            <div key={p.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      p.health?.status === 'DELAYED'
                        ? 'bg-red-100 text-red-700'
                        : p.health?.status === 'AT_RISK'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    HEALTH: {p.health?.status || 'ON_TRACK'}
                  </span>
                  <span className="text-xs text-slate-400">Team: <strong>{p.team_name}</strong></span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">{p.title}</h4>
                <p className="text-xs text-slate-500">{p.health?.suggested_action}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/faculty/submissions')}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  Submissions Queue ({p.pending_submissions})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
