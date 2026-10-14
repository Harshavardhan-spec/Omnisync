import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Shield, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('amulya.reddy@student.vardhaman.edu');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      navigate(data.redirect_path || '/student');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Logo matching screenshots */}
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white font-black text-xl">
            VCE
          </div>
          <div className="text-left">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight block">
              Omnisync Capstone
            </span>
            <span className="text-xs font-bold text-blue-600 tracking-widest uppercase block">
              Campus Project Management Platform
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Sign In to Your Academic Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Unified portal access for Department Head, Faculty Guides, and Student Teams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vardhaman.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#2160FF] hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Role Demonstration Logins:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('amulya.reddy@student.vardhaman.edu')}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition-all text-center cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('dhanalaxmi@vardhaman.edu')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-all text-center cursor-pointer"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('hod.it@vardhaman.edu')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-all text-center cursor-pointer"
              >
                HOD
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Default password for all accounts: <code>Password@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
