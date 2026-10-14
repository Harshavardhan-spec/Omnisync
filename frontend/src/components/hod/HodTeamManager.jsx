import { useMemo, useState } from 'react';
import { UserMinus, UserPlus, Users, X } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function HodTeamManager({ project, students, onClose, onUpdated }) {
  const [studentId, setStudentId] = useState('');
  const [responsibility, setResponsibility] = useState('Module Development');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const members = project.team?.memberships || [];
  const memberIds = useMemo(() => new Set(members.filter((member) => member.status === 'ACTIVE').map((member) => String(member.student))), [members]);
  const availableStudents = students.filter((student) => !memberIds.has(String(student.id)));

  const addMember = async (event) => {
    event.preventDefault();
    if (!studentId || !project.team?.id) return;
    setSaving(true);
    setError('');
    try {
      await projectService.addTeamMember(project.team.id, studentId, responsibility);
      await onUpdated();
      setStudentId('');
      setResponsibility('Module Development');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to add this student to the team.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (member) => {
    setSaving(true);
    setError('');
    try {
      await projectService.removeTeamMember(project.team.id, member.student);
      await onUpdated();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to remove this student from the team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold text-slate-900">Manage project team</h2><p className="mt-0.5 text-xs text-slate-500">{project.title}</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Current members</p>
          {members.filter((member) => member.status === 'ACTIVE').map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-xs">
              <div><p className="font-bold text-slate-800">{member.student_details?.name || 'Student'} {member.role === 'LEADER' && <span className="ml-1 text-[10px] text-blue-600">TEAM LEADER</span>}</p><p className="mt-0.5 text-slate-500">{member.student_details?.roll_number || member.student_details?.email} · {member.responsibility}</p></div>
              {member.role !== 'LEADER' && <button disabled={saving} onClick={() => removeMember(member)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><UserMinus className="h-3.5 w-3.5" /> Remove</button>}
            </div>
          ))}
        </div>
        <form onSubmit={addMember} className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-800">Add student</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-blue-500"><option value="">Choose a student</option>{availableStudents.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.roll_number || student.email})</option>)}</select>
            <input value={responsibility} onChange={(event) => setResponsibility(event.target.value)} placeholder="Responsibility" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={saving || !availableStudents.length} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#2160FF] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" /> Add</button>
          </div>
          {!availableStudents.length && <p className="text-xs text-slate-500">No additional students are available for this project.</p>}
        </form>
      </div>
    </div>
  );
}
