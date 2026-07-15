import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Camera, Sun, Moon, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/login" className="flex items-center gap-2 group">
              <div className="p-2 bg-indigo-600 rounded-xl text-white group-hover:scale-105 transition-transform">
                <Camera size={20} />
              </div>
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Sumba<span className="text-indigo-600 dark:text-indigo-400">Contest</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
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
              Gallery
            </Link>

            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors ${
                isActive('/admin') 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Admin Portal
            </Link>

            <Link
              to="/judge"
              className={`text-sm font-medium transition-colors ${
                isActive('/judge') 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Judges Portal
            </Link>
            
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
                My Entries
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
                Judge Scoring
              </Link>
            )}

            {/* Divider */}
            <span className="h-5 w-px bg-slate-200 dark:bg-slate-800"></span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg transition-colors"
                >
                  <User size={16} />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
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
                  className="text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
              Gallery
            </Link>

            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/admin') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Admin Portal
            </Link>

            <Link
              to="/judge"
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/judge') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Judges Portal
            </Link>

            {user && user.role === 'Participant' && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/dashboard') ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                My Entries
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
                Judge Scoring
              </Link>
            )}

            <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800">
              {user ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <User size={18} />
                    Profile ({user.name})
                  </Link>
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
