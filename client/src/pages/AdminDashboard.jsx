import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Users,
  Camera,
  Award,
  Calendar,
  Layers,
  Search,
  Filter,
  Ban,
  Trash2,
  Check,
  X,
  Plus,
  TrendingUp,
  Download,
  AlertTriangle,
  UserCheck,
  Maximize2
} from 'lucide-react';
import StatsCharts from '../components/StatsCharts';

export default function AdminDashboard() {
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats states
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  // Participant list states
  const [participants, setParticipants] = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [partCity, setPartCity] = useState('');
  const [partSuspended, setPartSuspended] = useState('');

  // Photograph list states
  const [photographs, setPhotographs] = useState([]);
  const [photoSearch, setPhotoSearch] = useState('');
  const [photoCategory, setPhotoCategory] = useState('');
  const [photoStatus, setPhotoStatus] = useState('');

  // Judges states
  const [judges, setJudges] = useState([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgePassword, setNewJudgePassword] = useState('');
  const [newJudgeMobile, setNewJudgeMobile] = useState('');
  const [newJudgeCity, setNewJudgeCity] = useState('');
  const [showJudgeModal, setShowJudgeModal] = useState(false);

  // Events & Categories states
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  // Create Event Form states
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTheme, setNewEventTheme] = useState('');
  const [newEventDeadline, setNewEventDeadline] = useState('');
  const [newEventRules, setNewEventRules] = useState('');
  
  // Selection/Modals
  const [selectedPhoto, setSelectedPhoto] = useState(null); // zoom / detail
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [assignJudgesPhoto, setAssignJudgesPhoto] = useState(null);
  const [selectedAssignJudges, setSelectedAssignJudges] = useState([]);

  // Winner rankings states
  const [eventToPublish, setEventToPublish] = useState(null);
  const [winnerAssignments, setWinnerAssignments] = useState([
    { rank: '1st Prize', reward: '₹50,000 Cash + Gold Trophy', submissionId: '', photoId: '', userName: '', photoTitle: '', score: 0 },
    { rank: '2nd Prize', reward: '₹30,000 Cash + Silver Trophy', submissionId: '', photoId: '', userName: '', photoTitle: '', score: 0 },
    { rank: '3rd Prize', reward: '₹20,000 Cash + Bronze Trophy', submissionId: '', photoId: '', userName: '', photoTitle: '', score: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/api/admin/dashboard-stats');
      if (data.success) {
        setStats(data.stats);
        setCharts(data.charts);
      }
    } catch (e) {
      console.error(e);
      setError('Could not load overview statistics');
    }
  };

  const fetchParticipants = async () => {
    try {
      const url = `/api/admin/participants?search=${partSearch}&city=${partCity}&isSuspended=${partSuspended}`;
      const data = await apiFetch(url);
      if (data.success) {
        setParticipants(data.participants);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPhotographs = async () => {
    try {
      const url = `/api/admin/photographs?search=${photoSearch}&category=${photoCategory}&status=${photoStatus}`;
      const data = await apiFetch(url);
      if (data.success) {
        setPhotographs(data.photographs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJudgesAndEvents = async () => {
    try {
      const jData = await apiFetch('/api/admin/judges');
      if (jData.success) setJudges(jData.judges);

      const eData = await apiFetch('/api/events');
      if (eData.success) setEvents(eData.events);

      const cData = await apiFetch('/api/categories');
      if (cData.success) setCategories(cData.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchParticipants(),
      fetchPhotographs(),
      fetchJudgesAndEvents()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Watch filters
  useEffect(() => {
    fetchParticipants();
  }, [partSearch, partCity, partSuspended]);

  useEffect(() => {
    fetchPhotographs();
  }, [photoSearch, photoCategory, photoStatus]);

  // Actions
  const handleSuspendParticipant = async (id, isSuspended) => {
    try {
      const data = await apiFetch(`/api/admin/participants/${id}/suspend`, {
        method: 'PUT',
        body: JSON.stringify({ isSuspended })
      });
      if (data.success) {
        fetchParticipants();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!confirm('Are you sure you want to delete this participant? This deletes their account and all uploaded submissions permanently.')) return;
    try {
      const data = await apiFetch(`/api/admin/participants/${id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        fetchParticipants();
        fetchPhotographs();
        fetchStats();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePhotoStatusUpdate = async (submissionId, photoId, status, reason = '') => {
    try {
      const data = await apiFetch(`/api/admin/photographs/${submissionId}/${photoId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectReason: reason })
      });
      if (data.success) {
        fetchPhotographs();
        fetchStats();
        setShowRejectModal(false);
        setRejectionReason('');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateJudge = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/admin/judges', {
        method: 'POST',
        body: JSON.stringify({
          name: newJudgeName,
          email: newJudgeEmail,
          password: newJudgePassword,
          mobile: newJudgeMobile,
          city: newJudgeCity
        })
      });
      if (data.success) {
        fetchJudgesAndEvents();
        setShowJudgeModal(false);
        setNewJudgeName('');
        setNewJudgeEmail('');
        setNewJudgePassword('');
        setNewJudgeMobile('');
        setNewJudgeCity('');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAssignJudges = async () => {
    try {
      const data = await apiFetch('/api/admin/photographs/assign-judges', {
        method: 'POST',
        body: JSON.stringify({
          assignments: [
            {
              submissionId: assignJudgesPhoto.submissionId,
              photoId: assignJudgesPhoto.photoId,
              judgeIds: selectedAssignJudges
            }
          ]
        })
      });
      if (data.success) {
        fetchPhotographs();
        setAssignJudgesPhoto(null);
        setSelectedAssignJudges([]);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });
      if (data.success) {
        setNewCatName('');
        setNewCatDesc('');
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      const data = await apiFetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: newEventTitle,
          theme: newEventTheme,
          deadline: newEventDeadline,
          rules: newEventRules.split('\n').filter(r => r.trim() !== ''),
          packages: [
            { id: 'pkg-1', name: 'Starter (1 Photograph)', price: 200, maxPhotos: 1 },
            { id: 'pkg-2', name: 'Amateur (Up to 2 Photographs)', price: 300, maxPhotos: 2 },
            { id: 'pkg-3', name: 'Pro (Up to 5 Photographs)', price: 400, maxPhotos: 5 }
          ]
        })
      });
      if (data.success) {
        setNewEventTitle('');
        setNewEventTheme('');
        setNewEventDeadline('');
        setNewEventRules('');
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePublishWinners = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`/api/events/${eventToPublish._id}/publish-winners`, {
        method: 'POST',
        body: JSON.stringify({ winners: winnerAssignments })
      });
      if (data.success) {
        alert('Contest results published successfully!');
        setEventToPublish(null);
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportCSV = (reportType, eventId = '') => {
    const token = localStorage.getItem('token');
    const path = `/api/reports/${reportType}${eventId ? '/' + eventId : ''}`;
    
    // Trigger download with headers
    fetch(path, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(e => console.error(e));
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading Admin Control Panel...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-xs text-slate-400">Total operational control and performance ledger analytics</p>
        </div>
        <button
          onClick={refreshAll}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-sm transition-all"
        >
          Force Reload Ledger
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto gap-4 mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart },
          { id: 'participants', label: 'Participants', icon: Users },
          { id: 'photographs', label: 'Photographs', icon: Camera },
          { id: 'judges', label: 'Judges & Results', icon: Award },
          { id: 'events', label: 'Contests & Configuration', icon: Calendar }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 pb-3 border-b-2 font-display text-sm font-semibold transition-all px-2 whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          
          {/* Key Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, change: 'Overall Volume', color: 'text-emerald-500' },
              { label: 'Total Participants', value: stats.totalParticipants, change: `${stats.todayRegistrations} added today`, color: 'text-indigo-600' },
              { label: 'Active Entries', value: stats.totalEntries, change: 'Locked submission folders', color: 'text-amber-500' },
              { label: 'Total Photographs', value: stats.totalPhotos, change: 'High-res image assets', color: 'text-purple-500' }
            ].map((card, idx) => (
              <div key={idx} className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                <p className={`font-display font-black text-2xl sm:text-3xl ${card.color}`}>{card.value}</p>
                <span className="text-[10px] text-slate-400 font-semibold">{card.change}</span>
              </div>
            ))}
          </div>

          {/* Recharts Analytics Panel */}
          <StatsCharts 
            dailyStats={charts.dailyStats} 
            categoryStats={charts.categoryStats} 
          />

          {/* Downloadable Reports Panel */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Financial & Operational Exports</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download formatted CSV ledger books directly to local disk</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleExportCSV('participants')}
                className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Download size={14} />
                Export Participants CSV
              </button>
              <button
                onClick={() => handleExportCSV('revenue')}
                className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Download size={14} />
                Export Revenue Ledger CSV
              </button>
              <button
                onClick={() => handleExportCSV('submissions')}
                className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Download size={14} />
                Export Photos Metadata CSV
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-in fade-in duration-200">
          
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Search name, email, mobile..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={partCity}
                onChange={(e) => setPartCity(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">All Cities</option>
                {[...new Set(participants.map(p => p.city))].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={partSuspended}
                onChange={(e) => setPartSuspended(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">All Accounts</option>
                <option value="false">Active</option>
                <option value="true">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-250 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 px-4">Contact</th>
                  <th className="pb-3 px-4">Location</th>
                  <th className="pb-3 px-4 text-center">Package</th>
                  <th className="pb-3 px-4 text-center">Photos</th>
                  <th className="pb-3 px-4 text-center">Payment</th>
                  <th className="pb-3 px-4">Last Login</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {participants.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                      <span className="text-[10px] text-slate-400 block">{p.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{p.mobile}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{p.city}</td>
                    <td className="py-3.5 px-4 text-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {p.packageId === 'pkg-1' ? 'Starter' : p.packageId === 'pkg-2' ? 'Amateur' : p.packageId === 'pkg-3' ? 'Pro' : 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">{p.photosCount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        p.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                          : p.paymentStatus === 'Pending' 
                            ? 'bg-amber-50 text-amber-600' 
                            : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold">
                      {p.lastLogin ? new Date(p.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSuspendParticipant(p._id, !p.isSuspended)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            p.isSuspended 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                              : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20'
                          }`}
                          title={p.isSuspended ? 'Activate User' : 'Suspend User'}
                        >
                          <Ban size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(p._id)}
                          className="p-1.5 bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/20 rounded-lg cursor-pointer"
                          title="Delete User & Submissions"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {participants.length === 0 && (
              <div className="text-center text-slate-400 py-12">No registered participants match this filter criteria.</div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: PHOTOGRAPHS APPROVAL & ASSIGNMENT */}
      {activeTab === 'photographs' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Filters row */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={photoSearch}
                onChange={(e) => setPhotoSearch(e.target.value)}
                placeholder="Search title, participant, camera..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                value={photoStatus}
                onChange={(e) => setPhotoStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Grid layout for images approval workflow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographs.map((photo) => (
              <div 
                key={photo.photoId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative group">
                  <img 
                    src={photo.fileUrl} 
                    alt={photo.title} 
                    className="w-full aspect-video object-cover"
                  />
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-950/60 hover:bg-slate-950 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Zoom Details"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                        {photo.title}
                      </h4>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
                        {photo.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">By {photo.participantName} ({photo.participantEmail})</span>
                    
                    {/* EXIF Metadata verification list */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 mt-2.5 flex flex-col gap-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">EXIF Device Logs:</span>
                      <p>Camera: <span className="font-bold text-slate-800 dark:text-slate-200">{photo.cameraBrand} {photo.cameraModel}</span></p>
                      <p>Lens: <span className="font-semibold text-slate-700 dark:text-slate-350">{photo.lensUsed || 'N/A'}</span></p>
                      <p>Capture Date: <span className="font-semibold text-slate-700 dark:text-slate-350">{photo.dateCaptured ? new Date(photo.dateCaptured).toLocaleDateString() : 'N/A'}</span></p>
                      <p>Raw File: <span className={`font-bold ${photo.rawFileUrl ? 'text-emerald-500' : 'text-slate-400'}`}>{photo.rawFileUrl ? 'Available (.RAW)' : 'None Provided'}</span></p>
                    </div>
                  </div>

                  {/* Assignments to Judges */}
                  <div className="text-[10px] border-t border-slate-100 dark:border-slate-850 pt-2 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400 uppercase tracking-wide">Assigned Judges</span>
                      <button
                        onClick={() => {
                          setAssignJudgesPhoto(photo);
                          setSelectedAssignJudges(photo.assignedJudges);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        Change Assigns
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {photo.assignedJudges.length > 0 ? (
                        photo.assignedJudges.map(jId => {
                          const j = judges.find(u => u._id === jId);
                          return (
                            <span key={jId} className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-semibold text-[9px]">
                              {j ? j.name.split(' ')[0] : 'Judge'}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 italic">No judges assigned yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status badges */}
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Audit State</span>
                      {photo.status === 'Pending' ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">Pending</span>
                      ) : photo.status === 'Approved' ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Approved</span>
                      ) : (
                        <div>
                          <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded font-bold">Rejected</span>
                          <span className="block text-[9px] text-red-500 mt-1 line-clamp-1">"{photo.rejectReason}"</span>
                        </div>
                      )}
                    </div>

                    {photo.status === 'Pending' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handlePhotoStatusUpdate(photo.submissionId, photo.photoId, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg shadow-sm cursor-pointer"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPhoto(photo);
                            setShowRejectModal(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm cursor-pointer"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {photographs.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-12">No uploaded photographs match this query.</div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: JUDGES AND COMPETITION RESULTS */}
      {activeTab === 'judges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          
          {/* Left Column: Judges account creator & list */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Create Judge Account */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Contest Judges</h3>
                <button
                  onClick={() => setShowJudgeModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-lg cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Judges List */}
              <div className="flex flex-col gap-3 mt-4">
                {judges.map(j => (
                  <div key={j._id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-905 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{j.name}</p>
                      <span className="text-[9px] text-slate-400">{j.email}</span>
                    </div>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {j.city}
                    </span>
                  </div>
                ))}
                {judges.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No judge accounts created yet.</p>
                )}
              </div>
            </div>

            {/* Results Exporter */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800">Winner Rankings Export</h3>
              <div className="flex flex-col gap-3 mt-4">
                {events.map(e => (
                  <div key={e._id} className="flex justify-between items-center p-2 text-xs">
                    <span className="font-medium truncate max-w-37.5">{e.title}</span>
                    {e.winnersPublished ? (
                      <button
                        onClick={() => handleExportCSV('winners', e._id)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 p-1.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer text-[10px]"
                      >
                        <Download size={12} />
                        Winners CSV
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Grades Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Leaderboard / Publish results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base pb-4 border-b border-slate-100 dark:border-slate-800">
                Score Leaderboard & Results Declaration
              </h3>

              <div className="flex flex-col gap-6 mt-4">
                {/* Select contest */}
                {events.map(e => {
                  
                  // Calculate rank averages
                  const gradedPhotos = [];
                  photographs.forEach(p => {
                    if (p.scores && p.scores.length > 0) {
                      gradedPhotos.push(p);
                    }
                  });

                  // Sort graded photos by score (total or average)
                  gradedPhotos.sort((a, b) => b.averageScore - a.averageScore);

                  return (
                    <div key={e._id} className="flex flex-col gap-4 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">{e.title}</h4>
                          <span className="text-[10px] text-slate-400">Deadline: {new Date(e.deadline).toLocaleDateString()}</span>
                        </div>
                        
                        {!e.winnersPublished ? (
                          <button
                            onClick={() => {
                              setEventToPublish(e);
                              // Seed top 3 photos from leaderboard
                              const updatedWinners = [...winnerAssignments];
                              for (let idx = 0; idx < 3; idx++) {
                                if (gradedPhotos[idx]) {
                                  updatedWinners[idx].submissionId = gradedPhotos[idx].submissionId;
                                  updatedWinners[idx].photoId = gradedPhotos[idx].photoId;
                                  updatedWinners[idx].userName = gradedPhotos[idx].participantName;
                                  updatedWinners[idx].photoTitle = gradedPhotos[idx].title;
                                  updatedWinners[idx].score = gradedPhotos[idx].averageScore;
                                }
                              }
                              setWinnerAssignments(updatedWinners);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-xl cursor-pointer"
                          >
                            Assign Winners & Publish
                          </button>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded font-bold">Results Published</span>
                        )}
                      </div>

                      {/* Display Top 3 Leaderboard */}
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Top Rated Photos (Panel Leaderboard)</span>
                        {gradedPhotos.slice(0, 5).map((photo, index) => (
                          <div key={photo.photoId} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600">#{index + 1}</span>
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{photo.title}</span>
                                <p className="text-[9px] text-slate-400">By {photo.participantName} • {photo.cameraModel}</p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Avg: {photo.averageScore}/10
                            </span>
                          </div>
                        ))}
                        {gradedPhotos.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No score reviews submitted by judges yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 5: CONTESTS AND CONFIGURATIONS */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          
          {/* Left Column: Create new contest & details list */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Create Contest Form */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                Setup New Photography Contest
              </h3>
              
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Contest Title</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Monsoon Magic 2026"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Theme</label>
                    <input
                      type="text"
                      value={newEventTheme}
                      onChange={(e) => setNewEventTheme(e.target.value)}
                      placeholder="e.g. Rain and Shadows"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Submission Deadline</label>
                    <input
                      type="date"
                      value={newEventDeadline}
                      onChange={(e) => setNewEventDeadline(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-semibold">Rules & Regulations (One per line)</label>
                  <textarea
                    value={newEventRules}
                    onChange={(e) => setNewEventRules(e.target.value)}
                    placeholder="e.g. Only DSLR/Mirrorless RAW checks...&#10;Photos must contain EXIF metadata..."
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-24"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl self-start cursor-pointer shadow"
                >
                  Publish New Event
                </button>
              </form>
            </div>

            {/* List of events */}
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Active & Draft Contests</h3>
              <div className="flex flex-col gap-3">
                {events.map(e => (
                  <div key={e._id} className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">{e.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Theme: "{e.theme}" • Deadline: {new Date(e.deadline).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${e.status === 'Active' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' : 'bg-slate-100 text-slate-500'}`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Categories Manager */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                Categories Configuration
              </h3>

              {/* Create Category Form */}
              <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 mt-4">
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="font-semibold text-slate-500">Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Wildlife"
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="font-semibold text-slate-500">Description</label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 rounded-lg cursor-pointer"
                >
                  Create Category
                </button>
              </form>

              {/* Categories list */}
              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                {categories.map(c => (
                  <div key={c._id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="font-bold">{c.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* CREATE JUDGE MODAL */}
      {showJudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-lg pb-3 border-b border-slate-150 text-slate-900 dark:text-white">Create Judge Account</h3>
            
            <form onSubmit={handleCreateJudge} className="flex flex-col gap-4 mt-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500">Judge Name</label>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  placeholder="e.g. Judge Arthur"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500">Email</label>
                <input
                  type="email"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  placeholder="judge@contest.com"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500">Mobile</label>
                <input
                  type="text"
                  value={newJudgeMobile}
                  onChange={(e) => setNewJudgeMobile(e.target.value)}
                  placeholder="9876543210"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500">Password</label>
                <input
                  type="password"
                  value={newJudgePassword}
                  onChange={(e) => setNewJudgePassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500">City</label>
                <input
                  type="text"
                  value={newJudgeCity}
                  onChange={(e) => setNewJudgeCity(e.target.value)}
                  placeholder="Mumbai"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJudgeModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl shadow transition-all cursor-pointer font-bold"
                >
                  Register Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-lg pb-3 border-b border-slate-150 text-slate-900 dark:text-white">Reject Photograph Entry</h3>
            
            <div className="flex flex-col gap-4 mt-4 text-xs">
              <p className="text-slate-400">Please provide a constructive audit reason explaining why this photograph is being disqualified:</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Detected smartphone capture metadata. Non-DSLR captures are prohibited."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-24 focus:outline-none focus:border-red-500"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePhotoStatusUpdate(selectedPhoto.submissionId, selectedPhoto.photoId, 'Rejected', rejectionReason)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl shadow transition-all cursor-pointer font-bold"
                >
                  Submit Disqualification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN JUDGES MODAL */}
      {assignJudgesPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-lg pb-3 border-b border-slate-150 text-slate-900 dark:text-white">Assign Judges to Photograph</h3>
            
            <div className="flex flex-col gap-4 mt-4 text-xs">
              <p className="text-slate-400">Select which judging panel members will review and score this photograph:</p>
              
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {judges.map(j => {
                  const isChecked = selectedAssignJudges.includes(j._id);
                  return (
                    <label key={j._id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignJudges([...selectedAssignJudges, j._id]);
                          } else {
                            setSelectedAssignJudges(selectedAssignJudges.filter(id => id !== j._id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{j.name}</span>
                        <span className="text-[10px] text-slate-400 block">{j.email}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAssignJudgesPhoto(null);
                    setSelectedAssignJudges([]);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignJudges}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl shadow transition-all cursor-pointer font-bold"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL / ZOOM VIEW MODAL */}
      {selectedPhoto && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 bg-slate-950 flex items-center justify-center min-h-75 max-h-125">
                <img 
                  src={selectedPhoto.fileUrl} 
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="lg:col-span-4 p-6 flex flex-col justify-between text-xs max-h-125 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">{selectedPhoto.title}</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded font-bold text-[9px] inline-block mt-1">
                      {selectedPhoto.category}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Owner</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-250">{selectedPhoto.participantName}</p>
                    <p className="text-[10px] text-slate-400">{selectedPhoto.participantEmail}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Story Details</span>
                    <p className="text-slate-500 leading-relaxed mt-0.5">{selectedPhoto.description || 'No description shared.'}</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">EXIF Device Info</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div>
                        <span>Brand:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.cameraBrand}</p>
                      </div>
                      <div>
                        <span>Model:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.cameraModel}</p>
                      </div>
                      <div>
                        <span>Lens:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250 truncate">{selectedPhoto.lensUsed || 'N/A'}</p>
                      </div>
                      <div>
                        <span>Capture Date:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.dateCaptured ? new Date(selectedPhoto.dateCaptured).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded font-bold uppercase text-slate-500">
                    {selectedPhoto.status}
                  </span>
                  
                  {selectedPhoto.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handlePhotoStatusUpdate(selectedPhoto.submissionId, selectedPhoto.photoId, 'Approved');
                          setSelectedPhoto(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectModal(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WINNER ASSIGNMENTS MODAL */}
      {eventToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-lg pb-3 border-b border-slate-150 text-slate-900 dark:text-white">Publish Winner Rankings</h3>
            
            <form onSubmit={handlePublishWinners} className="flex flex-col gap-4 mt-4 text-xs">
              <p className="text-slate-400">Map top judged entries to their respective rewards. This will close the contest registrations and declare scores publicly:</p>
              
              <div className="flex flex-col gap-4">
                {winnerAssignments.map((win, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="font-bold text-indigo-600 uppercase tracking-wide">{win.rank} ({win.reward})</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Select Photo Entry</label>
                        <select
                          value={`${win.submissionId}:${win.photoId}`}
                          onChange={(e) => {
                            const [subId, photoId] = e.target.value.split(':');
                            const photo = photographs.find(p => p.photoId === photoId);
                            const updated = [...winnerAssignments];
                            updated[idx].submissionId = subId;
                            updated[idx].photoId = photoId;
                            updated[idx].userName = photo ? photo.participantName : '';
                            updated[idx].photoTitle = photo ? photo.title : '';
                            updated[idx].score = photo ? photo.averageScore : 0;
                            setWinnerAssignments(updated);
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          required
                        >
                          <option value="">-- Choose Photograph --</option>
                          {photographs
                            .filter(p => p.status === 'Approved' && p.scores?.length > 0)
                            .map(p => (
                              <option key={p.photoId} value={`${p.submissionId}:${p.photoId}`}>
                                {p.title} - By {p.participantName} (Avg: {p.averageScore})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className="flex flex-col justify-end text-[11px] font-semibold text-slate-700 dark:text-slate-200 p-2">
                        <p>Recipient: {win.userName || 'N/A'}</p>
                        <p className="mt-1">Average Grade: {win.score}/10</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setEventToPublish(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl shadow transition-all cursor-pointer font-bold"
                >
                  Publish Winners & End Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
