import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, ShieldAlert, Award, Star, Star as StarIcon, CheckCircle2, ChevronRight, X, Check, AlertTriangle, Clock, XCircle, ListChecks, Layers, BarChart2 } from 'lucide-react';
import WatermarkPreview from '../components/WatermarkPreview';

export default function JudgeDashboard() {
  const { apiFetch, user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [photographs, setPhotographs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Grading Form State
  const [activePhoto, setActivePhoto] = useState(null);
  const [offlineZoomPhoto, setOfflineZoomPhoto] = useState(null);
  const [creativity, setCreativity] = useState(5);
  const [composition, setComposition] = useState(5);
  const [technicalQuality, setTechnicalQuality] = useState(5);
  const [storytelling, setStorytelling] = useState(5);
  const [overallImpact, setOverallImpact] = useState(5);
  const [remarks, setRemarks] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('Approved');

  const [selectedSubmissionId, setSelectedSubmissionId] = useState('all');
  const [evaluationMode, setEvaluationMode] = useState('online'); // 'online' or 'offline'
  const [offlineScores, setOfflineScores] = useState({});
  const [judgeDashboardTab, setJudgeDashboardTab] = useState('overview');
  const [allPhotographsByEvent, setAllPhotographsByEvent] = useState({});

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showSignOffModal, setShowSignOffModal] = useState(false);

  const triggerSuccess = (title, message) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const fetchJudgeData = async () => {
    try {
      const eventData = await apiFetch('/api/events');
      if (eventData.success && eventData.events.length > 0) {
        const assigned = user?.role === 'Admin' 
          ? eventData.events 
          : eventData.events.filter(e => e.assignedJudges && e.assignedJudges.includes(user?.id));
        setEvents(assigned);
        
        if (assigned.length > 0) {
          const active = assigned.find(e => e.status === 'Active') || assigned[0];
          setEvent(active);
          
          // Fetch assigned photos for this active event
          const photoData = await apiFetch(`/api/judges/assigned-photos/${active._id}`);
          if (photoData.success) {
            setPhotographs(photoData.photographs);
            setSelectedSubmissionId('all');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not load assigned photographs');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = async (eId) => {
    const selected = events.find(e => e._id === eId);
    if (!selected) return;
    setEvent(selected);
    setLoading(true);
    setActivePhoto(null);
    try {
      const photoData = await apiFetch(`/api/judges/assigned-photos/${selected._id}`);
      if (photoData.success) {
        setPhotographs(photoData.photographs);
        setSelectedSubmissionId('all');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load photographs for this event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchJudgeData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (photographs.length > 0) {
      const initial = {};
      photographs.forEach(p => {
        const val = p.score ? Math.round(p.score.averageScore) : 5;
        initial[p.photoId] = {
          creativity: val,
          composition: val,
          technicalQuality: val,
          storytelling: val,
          overallImpact: val,
          remarks: p.score?.remarks ?? '',
          approvalStatus: p.score?.approvalStatus ?? 'Approved'
        };
      });
      setOfflineScores(initial);
    }
  }, [photographs]);

  const handleOfflineScoreChange = (photoId, field, value) => {
    setOfflineScores(prev => ({
      ...prev,
      [photoId]: {
        ...prev[photoId],
        [field]: value
      }
    }));
  };

  const handleSaveSingleOfflineScore = async (photo) => {
    if (user?.role === 'Admin') return;
    setLoading(true);
    setError('');
    const scores = offlineScores[photo.photoId] || {
      creativity: photo.score?.creativity || 5,
      composition: photo.score?.composition || 5,
      technicalQuality: photo.score?.technicalQuality || 5,
      storytelling: photo.score?.storytelling || 5,
      overallImpact: photo.score?.overallImpact || 5,
      remarks: photo.score?.remarks || '',
      approvalStatus: photo.score?.approvalStatus || 'Approved'
    };
    if (scores.approvalStatus === 'Disapproved' && (!scores.remarks || scores.remarks.trim() === '')) {
      setError(`An explanation/remarks is required for the disapproved photograph: "${photo.title}".`);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/judges/score', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: photo.submissionId,
          photoId: photo.photoId,
          creativity: Math.min(10, Math.max(1, Number(scores.creativity) || 5)),
          composition: Math.min(10, Math.max(1, Number(scores.composition) || 5)),
          technicalQuality: Math.min(10, Math.max(1, Number(scores.technicalQuality) || 5)),
          storytelling: Math.min(10, Math.max(1, Number(scores.storytelling) || 5)),
          overallImpact: Math.min(10, Math.max(1, Number(scores.overallImpact) || 5)),
          remarks: scores.remarks || '',
          approvalStatus: scores.approvalStatus || 'Approved'
        })
      });
      if (data.success) {
        const photoData = await apiFetch(`/api/judges/assigned-photos/${event._id}`);
        if (photoData.success) {
          setPhotographs(photoData.photographs);
        }
        triggerSuccess('Score Saved', `Offline grades for "${photo.title}" saved successfully.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllOfflineScores = async () => {
    if (user?.role === 'Admin') return;
    
    // Check if any disapproved entry is missing remarks
    for (const photo of photographs) {
      const scores = offlineScores[photo.photoId] || {
        creativity: 5,
        composition: 5,
        technicalQuality: 5,
        storytelling: 5,
        overallImpact: 5,
        remarks: '',
        approvalStatus: 'Approved'
      };
      if (scores.approvalStatus === 'Disapproved' && (!scores.remarks || scores.remarks.trim() === '')) {
        setError(`An explanation/remarks is required for the disapproved photograph: "${photo.title}".`);
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      const promises = photographs.map(photo => {
        const scores = offlineScores[photo.photoId] || {
          creativity: 5,
          composition: 5,
          technicalQuality: 5,
          storytelling: 5,
          overallImpact: 5,
          remarks: '',
          approvalStatus: 'Approved'
        };
        return apiFetch('/api/judges/score', {
          method: 'POST',
          body: JSON.stringify({
            submissionId: photo.submissionId,
            photoId: photo.photoId,
            creativity: Math.min(10, Math.max(1, Number(scores.creativity) || 5)),
            composition: Math.min(10, Math.max(1, Number(scores.composition) || 5)),
            technicalQuality: Math.min(10, Math.max(1, Number(scores.technicalQuality) || 5)),
            storytelling: Math.min(10, Math.max(1, Number(scores.storytelling) || 5)),
            overallImpact: Math.min(10, Math.max(1, Number(scores.overallImpact) || 5)),
            remarks: scores.remarks || '',
            approvalStatus: scores.approvalStatus || 'Approved'
          })
        });
      });
      await Promise.all(promises);
      
      const photoData = await apiFetch(`/api/judges/assigned-photos/${event._id}`);
      if (photoData.success) {
        setPhotographs(photoData.photographs);
      }
      triggerSuccess('All Scores Saved', 'All offline evaluations have been saved and submitted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScoring = (photo) => {
    setActivePhoto(photo);
    if (photo.score) {
      setCreativity(photo.score.creativity);
      setComposition(photo.score.composition);
      setTechnicalQuality(photo.score.technicalQuality);
      setStorytelling(photo.score.storytelling);
      setOverallImpact(photo.score.overallImpact);
      setRemarks(photo.score.remarks || '');
      setApprovalStatus(photo.score.approvalStatus || 'Approved');
    } else {
      setCreativity(5);
      setComposition(5);
      setTechnicalQuality(5);
      setStorytelling(5);
      setOverallImpact(5);
      setRemarks('');
      setApprovalStatus('Approved');
    }
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (approvalStatus === 'Disapproved' && (!remarks || remarks.trim() === '')) {
      setError('An explanation/remarks is required when disapproving an entry.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/judges/score', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: activePhoto.submissionId,
          photoId: activePhoto.photoId,
          creativity,
          composition,
          technicalQuality,
          storytelling,
          overallImpact,
          remarks,
          approvalStatus
        })
      });

      if (data.success) {
        // Refresh photo list
        const photoData = await apiFetch(`/api/judges/assigned-photos/${event._id}`);
        if (photoData.success) {
          setPhotographs(photoData.photographs);
        }
        setActivePhoto(null);
        triggerSuccess('Review Submitted', 'The photograph score evaluations and remarks have been saved successfully.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGrading = () => {
    if (!event) return;
    setShowSignOffModal(true);
  };

  const executeConfirmGrading = async () => {
    setShowSignOffModal(false);
    setLoading(true);
    try {
      const data = await apiFetch(`/api/events/${event._id}/confirm-grading`, {
        method: 'POST'
      });
      if (data.success) {
        setEvent(data.event);
        setEvents(events.map(e => e._id === data.event._id ? data.event : e));
        triggerSuccess('Grading Signed Off', 'You have successfully finalized and signed off on your evaluations for this event.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit grading sign-off");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic calculations
  const isFormDisapproved = approvalStatus === 'Disapproved';
  const totalScore = isFormDisapproved ? 0 : (creativity + composition + technicalQuality + storytelling + overallImpact);
  const averageScore = isFormDisapproved ? '0.0' : ((creativity + composition + technicalQuality + storytelling + overallImpact) / 5).toFixed(1);
  const allGraded = photographs.length > 0 && photographs.every(p => p.graded);
  const hasConfirmed = event?.confirmedJudges?.includes(user?.id);

  const participants = [];
  const seenSubmissions = new Set();
  photographs.forEach(p => {
    if (!seenSubmissions.has(p.submissionId)) {
      seenSubmissions.add(p.submissionId);
      participants.push({
        submissionId: p.submissionId,
        name: p.participantName
      });
    }
  });

  const displayedPhotos = selectedSubmissionId === 'all'
    ? photographs
    : photographs.filter(p => p.submissionId === selectedSubmissionId);

  if (loading && photographs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading assigned entries...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-200">
      
      {user?.role === 'Admin' && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-6 text-xs font-semibold">
          <ShieldAlert size={18} className="shrink-0" />
          <span>Viewing in Admin Mode (Read-Only). You can review judge evaluations but cannot modify scores or sign off.</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-4 rounded-2xl text-sm text-red-600 dark:text-red-400 mb-6">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 justify-center sm:justify-start">
        <button
          onClick={() => setJudgeDashboardTab("overview")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            judgeDashboardTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setJudgeDashboardTab("portal")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            judgeDashboardTab === "portal"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Evaluation Portal Workspace
        </button>
      </div>

      {judgeDashboardTab === "overview" && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          {/* Welcome header */}
          <div className="bg-gradient-to-r from-indigo-900/10 via-indigo-950/5 to-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest">
                Jury Panel Dashboard
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Welcome back, Judge {user?.name || "Jury Member"}!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review assigned DSLR uploads, grade photography composition benchmarks, and submit final signed-off scores.
              </p>
            </div>
            <div className="flex gap-2 self-start md:self-center">
              <button
                onClick={() => setJudgeDashboardTab("portal")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Camera size={14} /> Open Evaluation Portal
              </button>
            </div>
          </div>

          {/* Stats Widgets */}
          {(() => {
            const totalEvents = events.length;
            const allPhotos = Object.values(allPhotographsByEvent).reduce((acc, arr) => [...acc, ...(arr || [])], []);
            const totalPhotos = allPhotos.length;
            const gradedCount = allPhotos.filter(p => p.graded).length;
            const pendingCount = totalPhotos - gradedCount;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Assigned Contests</span>
                    <h3 className="font-display font-extrabold text-2xl text-indigo-600 dark:text-indigo-400">{totalEvents}</h3>
                    <span className="text-[10px] text-slate-400">Total events panel seat</span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Assigned Photographs</span>
                    <h3 className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">{totalPhotos}</h3>
                    <span className="text-[10px] text-slate-400">Assigned photo frames</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Graded Photos</span>
                    <h3 className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">{gradedCount}</h3>
                    <span className="text-[10px] text-slate-400">Completed assessments</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Ungraded Photos</span>
                    <h3 className="font-display font-extrabold text-2xl text-red-600 dark:text-red-400">{pendingCount}</h3>
                    <span className="text-[10px] text-slate-400">Assessments remaining</span>
                  </div>
                </div>

                {/* SVG Progress charts */}
                {totalPhotos > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Donut Progress chart */}
                    {(() => {
                      const gradedPct = totalPhotos ? (gradedCount / totalPhotos) : 0;
                      const radius = 50;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (circumference * gradedPct);

                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm">
                          <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Grading Completion Progress</h3>
                          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                            <div className="relative w-32 h-32">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                                <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="12" />
                                <circle
                                  cx="70"
                                  cy="70"
                                  r={radius}
                                  fill="transparent"
                                  stroke="#4f46e5"
                                  strokeWidth="12"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-display font-black text-2xl text-slate-900 dark:text-white">
                                  {Math.round(gradedPct * 100)}%
                                </span>
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase">Done</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-500 dark:text-slate-400">Graded: <strong className="text-slate-900 dark:text-white">{gradedCount}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                                <span className="font-semibold text-slate-500 dark:text-slate-400">Ungraded: <strong className="text-slate-900 dark:text-white">{pendingCount}</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Category Distribution Bar Chart */}
                    {(() => {
                      const categoriesMap = {};
                      allPhotos.forEach(p => {
                        const cat = p.category || 'Other';
                        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
                      });
                      const catData = Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
                      const maxCount = Math.max(...catData.map(c => c.count), 1);

                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm">
                          <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Assigned Categories Distribution</h3>
                          <div className="flex flex-col gap-3 py-1">
                            {catData.map(({ name, count }) => {
                              const widthPct = (count / maxCount) * 100;
                              return (
                                <div key={name} className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                                    <span className="text-slate-500">{count} {count === 1 ? 'photo' : 'photos'}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${widthPct}%` }}
                                      className="bg-amber-600 h-full rounded-full transition-all duration-1000 ease-out"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* Approved/Disapproved list by event, and history */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  
                  {/* Event wise approvals / disapproval tracking */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Events Breakdown Tracking</h3>
                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[350px] pr-2">
                      {events.map((e, idx) => {
                        const eventPhotos = allPhotographsByEvent[e._id] || [];
                        const total = eventPhotos.length;
                        const approved = eventPhotos.filter(p => p.score && p.score.approvalStatus === 'Approved').length;
                        const disapproved = eventPhotos.filter(p => p.score && p.score.approvalStatus === 'Disapproved').length;
                        const evaluated = eventPhotos.filter(p => p.graded).length;

                        return (
                          <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-2.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-900 dark:text-white">{e.title}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                                evaluated === total && total > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {evaluated} / {total} Graded
                              </span>
                            </div>
                            
                            {/* Visual Progress bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${total ? (evaluated / total) * 100 : 0}%` }}
                                className="bg-indigo-600 h-full rounded-full"
                              />
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                              <span>Approved: <strong className="text-emerald-600 dark:text-emerald-400">{approved}</strong></span>
                              <span>Disapproved: <strong className="text-red-600 dark:text-red-400">{disapproved}</strong></span>
                              <span>Pending: <strong className="text-slate-600 dark:text-slate-300">{total - evaluated}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side: Evaluation history timeline */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Past Evaluation History Log</h3>
                    
                    {(() => {
                      const historyList = [];
                      events.forEach(e => {
                        const eventPhotos = allPhotographsByEvent[e._id] || [];
                        eventPhotos.forEach(p => {
                          if (p.graded && p.score) {
                            historyList.push({
                              ...p,
                              eventTitle: e.title
                            });
                          }
                        });
                      });

                      // Sort by grading update date
                      historyList.sort((a, b) => new Date(b.score.updatedAt || b.score.createdAt) - new Date(a.score.updatedAt || a.score.createdAt));

                      if (historyList.length === 0) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs min-h-[220px]">
                            <span>No graded photographs found. Get started in the workspace tab!</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[350px] pr-2 pl-4 border-l border-slate-100 dark:border-slate-800">
                          {historyList.map((item, idx) => (
                            <div key={idx} className="relative flex flex-col gap-1.5 text-xs text-left">
                              <span className="absolute -left-[22px] top-1 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500" />
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {new Date(item.score.updatedAt || item.score.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                  {item.title}
                                </h4>
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  item.score.approvalStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {item.score.approvalStatus}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-none">
                                Event: {item.eventTitle} | Average: <strong className="text-indigo-600 dark:text-indigo-400">{item.score.averageScore}</strong>
                              </p>
                              {item.score.remarks && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 leading-relaxed mt-1">
                                  "${item.score.remarks}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </>
            );
          })()}
        </div>
      )}

      {judgeDashboardTab === "portal" && (
        <>
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Judge Evaluation Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Evaluating submissions assigned to your profile
              </p>
            </div>

            {events.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Contest:</span>
                  <select
                    value={event?._id || ''}
                    onChange={(e) => handleEventChange(e.target.value)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {events.map(e => (
                      <option key={e._id} value={e._id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                {participants.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Participant:</span>
                    <select
                      value={selectedSubmissionId}
                      onChange={(e) => setSelectedSubmissionId(e.target.value)}
                      className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Participants ({participants.length})</option>
                      {participants.map(p => (
                        <option key={p.submissionId} value={p.submissionId}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {events.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Award size={48} className="text-indigo-600 dark:text-indigo-400 mb-2 animate-bounce" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">No Assigned Contests</h2>
              <p className="text-xs max-w-sm text-slate-500 font-medium leading-relaxed">
                You are not currently assigned as a panel judge for any active events. Once the administrator assigns you to an event, you will see the photographs here for grading.
              </p>
            </div>
          ) : (
            <>
              {/* Evaluation Mode Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 bg-slate-100 dark:bg-slate-900/40 p-1 rounded-2xl w-fit">
                <button
                  onClick={() => setEvaluationMode('online')}
                  className={`py-2 px-5 font-display font-bold text-xs uppercase tracking-wider cursor-pointer rounded-xl transition-all ${
                    evaluationMode === 'online'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Online Evaluation
                </button>
                <button
                  onClick={() => setEvaluationMode('offline')}
                  className={`py-2 px-5 font-display font-bold text-xs uppercase tracking-wider cursor-pointer rounded-xl transition-all ${
                    evaluationMode === 'offline'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Offline Evaluation
                </button>
              </div>

              {/* Status Header Bar */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left shadow-sm">
                <div>
                  <h2 className="font-display font-black text-lg text-slate-900 dark:text-white">
                    {event?.title}
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                    Mode: {event?.scoringType} Scoring | Category limits: {event?.photoLimit} photo slots
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Grading Progress:</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-bold">
                      {photographs.filter(p => p.graded).length} / {photographs.length}
                    </span>
                  </div>

                  {user?.role !== 'Admin' && (
                    hasConfirmed ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200/50 py-2.5 px-5 rounded-2xl text-xs font-extrabold uppercase flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Signed Off
                      </span>
                    ) : allGraded ? (
                      <button
                        onClick={handleConfirmGrading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs shadow-md hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Award size={14} /> Sign Off Event
                      </button>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 py-2.5 px-5 rounded-2xl text-xs font-bold uppercase flex items-center gap-1.5">
                        <Clock size={14} /> Finish Grading to Sign Off
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Display Photos Grid */}
              {displayedPhotos.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                  No submissions match filter criteria.
                </div>
              ) : (
                evaluationMode === 'online' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 text-left">
                    {displayedPhotos.map((photo) => (
                      <div
                        key={photo.photoId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow transition-all flex flex-col justify-between"
                      >
                        <div className="w-full h-48 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                          <WatermarkPreview
                            src={photo.fileUrl}
                            className="w-full h-full object-contain"
                          />
                          <span className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full shadow-sm ${
                            photo.graded ? 'bg-indigo-600 text-white' : 'bg-slate-500 text-white'
                          }`}>
                            {photo.graded ? 'Graded' : 'Not Graded'}
                          </span>
                        </div>

                        <div className="p-4 flex flex-col gap-3.5 flex-grow justify-between">
                          <div className="flex flex-col gap-1">
                            <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white truncate font-black">
                              {photo.title}
                            </h4>
                            <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider block">
                              {photo.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block">
                              By: {photo.participantName}
                            </span>
                            {photo.score && (
                              <div className="mt-2 flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  photo.score.approvalStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {photo.score.approvalStatus}
                                </span>
                                {photo.score.approvalStatus !== 'Disapproved' && (
                                  <span className="text-xs font-black text-slate-900 dark:text-white ml-1 font-bold">
                                    Grade: {photo.score.averageScore}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenScoring(photo)}
                            className={`w-full font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                              user?.role === 'Admin' 
                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200' 
                                : !photo.graded 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : photo.score?.approvalStatus === 'Disapproved'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {user?.role === 'Admin' ? 'Review Scoring' : photo.graded ? 'Edit Evaluation' : 'Evaluate'}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Offline Score sheets */
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-bold">
                            <th className="px-5 py-4 w-28">Preview</th>
                            <th className="px-5 py-4 w-40">Photo details</th>
                            <th className="px-5 py-4">Creativity</th>
                            <th className="px-5 py-4">Comp</th>
                            <th className="px-5 py-4">Tech</th>
                            <th className="px-5 py-4">Story</th>
                            <th className="px-5 py-4">Impact</th>
                            <th className="px-5 py-4 w-40">Status & Remarks</th>
                            <th className="px-5 py-4 text-center font-bold">Save</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {displayedPhotos.map((photo) => {
                            const scores = offlineScores[photo.photoId] || {
                              creativity: 5,
                              composition: 5,
                              technicalQuality: 5,
                              storytelling: 5,
                              overallImpact: 5,
                              remarks: '',
                              approvalStatus: 'Approved'
                            };

                            const isSuspendedUser = user?.isSuspended || user?.role === 'Admin';
                            const isDisapproved = scores.approvalStatus === 'Disapproved';

                            return (
                              <tr key={photo.photoId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                <td className="px-5 py-4">
                                  <div
                                    onClick={() => setOfflineZoomPhoto(photo)}
                                    className="w-20 h-14 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center cursor-zoom-in relative border border-slate-100 dark:border-slate-800"
                                  >
                                    <WatermarkPreview src={photo.fileUrl} className="w-full h-full object-cover" />
                                  </div>
                                </td>
                                <td className="px-5 py-4 flex flex-col gap-0.5 justify-center h-20 min-w-[150px]">
                                  <span className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{photo.title}</span>
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{photo.category}</span>
                                  <span className="text-[9px] text-indigo-500 font-semibold">{photo.participantName}</span>
                                </td>
                                {/* Creativity */}
                                <td className="px-5 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    disabled={isSuspendedUser || isDisapproved}
                                    value={isDisapproved ? 0 : scores.creativity}
                                    onChange={(e) => handleOfflineScoreChange(photo.photoId, 'creativity', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-12 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                  />
                                </td>
                                {/* Composition */}
                                <td className="px-5 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    disabled={isSuspendedUser || isDisapproved}
                                    value={isDisapproved ? 0 : scores.composition}
                                    onChange={(e) => handleOfflineScoreChange(photo.photoId, 'composition', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-12 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                  />
                                </td>
                                {/* Tech Quality */}
                                <td className="px-5 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    disabled={isSuspendedUser || isDisapproved}
                                    value={isDisapproved ? 0 : scores.technicalQuality}
                                    onChange={(e) => handleOfflineScoreChange(photo.photoId, 'technicalQuality', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-12 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                  />
                                </td>
                                {/* Storytelling */}
                                <td className="px-5 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    disabled={isSuspendedUser || isDisapproved}
                                    value={isDisapproved ? 0 : scores.storytelling}
                                    onChange={(e) => handleOfflineScoreChange(photo.photoId, 'storytelling', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-12 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                  />
                                </td>
                                {/* Overall Impact */}
                                <td className="px-5 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    disabled={isSuspendedUser || isDisapproved}
                                    value={isDisapproved ? 0 : scores.overallImpact}
                                    onChange={(e) => handleOfflineScoreChange(photo.photoId, 'overallImpact', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-12 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                  />
                                </td>
                                {/* Status & Remarks */}
                                <td className="px-5 py-4 min-w-[200px]">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden w-fit">
                                      <button
                                        type="button"
                                        disabled={user?.role !== 'Judge' || user?.isSuspended}
                                        onClick={() => handleOfflineScoreChange(photo.photoId, 'approvalStatus', 'Approved')}
                                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                                          !isDisapproved ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        disabled={user?.role !== 'Judge' || user?.isSuspended}
                                        onClick={() => handleOfflineScoreChange(photo.photoId, 'approvalStatus', 'Disapproved')}
                                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                                          isDisapproved ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                    <textarea
                                      disabled={isSuspendedUser}
                                      value={scores.remarks}
                                      onChange={(e) => handleOfflineScoreChange(photo.photoId, 'remarks', e.target.value)}
                                      placeholder={isDisapproved ? "Explanation required *" : "Remarks (Optional)..."}
                                      className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-[11px] leading-relaxed resize-none h-12 w-full ${
                                        isDisapproved && (!scores.remarks || scores.remarks.trim() === '') ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'
                                      }`}
                                    />
                                  </div>
                                </td>
                                {/* Actions */}
                                <td className="px-5 py-4 text-center">
                                  <button
                                    type="button"
                                    disabled={isSuspendedUser || loading}
                                    onClick={() => handleSaveSingleOfflineScore(photo)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Save scoring sheet for this row"
                                  >
                                    <Check size={14} strokeWidth={2.5} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Offline batch triggers */}
                    {user?.role !== 'Admin' && (
                      <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-5 flex justify-end gap-3 font-bold">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleSaveAllOfflineScores}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          {loading ? 'Submitting evaluations...' : 'Save All Scoring Sheets'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </>
      )}

      {/* Online Evaluation Grade Sheet / Modal popup */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 text-left my-8 h-[90vh]">
            
            {/* Left Column: Watermarked Zoom Preview */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col justify-between border-r border-slate-100 dark:border-slate-800">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-slate-900/80 backdrop-blur text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                  Online Zoom Mode
                </span>
                <span className={`bg-slate-900/85 backdrop-blur text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                  activePhoto.graded ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {activePhoto.graded ? 'Assessment Completed' : 'Pending Review'}
                </span>
              </div>

              <div className="flex-grow flex items-center justify-center p-4 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center group cursor-zoom-in">
                  <WatermarkPreview
                    src={activePhoto.fileUrl}
                    className="w-full h-full max-h-[68vh] object-contain rounded-lg shadow-lg"
                    enableZoom={true}
                  />
                </div>
              </div>

              {/* Photo parameters / EXIF overlay at bottom */}
              <div className="bg-slate-900/90 backdrop-blur border-t border-white/5 p-4 sm:p-5 flex flex-col gap-3 text-white">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-display font-extrabold text-sm tracking-wide">{activePhoto.title}</h3>
                    <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">{activePhoto.category}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase shrink-0">
                    By: {activePhoto.participantName}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-[10px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Camera brand</span>
                    <span className="font-extrabold truncate">{activePhoto.cameraBrand || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Camera model</span>
                    <span className="font-extrabold truncate">{activePhoto.cameraModel || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Lens configuration</span>
                    <span className="font-semibold truncate">{activePhoto.lensUsed || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold">Date captured</span>
                    <span className="font-semibold text-slate-300">
                      {activePhoto.dateCaptured ? new Date(activePhoto.dateCaptured).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Photo Description Box at bottom */}
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-[10px] flex flex-col gap-1">
                  <span className="text-slate-500 uppercase text-[8px] font-bold">Photo Description</span>
                  <p className="text-slate-300 leading-relaxed max-h-[60px] overflow-y-auto pr-1">
                    {activePhoto.description || 'No description shared.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Scoring parameters sheet */}
            <div className="w-full md:w-[380px] bg-white dark:bg-slate-900 flex flex-col justify-between overflow-y-auto">
              
              {/* Grading Form header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Scoring Assessment</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">DSLR verification checklist</span>
                </div>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Assessment inputs */}
              <form onSubmit={handleScoreSubmit} className="p-6 flex-grow flex flex-col gap-5 text-xs">
                
                {/* ApprovalStatus switcher */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Evaluation Status</label>
                  <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      disabled={user?.role !== 'Judge' || user?.isSuspended}
                      onClick={() => setApprovalStatus('Approved')}
                      className={`flex-1 py-2 font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                        approvalStatus === 'Approved' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Approve Frame
                    </button>
                    <button
                      type="button"
                      disabled={user?.role !== 'Judge' || user?.isSuspended}
                      onClick={() => setApprovalStatus('Disapproved')}
                      className={`flex-1 py-2 font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                        approvalStatus === 'Disapproved' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Reject Frame
                    </button>
                  </div>
                </div>

                {!isFormDisapproved ? (
                  <div className="flex flex-col gap-4">
                    {/* Creativity Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">1. Originality & Creativity</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{creativity} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={user?.role === 'Admin'}
                        value={creativity}
                        onChange={(e) => setCreativity(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Composition Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">2. Layout & Composition</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{composition} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={user?.role === 'Admin'}
                        value={composition}
                        onChange={(e) => setComposition(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Technical Quality Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">3. Technical Execution</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{technicalQuality} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={user?.role === 'Admin'}
                        value={technicalQuality}
                        onChange={(e) => setTechnicalQuality(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Storytelling Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">4. Storytelling & Context</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{storytelling} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={user?.role === 'Admin'}
                        value={storytelling}
                        onChange={(e) => setStorytelling(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Overall Impact Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">5. Overall Impact & WOW factor</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{overallImpact} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={user?.role === 'Admin'}
                        value={overallImpact}
                        onChange={(e) => setOverallImpact(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-4 rounded-2xl flex items-start gap-2.5 text-[11px] text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                    <ShieldAlert className="shrink-0 mt-0.5 text-red-600" size={16} />
                    <p>Frame will be scored as 0. An explanation / justification remarks is required below to submit the rejection.</p>
                  </div>
                )}

                {/* Remarks textarea */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modalRemarks" className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">
                    Scoring explanation & feedback
                  </label>
                  <textarea
                    id="modalRemarks"
                    rows={3}
                    disabled={user?.role === 'Admin'}
                    required={isFormDisapproved}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={isFormDisapproved ? "Explain why this photograph is disapproved (e.g. mobile capture, watermark present, low res)..." : "Add comments or jury feedback..."}
                    className={`bg-slate-50 dark:bg-slate-950 border rounded-xl px-3 py-2.5 outline-none resize-none font-semibold text-slate-700 dark:text-slate-300 leading-relaxed text-xs ${
                      isFormDisapproved && (!remarks || remarks.trim() === '') ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500'
                    }`}
                  />
                </div>

                {/* Scoring aggregate summary */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/40 p-4 flex items-center justify-between text-slate-800 dark:text-slate-200 mt-2 font-bold">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Aggregate score</span>
                    <span className="text-[9px] text-slate-400">Sum of parameters out of 50</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-black text-2xl text-indigo-600 dark:text-indigo-400">{totalScore}</span>
                    <span className="text-xs text-slate-500 font-bold"> / 50</span>
                    <span className="text-[10px] text-slate-400 block font-bold">AVG: {averageScore}</span>
                  </div>
                </div>

                {/* Form submit */}
                {user?.role !== 'Admin' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                  >
                    {loading ? 'Saving grades...' : 'Save Evaluation sheet'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Offline Zoom Modal */}
      {offlineZoomPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 text-left my-8 h-[90vh]">
            
            {/* Left Column: Photograph (takes up full height and width, zooms on hover) */}
            <div className="flex-grow bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-slate-900/80 backdrop-blur text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                  Offline Zoom Mode
                </span>
                <span className={`bg-slate-900/80 backdrop-blur text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                  offlineZoomPhoto.graded ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {offlineZoomPhoto.graded ? 'Assessment Completed' : 'Pending Review'}
                </span>
              </div>

              {/* Hover Zoom preview container */}
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden group cursor-zoom-in">
                <WatermarkPreview
                  src={offlineZoomPhoto.fileUrl}
                  className="w-full h-full max-h-[68vh] object-contain rounded-lg shadow-lg"
                  enableZoom={true}
                />
              </div>
            </div>

            {/* Right Column: Metadata details / sidebar */}
            <div className="w-full md:w-[380px] bg-slate-50 dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Photograph Details</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Assigned entry metadata</span>
                </div>
                <button
                  onClick={() => setOfflineZoomPhoto(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Metadata content */}
              <div className="p-6 flex-grow flex flex-col gap-5 text-xs">
                
                {/* Title and Category */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Title & Category</span>
                  <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {offlineZoomPhoto.title}
                  </h4>
                  <span className="text-[10px] text-indigo-500 font-extrabold uppercase mt-0.5 block">
                    {offlineZoomPhoto.category}
                  </span>
                </div>

                {/* Photographer name */}
                <div className="flex flex-col gap-1 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Photographer</span>
                  <p className="font-extrabold text-slate-700 dark:text-slate-300">{offlineZoomPhoto.participantName}</p>
                </div>

                {/* Camera configuration parameters */}
                <div className="flex flex-col gap-2 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Camera Parameters</span>
                  <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col gap-2 leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Camera Brand:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{offlineZoomPhoto.cameraBrand || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Camera Model:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{offlineZoomPhoto.cameraModel || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lens Model:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[150px]" title={offlineZoomPhoto.lensUsed}>{offlineZoomPhoto.lensUsed || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date Captured:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {offlineZoomPhoto.dateCaptured ? new Date(offlineZoomPhoto.dateCaptured).toLocaleDateString() : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Description & Story */}
                <div className="flex flex-col gap-1.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Photo Description & Story</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 max-h-[140px] overflow-y-auto">
                    "{offlineZoomPhoto.description || 'No description shared.'}"
                  </p>
                </div>
              </div>

              {/* Footer action to close */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 font-bold">
                <button
                  type="button"
                  onClick={() => setOfflineZoomPhoto(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer font-bold"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OFF CONFIRMATION MODAL */}
      {showSignOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl mb-2">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Final Sign Off Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                SIGN OFF: This will finalize all your scores for this event. You cannot change your grades after signing off. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOffModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmGrading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Yes, Sign Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                {successTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center font-bold"
            >
              Awesome, Understood
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

