import React, { useState, useEffect } from 'react';
import {
  Upload,
  Award,
  BookOpen,
  Calendar,
  FileText,
  BarChart2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  MessageSquare,
  FileCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { deliverableService } from '../../services/deliverableService';
import { submissionService } from '../../services/submissionService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import ProjectProposalForm from '../../components/student/ProjectProposalForm';

export default function MiniProject() {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  // Upload workspace state
  const [files, setFiles] = useState([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Guide messaging modal
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const loadData = async () => {
    try {
      const projList = await projectService.getProjects();
      const p = projList.results ? projList.results[0] : (Array.isArray(projList) ? projList[0] : null);
      setProject(p);

      const delivList = await deliverableService.getDeliverables();
      const dItems = delivList.results ? delivList.results : (Array.isArray(delivList) ? delivList : []);
      setDeliverables(dItems);

      const mileList = await deliverableService.getMilestones();
      const mItems = mileList.results ? mileList.results : (Array.isArray(mileList) ? mileList : []);
      setMilestones(mItems);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentDeliverable = deliverables.find((d) => d.week_number === selectedWeek) || deliverables[0];

  const handleFileUpload = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!project || !currentDeliverable) return;

    setSubmitting(true);
    setSubmitSuccess('');
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('project', project.id);
      formData.append('deliverable', currentDeliverable.id);
      formData.append('notes', notes);
      if (repoUrl) formData.append('repo_url', repoUrl);
      if (demoUrl) formData.append('demo_url', demoUrl);

      files.forEach((file) => {
        formData.append('files', file);
      });

      await submissionService.submitDeliverable(formData);
      setSubmitSuccess(`Deliverables for Week ${selectedWeek} submitted successfully!`);
      setFiles([]);
      setNotes('');
      setRepoUrl('');
      setDemoUrl('');
      await loadData();
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(err.response?.data?.detail || 'Failed to submit deliverables. Check file types and limits.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!project?.primary_mentor || !messageContent) return;

    setSendingMsg(true);
    try {
      await notificationService.sendMessage({
        recipient: project.primary_mentor.id,
        project: project.id,
        subject: messageSubject || 'Guidance on Capstone Deliverable',
        content: messageContent,
      });
      setMsgSent(true);
      setTimeout(() => {
        setMessageModalOpen(false);
        setMsgSent(false);
        setMessageSubject('');
        setMessageContent('');
      }, 1500);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!project) {
    return <ProjectProposalForm onSubmitted={(submittedProject) => setProject(submittedProject)} />;
  }

  const completedCount = deliverables.filter((d) => d.my_submission?.status === 'APPROVED').length;
  const progressPct = Math.round((completedCount / (deliverables.length || 16)) * 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Project Hero Banner matching screenshot 3 */}
      <div className="bg-project-banner rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                {project?.batch || 'BATCH 2024120248'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                SECTION {user?.section || 'C'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                MINI PROJECT ({user?.semester || 'SEMESTER 5'})
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Week 1 Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              {project?.title || 'Powerblind+: An Explainable Smart Meter Anomaly Detection and Decision Support System'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium pt-1">
              <span>Domain: <strong className="text-white">{project?.domain || 'Data Science'}</strong></span>
              <span>•</span>
              <span>Guide: <strong className="text-white">{project?.primary_mentor?.name || 'Ms Ch Dhanalaxmi'}</strong></span>
              <span>•</span>
              <span>Coordinator: <strong className="text-white">{project?.coordinator || 'Ms T Prashanthi'}</strong></span>
            </div>
          </div>

          {/* Right Stats in Banner matching screenshot 3 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-4 text-center min-w-[120px]">
              <div className="text-3xl font-black text-cyan-400">
                {completedCount}/<span className="text-lg text-slate-400">16</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Weeks Done
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-4 text-center min-w-[110px]">
              <div className="text-3xl font-black text-emerald-400">
                {progressPct}%
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Progress
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Navigation / Metric Cards matching screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-purple-600 text-white rounded-2xl p-4 shadow-md shadow-purple-600/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Upload className="w-5 h-5 text-purple-200" />
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/20">W1</span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-white">Weekly Progress</div>
            <div className="text-[10px] text-purple-200">Upload & 4×4 Grid</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <span className="text-emerald-600">R1:0M</span>
            <span>•</span>
            <span className="text-emerald-600">R2:27M</span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-900">Project Reviews</div>
            <div className="text-[10px] text-slate-500">Evaluations & CIE</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-900">Project Timeline</div>
            <div className="text-[10px] text-slate-500">16 Weeks Schedule</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <FileText className="w-5 h-5 text-emerald-600" />
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-900">Doc Templates</div>
            <div className="text-[10px] text-slate-500">IEEE Guidelines</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <BarChart2 className="w-5 h-5 text-cyan-600" />
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-900">Mini Gradebook</div>
            <div className="text-[10px] text-slate-500">CIE Moderate Marks</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <RefreshCw className="w-5 h-5 text-slate-600" />
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-900">Change Requests</div>
            <div className="text-[10px] text-slate-500">Title / Scope</div>
          </div>
        </div>
      </div>

      {/* 3. Deliverable Upload Workspace matching screenshot 5 */}
      {currentDeliverable && (
        <div className="bg-white rounded-3xl border-2 border-purple-200 shadow-xl shadow-purple-900/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-purple-600/30">
                W{currentDeliverable.week_number}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                Deliverable Upload Workspace
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                Current Active Week
              </span>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Weekly Deadline
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                {currentDeliverable.due_date || '28 Jul 2026'}
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Week {currentDeliverable.week_number}: {currentDeliverable.title}
          </h2>

          {/* Institutional Evaluation Notice matching screenshot 5 */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Institutional Evaluation Notice:</strong> Deliverables are reviewed weekly by your Project Guide. Submissions past the deadline are automatically locked or marked 0 in compliance with VCE academic regulations.
            </div>
          </div>

          {/* Required Deliverables List matching screenshot 5 */}
          <div>
            <div className="text-xs font-bold text-purple-700 tracking-wider uppercase mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Required Deliverables for Week {currentDeliverable.week_number}:
            </div>
            <div className="flex flex-wrap gap-3">
              {(currentDeliverable.required_deliverables || []).map((reqItem, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{reqItem}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmitDeliverable} className="space-y-5 pt-2">
            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {submitSuccess}
              </div>
            )}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                {submitError}
              </div>
            )}

            {/* Drag and Drop Zone matching screenshot 5 */}
            <div className="border-2 border-dashed border-purple-300 rounded-3xl p-8 text-center bg-purple-50/20 hover:bg-purple-50/40 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.zip"
              />
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Click to Upload or Drag & Drop Week {currentDeliverable.week_number} Deliverables
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, Word Documents, ZIP Archives & PPT Decks (Max 25MB each)
              </p>
            </div>

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Attached Files:</span>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span className="max-w-[200px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="text-slate-400 hover:text-red-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/organization/project-name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Live Demonstration URL (Optional)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://project-demo.vercel.app"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Submission Notes & Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief summary of tasks accomplished this week and items attached..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                {currentDeliverable.my_submission ? (
                  <span>
                    Current Revision: <strong>Rev {currentDeliverable.my_submission.revision_number}</strong> (Status: <strong>{currentDeliverable.my_submission.status}</strong>)
                  </span>
                ) : (
                  <span>Status: <strong>Not Submitted</strong></span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Deliverables'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Feedback & Submission Revisions Display if exists */}
          {currentDeliverable.my_submission && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Review Outcome & Faculty Feedback
              </h4>
              {currentDeliverable.my_submission.latest_review ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Evaluated by {currentDeliverable.my_submission.latest_review.reviewer_details?.name || 'Project Guide'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                      {currentDeliverable.my_submission.latest_review.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "{currentDeliverable.my_submission.latest_review.feedback}"
                  </p>
                  {currentDeliverable.my_submission.latest_review.marks_awarded !== null && (
                    <div className="text-xs font-bold text-blue-600">
                      Marks: {currentDeliverable.my_submission.latest_review.marks_awarded} / {currentDeliverable.my_submission.latest_review.max_marks} M
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Submission received. Awaiting faculty review and panel evaluation.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. 16-Week Deliverables Matrix (4x4 Grid) matching screenshot 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                16-Week Deliverables Matrix (4×4 Grid)
              </h3>
              <p className="text-xs text-slate-500">
                Click any week to switch the upload workspace above
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {completedCount}/16 Completed
            </span>
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {deliverables.map((deliv) => {
              const isSelected = selectedWeek === deliv.week_number;
              const hasSubmission = Boolean(deliv.my_submission);
              const isApproved = deliv.my_submission?.status === 'APPROVED';

              return (
                <div
                  key={deliv.id}
                  onClick={() => setSelectedWeek(deliv.week_number)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between min-h-[110px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border-transparent scale-[1.02]'
                      : 'bg-white border-slate-200/80 hover:border-purple-300 text-slate-800 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      W{deliv.week_number}
                    </span>
                    {isApproved && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-500'}`} />
                    )}
                  </div>

                  <div className="my-2">
                    <p className={`text-xs font-bold line-clamp-2 leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {deliv.title}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isApproved
                          ? 'bg-emerald-50 text-emerald-700'
                          : hasSubmission
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isSelected ? 'ACTIVE NOW' : isApproved ? 'APPROVED' : hasSubmission ? 'SUBMITTED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panels: Review Milestones + Guide info matching screenshot 4 */}
        <div className="space-y-6">
          {/* Review Milestones Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Review Milestones
                </h4>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                30M Each
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{m.title}</span>
                    {m.status === 'COMPLETED' ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        27 / 30M
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Dates Not Allotted</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team & Mentorship Card with Message Button matching screenshot 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Team & Mentorship
              </h4>
              <span className="text-[10px] font-bold text-slate-500">
                {project?.batch || 'BATCH 2024120248'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Project Guide
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {project?.primary_mentor?.name || 'Ms Ch Dhanalaxmi'}
                </div>
              </div>

              <button
                onClick={() => setMessageModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message Guide →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Messaging Modal */}
      {messageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Message Project Guide ({project?.primary_mentor?.name || 'Guide'})
              </h3>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {msgSent ? (
              <div className="py-8 text-center text-emerald-600 font-bold text-sm">
                Message sent successfully to guide!
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="e.g. Question regarding Week 1 Literature Review"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message or clarification request here..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMessageModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    {sendingMsg ? 'Sending...' : 'Send Message'}
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
