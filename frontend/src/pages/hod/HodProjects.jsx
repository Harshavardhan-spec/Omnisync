import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search,
  Filter,
  Users,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { authService } from '../../services/authService';
import HodTeamManager from '../../components/hod/HodTeamManager';

export default function HodProjects() {
  const [projects, setProjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mentor Assignment Modal
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  // Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadData = async () => {
    try {
      const projData = await projectService.getProjects();
      const pList = projData.results ? projData.results : (Array.isArray(projData) ? projData : []);
      setProjects(pList);

      const facData = await authService.getUsers({ role: 'FACULTY' });
      const fList = facData.results ? facData.results : (Array.isArray(facData) ? facData : []);
      setFacultyList(fList);

      const studentData = await authService.getUsers({ role: 'STUDENT' });
      const sList = studentData.results ? studentData.results : (Array.isArray(studentData) ? studentData : []);
      setStudentList(sList);
    } catch (err) {
      console.error('Failed to load HOD projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (projectId) => {
    try {
      await projectService.approveProject(projectId);
      await loadData();
    } catch (err) {
      console.error('Failed to approve project:', err);
      alert('Failed to approve project.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedProject || !rejectionReason) return;
    setRejecting(true);
    try {
      await projectService.rejectProject(selectedProject.id, rejectionReason);
      setRejectModalOpen(false);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      console.error('Failed to reject project:', err);
    } finally {
      setRejecting(false);
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    if (!selectedProject || !selectedFacultyId) return;
    setAssigning(true);
    try {
      await projectService.assignMentor(selectedProject.id, selectedFacultyId);
      setMentorModalOpen(false);
      setSelectedFacultyId('');
      await loadData();
    } catch (err) {
      console.error('Failed to assign mentor:', err);
    } finally {
      setAssigning(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.title.toLowerCase().includes(term) ||
        p.domain.toLowerCase().includes(term) ||
        p.created_by?.name?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Department Project Registry & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student capstone submissions, allocate faculty guides, and track team compositions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, domain, or student leader..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#2160FF] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No projects found matching the selected filter.
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const isPending = proj.status === 'PENDING_APPROVAL';
            const isApproved = proj.status === 'APPROVED' || proj.status === 'IN_PROGRESS';

            return (
              <div
                key={proj.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {proj.batch || 'BATCH 2024120248'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        {proj.domain}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {proj.objective}
                    </p>
                  </div>

                  {/* Actions for HOD */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(proj.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(proj);
                            setRejectModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {isApproved ? (
                      <button
                        onClick={() => {
                          setSelectedProject(proj);
                          setMentorModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-purple-200"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {proj.primary_mentor ? 'Reassign Guide' : 'Assign Guide'}
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700">Approve before assigning a guide</span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProject(proj);
                        setTeamModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-blue-200"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Manage Team
                    </button>
                  </div>
                </div>

                {/* Team & Assigned Guide Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Team & Members</span>
                    <p className="font-bold text-slate-900 mt-0.5">{proj.team?.name || 'Project Team'}</p>
                    <p className="text-[11px] text-slate-500">
                      Leader: {proj.created_by?.name} ({proj.created_by?.roll_number || 'N/A'})
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Project Guide</span>
                    {proj.primary_mentor ? (
                      <p className="font-bold text-purple-700 mt-0.5">{proj.primary_mentor.name}</p>
                    ) : (
                      <p className="font-semibold text-amber-600 mt-0.5">⚠️ Guide Not Assigned Yet</p>
                    )}
                    <p className="text-[11px] text-slate-500">{proj.primary_mentor?.email || ''}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Health Diagnostic</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      Status: {proj.health?.status || 'ON_TRACK'} ({proj.health?.score || 100}%)
                    </p>
                    <p className="text-[11px] text-slate-500">{proj.health?.suggested_action}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {teamModalOpen && selectedProject && (
        <HodTeamManager
          project={selectedProject}
          students={studentList.filter((student) => student.department === selectedProject.department)}
          onClose={() => setTeamModalOpen(false)}
          onUpdated={async () => {
            const updatedProject = await projectService.getProject(selectedProject.id);
            setSelectedProject(updatedProject);
            await loadData();
          }}
        />
      )}

      {/* Mentor Assignment Modal */}
      {mentorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Assign Faculty Guide</h3>
              <button onClick={() => setMentorModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Project: <strong>{selectedProject?.title}</strong>
            </p>

            <form onSubmit={handleAssignMentor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Faculty Mentor
                </label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-hidden"
                >
                  <option value="">-- Choose faculty mentor --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMentorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 text-xs font-bold bg-[#2160FF] text-white hover:bg-blue-700 rounded-xl cursor-pointer"
                >
                  {assigning ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reject Project Proposal</h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide feedback and academic reasons for rejecting <strong>{selectedProject?.title}</strong>:
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why this proposal was rejected and directives for resubmission..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-5 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer"
                >
                  {rejecting ? 'Rejecting...' : 'Reject Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
