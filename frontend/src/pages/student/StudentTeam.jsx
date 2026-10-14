import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Phone, UserCheck, Trash2, AlertCircle } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function StudentTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [project, setProject] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTeamData = async () => {
    try {
      const teams = await projectService.getTeams();
      const t = teams.results ? teams.results[0] : (Array.isArray(teams) ? teams[0] : null);
      setTeam(t);

      const projects = await projectService.getProjects();
      const p = projects.results ? projects.results[0] : (Array.isArray(projects) ? projects[0] : null);
      setProject(p);

      // Load all students for member invite/add
      const students = await authService.getUsers({ role: 'STUDENT' });
      const sList = students.results ? students.results : (Array.isArray(students) ? students : []);
      setAvailableStudents(sList);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!team || !selectedStudentId) return;

    setAdding(true);
    setErrorMsg('');
    try {
      await projectService.addTeamMember(
        team.id,
        selectedStudentId,
        responsibility || 'Module Development'
      );
      setShowAddModal(false);
      setSelectedStudentId('');
      setResponsibility('');
      await loadTeamData();
    } catch (err) {
      console.error('Failed to add member:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to add member. Check team size or duplicate membership.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await projectService.removeTeamMember(team.id, studentId);
      await loadTeamData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isLeader = team?.leader?.id === user?.id;
  const memberships = team?.memberships?.filter((m) => m.status === 'ACTIVE') || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Team & Mentorship
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your project roster, assign subsystem responsibilities, and coordinate with your faculty guide.
          </p>
        </div>

        {isLeader && memberships.length < (team?.max_members || 4) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#2160FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Team Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
              Active Project Team
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              {team?.name || 'Powerblind AI Core Team'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Project: <strong>{project?.title}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500">
              Capacity: <strong>{memberships.length}</strong> / {team?.max_members || 4} Members
            </span>
          </div>
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {memberships.map((m) => {
            const isMe = m.student?.id === user?.id;
            const isMemberLeader = m.role === 'LEADER';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isMemberLeader
                    ? 'bg-purple-50/30 border-purple-200'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {m.student_details?.name ? m.student_details.name.charAt(0) : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {m.student_details?.name}
                        </h4>
                        {isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {m.student_details?.roll_number} · Section {m.student_details?.section || 'C'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isMemberLeader
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    {m.role}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Responsibility
                    </span>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {m.responsibility}
                    </p>
                  </div>

                  {isLeader && !isMemberLeader && (
                    <button
                      onClick={() => handleRemoveMember(m.student)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Faculty Guide Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Assigned Faculty Mentorship
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl bg-purple-50/40 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-purple-600/30">
              G
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {project?.primary_mentor?.name || 'Ms Ch Dhanalaxmi'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Assistant Professor · Department of Information Technology
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  {project?.primary_mentor?.email || 'dhanalaxmi@vardhaman.edu'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  {project?.primary_mentor?.phone || '+91 9876543210'}
                </span>
              </div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
            Primary Guide Assigned
          </span>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="">-- Choose student from department --</option>
                  {availableStudents
                    .filter((s) => !memberships.some((m) => m.student === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roll_number || s.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Subsystem Responsibility
                </label>
                <input
                  type="text"
                  required
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  placeholder="e.g. Data Pipeline & Backend APIs"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 rounded-xl"
                >
                  {adding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
