import React, { useState, useEffect } from 'react';
import { Award, Clock, CheckCircle2, AlertTriangle, Plus, Filter } from 'lucide-react';
import { deliverableService } from '../../services/deliverableService';
import { useAuth } from '../../context/AuthContext';

export default function StudentTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // New task modal
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await deliverableService.getTasks();
      const list = data.results ? data.results : (Array.isArray(data) ? data : []);
      setTasks(list);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    setCreating(true);
    try {
      // Find user's project
      const projects = await deliverableService.getDeliverables();
      await deliverableService.createTask({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        due_date: newDueDate || null,
        status: 'TODO',
        assigned_to: user.id,
        project: 1, // Default project
      });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      await fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await deliverableService.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'ACTIVE') return t.status === 'TODO' || t.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED';
    if (activeTab === 'OVERDUE') return t.status === 'OVERDUE' || t.is_overdue;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assessments & Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track weekly milestones, course end deliverables, and individual project responsibilities.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Custom Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'ACTIVE', label: 'Active & Due' },
          { id: 'COMPLETED', label: 'Completed & Graded' },
          { id: 'OVERDUE', label: 'Overdue' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#2160FF] text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No tasks found matching this filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      task.priority === 'HIGH' || task.priority === 'URGENT'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.priority} PRIORITY
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Due: {task.due_date || 'No deadline'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  {task.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer outline-hidden ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : task.status === 'OVERDUE'
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Project Task</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Conduct IEEE Paper Analysis"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Specific requirements, submodules, or acceptance criteria..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 rounded-xl"
                >
                  {creating ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
