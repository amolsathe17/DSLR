import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Camera, Sun, Moon, Menu, X, LogOut, LayoutDashboard, User, Bell, CheckCheck, Check } from 'lucide-react';

export default function Navbar() {
  const { user, logout, refreshUser, apiFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadNotifs = user?.notifications ? user.notifications.filter(n => !n.isRead) : [];
  const unreadCount = unreadNotifs.length;

  const markAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/auth/notifications/${notifId}/read`, { method: 'POST' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error("Failed to mark notification as read:", err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notif of unreadNotifs) {
        await apiFetch(`/api/auth/notifications/${notif._id || unreadNotifs.indexOf(notif)}/read`, { method: 'POST' });
      }
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error("Failed to mark all as read:", err.message);
    }
  };

  const renderNotificationBell = () => {
    if (!user) return null;
    return (
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold px-1 select-none">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-xs">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCheck size={12} />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {user.notifications && user.notifications.length > 0 ? (
                [...user.notifications].reverse().map((notif, idx) => {
                  const realIdx = user.notifications.length - 1 - idx;
                  return (
                    <div
                      key={notif._id || idx}
                      onClick={(e) => !notif.isRead && markAsRead(notif._id || realIdx, e)}
                      className={`p-4 text-left transition-colors cursor-pointer flex gap-3 ${
                        notif.isRead
                          ? 'bg-transparent text-slate-500 dark:text-slate-400'
                          : 'bg-indigo-50/40 dark:bg-indigo-950/10 text-slate-900 dark:text-slate-200 font-medium'
                      } hover:bg-slate-50 dark:hover:bg-slate-850`}
                    >
                      <div className="flex-grow text-xs leading-relaxed">
                        <p>{notif.message}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={(e) => markAsRead(notif._id || realIdx, e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 self-start cursor-pointer rounded"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    if (user && (user.role === 'Participant' || user.role === 'Judge')) {
      logout();
    }
  };

  const handleJudgeClick = () => {
    if (user && user.role === 'Participant') {
      logout();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/login" state={{ forceContestant: true }} className="flex items-center gap-2 group">
              <img 
                src="/sumbacontest.jpg" 
                alt="SumbaContest Logo" 
                className="h-16 w-auto object-contain rounded-lg transition-transform group-hover:scale-102"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              About Us
            </Link>

            <Link
              to="/info"
              className={`text-sm font-medium transition-colors ${
                isActive('/info') 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Event Info
            </Link>

            <Link
              to="/gallery"
              className={`text-sm font-medium transition-colors ${
                isActive('/gallery') 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Gallery & Results
            </Link>

            {(!user || user.role === 'Admin') && (
              <Link
                to="/admin"
                state={{ forceAdmin: true }}
                onClick={handleAdminClick}
                className={`text-sm font-medium transition-colors ${
                  isActive('/admin') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Admin Portal
              </Link>
            )}

            {(!user || user.role === 'Judge' || user.role === 'Admin') && (
              <Link
                to="/judge"
                state={{ forceJudge: true }}
                onClick={handleJudgeClick}
                className={`text-sm font-medium transition-colors ${
                  isActive('/judge') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Judges Portal
              </Link>
            )}
            
            {user && user.role === 'Participant' && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}

            {user && user.role === 'Judge' && (
              <Link
                to="/judge"
                className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isActive('/judge') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}


            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                {renderNotificationBell()}
                {user.role === 'Admin' ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-lg select-none cursor-default">
                    <User size={16} />
                    <span>{user.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg transition-colors"
                  >
                    <User size={16} />
                    <span>{user.name.split(' ')[0]}</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  state={{ forceContestant: true }}
                  className="text-sm font-medium text-slate-700 hover:text-slate-955 dark:text-slate-300 dark:hover:text-white px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {renderNotificationBell()}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              About Us
            </Link>

            <Link
              to="/info"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/info') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Event Info
            </Link>

            <Link
              to="/gallery"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/gallery') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Gallery & Results
            </Link>

            {(!user || user.role === 'Admin') && (
              <Link
                to="/admin"
                state={{ forceAdmin: true }}
                onClick={() => {
                  handleAdminClick();
                  setIsOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-855'
                }`}
              >
                Admin Portal
              </Link>
            )}

            {(!user || user.role === 'Judge' || user.role === 'Admin') && (
              <Link
                to="/judge"
                state={{ forceJudge: true }}
                onClick={() => {
                  handleJudgeClick();
                  setIsOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/judge') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-855'
                }`}
              >
                Judges Portal
              </Link>
            )}

            {user && user.role === 'Participant' && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/dashboard') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Dashboard
              </Link>
            )}

            {user && user.role === 'Judge' && (
              <Link
                to="/judge"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/judge') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Dashboard
              </Link>
            )}

            <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800">
              {user ? (
                <div className="space-y-1">
                  {user.role === 'Admin' ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 select-none cursor-default">
                      <User size={18} />
                      Admin Profile ({user.name})
                    </div>
                  ) : (
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <User size={18} />
                      Profile ({user.name})
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-3">
                  <Link
                    to="/login"
                    state={{ forceContestant: true }}
                    onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2 bg-indigo-600 text-white rounded-md text-base font-medium hover:bg-indigo-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
