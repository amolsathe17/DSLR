import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Camera, Sun, Moon, Menu, X, LogOut, LayoutDashboard, User, Bell, CheckCheck, Check, Trash2, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout, refreshUser, apiFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminProfileDropdown, setShowAdminProfileDropdown] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const adminDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setShowAdminProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll detection — used to reveal logo + white navbar on landing page
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (refreshUser) refreshUser();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, refreshUser]);

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

  const deleteNotif = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/api/auth/notifications/${notifId}`, { method: 'DELETE' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error("Failed to delete notification:", err.message);
    }
  };

  const deleteAllNotifs = async (e) => {
    if (e) e.stopPropagation();
    try {
      await apiFetch('/api/auth/notifications/all', { method: 'DELETE' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error("Failed to delete all notifications:", err.message);
    }
  };

  const renderNotificationBell = () => {
    if (!user) return null;
    return (
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            if (user?.role === 'Participant') {
              setShowParticipantModal(true);
            } else {
              setShowNotifications(!showNotifications);
            }
          }}
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
          <div className="absolute right-0 mt-2 w-[280px] sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-xs">Notifications</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck size={12} />
                    Mark all as read
                  </button>
                )}
                {user?.notifications && user.notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifs}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="delete all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
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
                      <div className="flex gap-1 items-center shrink-0 self-start">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => markAsRead(notif._id || realIdx, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-850"
                            title="Dismiss (Mark read)"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotif(notif._id || realIdx, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-855"
                          title="Delete Notification"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
  const isLandingPage = location.pathname === '/';

  // Link color helper — Blue buttons with Red on mouse over (white text) when scrolled, white text on hero
  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors ${
      onHero
        ? isActive(path)
          ? 'text-white font-medium underline underline-offset-4'
          : 'text-white/90 hover:text-white font-medium'
        : 'bg-blue-600 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg font-medium shadow-xs cursor-pointer'
    }`;

  // Position: fixed on landing page so navbar overlays hero background directly; sticky elsewhere
  const navPosition = isLandingPage ? 'fixed top-0 left-0 right-0' : 'sticky top-0';

  // On landing: transparent at top, solid white once scrolled
  const navBg = isLandingPage
    ? scrolled
      ? 'bg-white dark:bg-slate-900 shadow-md border-b border-slate-200 dark:border-slate-800'
      : 'bg-transparent border-b border-transparent'
    : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md';

  // Link colors: on landing-at-top → white; on landing-scrolled or other pages → normal
  const onHero = isLandingPage && !scrolled;

  return (
    <nav className={`${navPosition} z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center h-16 transition-all duration-300 ${onHero ? 'justify-center' : 'justify-between'}`}>
          {/* Logo — hidden on hero, visible once scrolled or on inner pages */}
          <div className={`items-center ${onHero ? 'hidden' : 'flex'}`}>
            <Link
              to="/"
              className="flex items-center gap-2 group"
            >
              <img
                src="/sumbacontest.jpg"
                alt="SumbaContest Logo"
                className="h-16 w-auto object-contain rounded-lg transition-transform group-hover:scale-102"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className={`hidden md:flex items-center ${onHero ? 'justify-center gap-8 sm:gap-10 w-full' : 'gap-3'}`}>
            <Link to="/info" className={navLinkClass('/info')}>
              Event Info
            </Link>

            <Link to="/gallery" className={navLinkClass('/gallery')}>
              Gallery &amp; Results
            </Link>

            {(!user || user.role === 'Admin') && (
              <Link to="/admin" state={{ forceAdmin: true }} onClick={handleAdminClick} className={navLinkClass('/admin')}>
                Admin Portal
              </Link>
            )}

            {(!user || user.role === 'Judge' || user.role === 'Admin') && (
              <Link to="/judge" state={{ forceJudge: true }} onClick={handleJudgeClick} className={navLinkClass('/judge')}>
                Judges Portal
              </Link>
            )}
            
            {user && user.role === 'Participant' && (
              <Link to="/dashboard" className={`flex items-center gap-1.5 ${navLinkClass('/dashboard')}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}

            {user && user.role === 'Judge' && (
              <Link to="/judge" className={`flex items-center gap-1.5 ${navLinkClass('/judge')}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}

            {/* Auth Buttons — Hidden on hero page load, revealed on scroll or inner pages */}
            {!onHero && (
              user ? (
                <div className="flex items-center gap-3 ml-2">
                  {renderNotificationBell()}
                  {user.role === 'Admin' ? (
                    <div className="relative" ref={adminDropdownRef}>
                      <button
                        onClick={() => setShowAdminProfileDropdown(!showAdminProfileDropdown)}
                        className="flex items-center gap-2 text-xs font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer bg-blue-600 hover:bg-red-600 text-white"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center font-medium text-[11px] shrink-0 shadow-xs">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span>{user.name ? user.name.split(' ')[0] : 'Admin'}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showAdminProfileDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showAdminProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate">{user.email}</p>
                          </div>

                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowAdminProfileDropdown(false);
                                navigate('/admin', { state: { tab: 'profile_settings' } });
                              }}
                              className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <User size={15} className="text-indigo-600 dark:text-indigo-400" />
                              <span>Profile Settings</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowAdminProfileDropdown(false);
                                navigate('/admin', { state: { tab: 'notifications' } });
                              }}
                              className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Bell size={15} className="text-indigo-600 dark:text-indigo-400" />
                              <span>Notifications</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-blue-600 hover:bg-red-600 text-white"
                    >
                      <User size={16} />
                      <span>{user.name.split(' ')[0]}</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 ml-2">
                  <Link
                    to="/login"
                    state={{ forceContestant: true }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Register
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {!isOpen && user && renderNotificationBell()}
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
            {/* <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              About Us
            </Link> */}

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
                    <div className="space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
                        Admin ({user.name})
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/admin', { state: { tab: 'profile_settings' } });
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/admin', { state: { tab: 'notifications' } });
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                        Notifications
                      </button>
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

      {/* Participant Centered Notifications Modal Popup */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="text-indigo-600 dark:text-indigo-400" size={20} />
                <h3 className="font-display font-black text-slate-900 dark:text-white text-base">My Notifications ({unreadCount} unread)</h3>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                )}
                {user?.notifications && user.notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifs}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    title="delete all"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => setShowParticipantModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Notifications list */}
            <div className="flex flex-col gap-3">
              {user?.notifications && user.notifications.length > 0 ? (
                [...user.notifications].reverse().map((notif, idx) => {
                  const realIdx = user.notifications.length - 1 - idx;
                  return (
                    <div
                      key={notif._id || idx}
                      className="border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 p-4 flex items-center justify-between gap-4 shadow-sm text-xs font-semibold"
                    >
                      <div className="flex items-center gap-3.5 flex-grow text-left">
                        {/* Green Badge Icon */}
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <CheckCheck size={14} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed font-semibold">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        {!notif.isRead ? (
                          <button
                            onClick={(e) => markAsRead(notif._id || realIdx, e)}
                            className="text-slate-400 hover:text-slate-650 dark:text-slate-400 dark:hover:text-slate-250 font-black tracking-wider text-[10px] uppercase cursor-pointer py-1 px-2.5 rounded-lg transition-all font-bold"
                          >
                            DISMISS
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-extrabold tracking-wider text-[10px] uppercase select-none px-2 font-bold">
                            READ
                          </span>
                        )}
                        <button
                          onClick={(e) => deleteNotif(notif._id || realIdx, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs italic">
                  No notifications found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
