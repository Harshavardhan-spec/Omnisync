import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';

export default function FacultySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [activeSub, setActiveSub] = useState(null);
  const [reviewOutcome, setReviewOutcome] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [marksAwarded, setMarksAwarded] = useState(28);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchSubmissions = async () => {
    try {
      const data = await submissionService.getSubmissions();
      const list = data.results ? data.results : (Array.isArray(data) ? data : []);
      setSubmissions(list);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenReview = (sub) => {
    setActiveSub(sub);
    setReviewOutcome('APPROVED');
    setReviewFeedback(sub.latest_review?.feedback || '');
    setMarksAwarded(sub.latest_review?.marks_awarded || 28);
    setReviewSuccess('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeSub || !reviewFeedback) return;

    setSubmittingReview(true);
    try {
      await submissionService.reviewSubmission(activeSub.id, {
        outcome: reviewOutcome,
        feedback: reviewFeedback,
        marks_awarded: marksAwarded,
        max_marks: 30,
      });
      setReviewSuccess('Review successfully recorded and dispatched to students!');
      setTimeout(() => {
        setActiveSub(null);
        setReviewSuccess('');
      }, 1200);
      await fetchSubmissions();
    } catch (err) {
      console.error('Failed to review submission:', err);
      alert(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Weekly Student Submissions & Review Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect student code repositories, review submitted deliverable documents, and record structured feedback.
        </p>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No submissions pending for assigned projects.
          </div>
        ) : (
          submissions.map((sub) => {
            const isApproved = sub.status === 'APPROVED';
            const isChangesReq = sub.status === 'CHANGES_REQUESTED';

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center">
                      W{sub.deliverable_details?.week_number || 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Week {sub.deliverable_details?.week_number}: {sub.deliverable_details?.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Revision {sub.revision_number}
                    </span>
                    {sub.is_late && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                        Late Submission
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isChangesReq
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>

                {/* Submitter & Project metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Project</span>
                    <p className="font-bold text-slate-900 mt-0.5">{sub.project_title || 'Capstone Project'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted By</span>
                    <p className="font-bold text-slate-900 mt-0.5">{sub.submitted_by_details?.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Submission Time</span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {sub.notes && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <strong className="text-slate-900">Student Notes:</strong> {sub.notes}
                  </div>
                )}

                {/* External Links and Files */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {sub.repo_url && (
                    <a
                      href={sub.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      GitHub Repository
                    </a>
                  )}

                  {sub.demo_url && (
                    <a
                      href={sub.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                      Live Demo URL
                    </a>
                  )}

                  {sub.files?.map((f) => (
                    <a
                      key={f.id}
                      href={f.file_url || f.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                      {f.original_filename} ({(f.file_size / 1024).toFixed(1)} KB)
                    </a>
                  ))}
                </div>

                {/* Latest Review Display & Review Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    {sub.latest_review ? (
                      <span className="text-slate-600">
                        Last Reviewed: <strong>{sub.latest_review.outcome}</strong> (Score: <strong>{sub.latest_review.marks_awarded || '—'}/30</strong>)
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Pending your evaluation
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
                  >
                    <FileCheck className="w-4 h-4" />
                    {sub.latest_review ? 'Update / Re-Review' : 'Conduct Review'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Structured Review Modal */}
      {activeSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Structured Review & Assessment
                </h3>
                <p className="text-xs text-slate-500">
                  Week {activeSub.deliverable_details?.week_number}: {activeSub.deliverable_details?.title}
                </p>
              </div>
              <button
                onClick={() => setActiveSub(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review Outcome
                  </label>
                  <select
                    value={reviewOutcome}
                    onChange={(e) => setReviewOutcome(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="CHANGES_REQUESTED">Changes Requested (Resubmission Required)</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marks Awarded (Max 30)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={marksAwarded}
                    onChange={(e) => setMarksAwarded(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Faculty Review Feedback & Directives
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Provide specific, actionable evaluation feedback for the student team..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSub(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2160FF] hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Save & Publish Review'}
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
