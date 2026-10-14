import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertCircle, BarChart2, ShieldCheck, Download } from 'lucide-react';
import { assessmentService } from '../../services/assessmentService';

export default function StudentGradebook() {
  const [gradebook, setGradebook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradebook = async () => {
      try {
        const data = await assessmentService.getGradebook();
        setGradebook(data);
      } catch (err) {
        console.error('Failed to load gradebook:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGradebook();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const assessments = gradebook?.assessments || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Academic Performance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            My Gradebook & CIE Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Grades are calculated dynamically based on department Continuous Internal Evaluation (CIE) weightage formulas.
          </p>
        </div>

        {/* Dynamic Computed Overall Score */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0">
          <div className="text-center px-4 border-r border-slate-200">
            <div className="text-3xl font-black text-slate-900">
              {gradebook?.overall_percentage !== null ? `${gradebook?.overall_percentage}%` : '—'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Overall Score
            </div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-black text-purple-600">
              {gradebook?.final_grade || 'Incomplete'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Final Grade
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Assessment Breakdown & Review Scores
          </h3>
          <span className="text-xs text-slate-500">
            Evaluated Weightage: <strong>{gradebook?.total_evaluated_weightage}%</strong> / {gradebook?.total_possible_weightage}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Assessment / Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Max Marks</th>
                <th className="px-6 py-4">Marks Obtained</th>
                <th className="px-6 py-4">Weightage</th>
                <th className="px-6 py-4">Contribution</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assessments.map((item) => (
                <tr key={item.assessment_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-[10px]">
                        {item.code}
                      </span>
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.type}</td>
                  <td className="px-6 py-4 font-semibold">{item.max_marks} M</td>
                  <td className="px-6 py-4">
                    {item.marks_obtained !== null ? (
                      <span className="font-bold text-emerald-600 text-sm">
                        {item.marks_obtained} M
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not evaluated</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">{item.weightage}%</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {item.weighted_contribution !== null ? `${item.weighted_contribution}%` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Evaluated'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluator Feedback Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Authorized Evaluator Feedback</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments
            .filter((a) => a.feedback)
            .map((a) => (
              <div key={a.assessment_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700">{a.code}: {a.title}</span>
                  <span className="text-[10px] text-slate-400">{a.evaluator_name || 'Guide'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{a.feedback}"
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
