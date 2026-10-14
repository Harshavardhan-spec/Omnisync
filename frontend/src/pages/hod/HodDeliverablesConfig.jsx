import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, CheckCircle2, Clock, FileCheck } from 'lucide-react';
import { deliverableService } from '../../services/deliverableService';

export default function HodDeliverablesConfig() {
  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create Deliverable Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeDeliv, setActiveDeliv] = useState(null);
  const [weekNum, setWeekNum] = useState(1);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reqItems, setReqItems] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(10);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const dData = await deliverableService.getDeliverables();
      const dList = dData.results ? dData.results : (Array.isArray(dData) ? dData : []);
      setDeliverables(dList);

      const mData = await deliverableService.getMilestones();
      const mList = mData.results ? mData.results : (Array.isArray(mData) ? mData : []);
      setMilestones(mList);
    } catch (err) {
      console.error('Failed to load deliverables config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (deliv) => {
    setActiveDeliv(deliv);
    setWeekNum(deliv ? deliv.week_number : deliverables.length + 1);
    setTitle(deliv ? deliv.title : '');
    setDesc(deliv ? deliv.description : '');
    setReqItems(deliv ? deliv.required_deliverables.join('\n') : '');
    setDueDate(deliv ? deliv.due_date : '');
    setMaxMarks(deliv ? deliv.maximum_marks : 10);
    setEditModalOpen(true);
  };

  const handleSaveDeliverable = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        week_number: parseInt(weekNum),
        title,
        description: desc,
        required_deliverables: reqItems.split('\n').map((s) => s.trim()).filter(Boolean),
        due_date: dueDate || null,
        maximum_marks: parseFloat(maxMarks),
        department: 1, // Default IT Department
        semester: 1,   // Default 3-1 Semester
      };

      if (activeDeliv) {
        await deliverableService.updateDeliverable(activeDeliv.id, payload);
      } else {
        await deliverableService.createDeliverable(payload);
      }
      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save deliverable config:', err);
      alert('Failed to save deliverable configuration.');
    } finally {
      setSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Schedule & Deliverables Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define the 16-week project lifecycle, weekly deliverable artifacts, and review milestone dates for the department.
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit(null)}
          className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Week Deliverable
        </button>
      </div>

      {/* 4 Review Milestones Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          University Review Milestones (CIE Framework)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m) => (
            <div key={m.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-700">Milestone #{m.order}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {m.weightage_marks} Marks
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>
              <div className="text-[10px] font-semibold text-slate-600 pt-1 border-t border-purple-100">
                Due: {m.due_date || 'Schedule in progress'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 16-Week Deliverables Schedule Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Configured 16-Week Academic Deliverables
          </h3>
          <span className="text-xs text-slate-500">
            Total Weeks: <strong>{deliverables.length}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {deliverables.map((deliv) => (
            <div
              key={deliv.id}
              className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                    W{deliv.week_number}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{deliv.title}</h4>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(deliv.required_deliverables || []).map((req, i) => (
                    <span key={i} className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      ✓ {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Deadline</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {deliv.due_date || 'No deadline'}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(deliv)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
                  title="Configure week"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {activeDeliv ? `Edit Week ${activeDeliv.week_number} Deliverable` : 'Add Academic Week Deliverable'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeliverable} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={weekNum}
                    onChange={(e) => setWeekNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Problem Formulation & Literature Survey"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Deliverables (One item per line)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqItems}
                  onChange={(e) => setReqItems(e.target.value)}
                  placeholder="1 Problem Statement Document (PDF)&#10;2 Domain Feasibility Study&#10;3 Survey of 5 Base IEEE Papers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
