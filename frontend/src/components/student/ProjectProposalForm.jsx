import { useState } from 'react';
import { FilePlus2, Send } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function ProjectProposalForm({ onSubmitted }) {
  const [form, setForm] = useState({
    title: '',
    objective: '',
    description: '',
    domain: 'Software Development',
    team_name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const project = await projectService.createProject({ ...form, team_name: form.team_name || 'Project Team' });
      onSubmitted(project);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Your proposal could not be submitted. Please review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="bg-project-banner rounded-3xl p-7 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <FilePlus2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-blue-200">PROJECT PROPOSAL</p>
            <h1 className="mt-1 text-2xl font-extrabold">Submit your project title for approval</h1>
            <p className="mt-2 text-sm text-slate-300">Your HOD reviews the proposal first. A faculty guide can be assigned only after approval.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">Project title</label>
          <input required value={form.title} onChange={update('title')} placeholder="Enter a concise project title" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Team name</label>
            <input value={form.team_name} onChange={update('team_name')} placeholder="Optional team name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Project domain</label>
            <input required value={form.domain} onChange={update('domain')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">Objective</label>
          <textarea required rows="3" value={form.objective} onChange={update('objective')} placeholder="What problem will the project solve?" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">Brief description</label>
          <textarea required rows="4" value={form.description} onChange={update('description')} placeholder="Describe the proposed solution, scope, and expected outcome." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-hidden focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#2160FF] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 disabled:opacity-60">
          <Send className="h-4 w-4" />
          {submitting ? 'Submitting…' : 'Submit for HOD approval'}
        </button>
      </form>
    </div>
  );
}
