import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Lock, Building, Camera, CheckCircle2, ShieldAlert, Check } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [city, setCity] = useState(user?.city || '');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !mobile || !city) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await updateProfile({
        name,
        mobile,
        city,
        password: password || undefined
      });

      if (data.success) {
        if (password.trim() !== '') {
          setShowSuccessModal(true);
          setPassword('');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 3000);
        } else {
          setSuccess('Profile updated successfully!');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
        
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <User size={24} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Profile Settings</h2>
            <p className="text-xs text-slate-400">Manage your SumbaContest account details</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/20 p-3 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            {/* Email (Disabled) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Email Address (Cannot Change)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">City</label>
              <div className="relative">
                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
            </div>

          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Change Password</h3>
            <div className="flex flex-col gap-1.5 max-w-md">
              <label className="text-xs font-semibold text-slate-500">New Password (Leave blank to keep current)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2 px-6 rounded-xl shadow hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>

        </form>
      </div>

      {/* Success Redirect Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-4 items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center">
              <Check size={24} className="stroke-[3]" />
            </div>
            <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white mt-2">
              Password Updated Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your security details have changed. You are being logged out and redirected to the login page.
            </p>
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}
