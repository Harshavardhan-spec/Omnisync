import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  ExternalLink,
  Award,
  BookOpen,
  BarChart2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { deliverableService } from '../../services/deliverableService';
import { useAuth } from '../../context/AuthContext';

export default function StudentOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await reportService.getStudentDashboard();
        setDashboardData(data);
        const taskList = await deliverableService.getTasks();
        const items = taskList.results ? taskList.results : (Array.isArray(taskList) ? taskList : []);
        setTasks(items);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
        setError('Unable to load your dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  if (dashboardData && !dashboardData.has_project) {
    const profile = dashboardData.user || {};
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <h1 className="text-lg font-bold text-slate-900">No project assigned yet</h1>
        <p className="mt-2 text-sm text-slate-500">{profile.name || 'Your account'} does not currently have an active project. Contact your department coordinator for assistance.</p>
      </div>
    );
  }

  const s = dashboardData?.student || {};
  const p = dashboardData?.project || {};
  const stats = dashboardData?.stats || {
    completed_weeks: 0,
    total_weeks: 0,
    pending_tasks: 0,
    latest_review_score: '—',
  };
  const exam = dashboardData?.active_exam_banner;
  const cie = dashboardData?.cie_progress;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Profile Summary Banner matching screenshot 1 */}
      <div className="bg-project-banner rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner">
              {s.name ? s.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/30 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
                  SECTION {s.section || 'C'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-xs">
                  {s.roll_number || '24881A12H3'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/30 text-purple-200 border border-purple-400/30 backdrop-blur-xs">
                  {s.semester || 'SEMESTER 5 (3-1)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {s.name || 'Saddi Amulya Reddy'}
              </h1>
              <p className="text-sm text-slate-300 mt-1 font-medium">
                {s.college || 'Vardhaman College of Engineering'} · {s.department || 'Information Technology'}
              </p>
            </div>
          </div>

          {/* Right Stats Cards matching screenshot 1 */}
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {/* Weeks done */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-3 text-center min-w-[110px] shrink-0">
              <div className="text-2xl font-black text-cyan-400">
                {stats.completed_weeks}/<span className="text-base text-slate-400">{stats.total_weeks}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Weeks Done
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-3 text-center min-w-[110px] shrink-0">
              <div className="text-2xl font-black text-amber-400">
                {stats.pending_tasks}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Pending Tasks
              </div>
            </div>

            {/* Last Review */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-3 text-center min-w-[120px] shrink-0">
              <div className="text-2xl font-black text-blue-400">
                {stats.latest_review_score}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Last Review
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Inner Navigation Tabs matching screenshot 1 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-900 shadow-xs border border-slate-200 transition-all"
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          Dashboard
        </button>
        <button
          onClick={() => navigate('/student/mini-project')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Mini Project (3-1)
        </button>
        <button
          onClick={() => navigate('/student/tasks')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all relative"
        >
          <Award className="w-4 h-4" />
          Assessments & Tasks
          {stats.pending_tasks > 0 && (
            <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {stats.pending_tasks}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/student/gradebook')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <BarChart2 className="w-4 h-4" />
          Gradebook
        </button>
      </div>

      {/* 3. Examination / Review 3 Banner matching screenshot 1 */}
      {exam && (
        <div className="bg-exam-banner rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                DEPARTMENT EXAMINATION ACTIVE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                {exam.code}: RPPR · {exam.max_marks} MARKS
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              ⌛ Action Required: Upload Deliverables
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            {exam.title}
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mb-4">
            {exam.description}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-purple-800/30">
            <div className="space-y-1.5 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  {exam.due_date}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Venue: {exam.venue}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                {exam.cie_distribution}
              </div>
            </div>

            <button
              onClick={() => navigate('/student/weekly-deliverables')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer hover:scale-[1.02]"
            >
              Submit Deliverables
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. CIE Progress Moderated Banner matching screenshot 2 */}
      {cie && (
        <div className="bg-cie-banner rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                INTERNAL REVIEWS CIE PROGRESS
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Official Department Moderated Scores
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Evaluations are officially moderated by Convenors and Section Coordinators in compliance with VCE regulations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              {cie.r1}
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-700 shadow-xs">
              {cie.r2}
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-xs">
              {cie.r3}
            </span>
            <Link
              to="/student/gradebook"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 ml-2"
            >
              Open Reviews Hub →
            </Link>
          </div>
        </div>
      )}

      {/* 5. Quick Navigation 3-Card Row matching screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Mini Project */}
        <div
          onClick={() => navigate('/student/mini-project')}
          className="bg-white border border-amber-200/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Mini Project (3-1)</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {p.title || 'Powerblind+: An Explainable Smart Meter...'}
          </p>
          <div className="mt-4">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Review Milestones
            </span>
          </div>
        </div>

        {/* Card 2: Assessments & Tasks */}
        <div
          onClick={() => navigate('/student/tasks')}
          className="bg-white border border-rose-200/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Assessments & Tasks</h3>
          <p className="text-xs text-slate-500 mt-1">
            {stats.pending_tasks} pending deliverable(s)
          </p>
          <div className="mt-4">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {stats.pending_tasks} PENDING
            </span>
          </div>
        </div>

        {/* Card 3: My Gradebook */}
        <div
          onClick={() => navigate('/student/gradebook')}
          className="bg-white border border-emerald-200/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">My Gradebook</h3>
          <p className="text-xs text-slate-500 mt-1">Semester evaluation summary</p>
          <div className="mt-4">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              View scores →
            </span>
          </div>
        </div>
      </div>

      {/* 6. Lower Grid: Team & Mentorship + Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Team & Mentorship Card matching screenshot 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Project Team & Mentorship</h3>
            </div>
            <Link to="/student/team" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              Open Team →
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Project Title
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">
                {p.title || 'Powerblind+: An Explainable Smart Meter Anomaly Detection and Decision Support System'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Assigned Project Guide
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {p.guide_name || 'Ms Ch Dhanalaxmi'}
                </div>
                <div className="text-xs text-slate-500">{p.guide_email || 'dhanalaxmi@vardhaman.edu'}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Section Coordinator
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {p.coordinator || 'Ms T Prashanthi'}
                </div>
                <div className="text-xs text-slate-500">Information Technology</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Assessments & Tasks</h3>
            </div>
            <Link to="/student/tasks" className="text-xs font-bold text-purple-600 hover:text-purple-800">
              View All →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No pending tasks</p>
            ) : (
              tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      COURSE_PROJECT
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
