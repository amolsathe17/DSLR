import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, ShieldAlert, Award, Star, CheckCircle2, ChevronRight, X, Check, AlertTriangle, Clock, XCircle } from 'lucide-react';
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
          <p className="text-xs max-w-sm text-slate-500">
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

          {evaluationMode === 'offline' ? (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
              {/* Confirmation Sign-Off Banner */}
              {user?.role !== 'Admin' && photographs.length > 0 && (
                hasConfirmed ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-bold">Evaluation Signed Off</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">You have confirmed your reviews for this event. Thank you!</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg shrink-0">Confirmed</span>
                  </div>
                ) : (
                  allGraded && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-850 dark:text-amber-300">
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-bold">All Submissions Graded!</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Please submit your final review confirmation to notify the administrator.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmGrading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition-colors shrink-0 text-center"
                      >
                        Confirm Review & Sign-Off
                      </button>
                    </div>
                  )
                )
              )}

              {displayedPhotos.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 animate-pulse">
                  <Camera size={36} className="text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No assigned photographs found.</p>
                  <p className="text-xs max-w-xs text-slate-500">There are no finalized contestant entry submissions uploaded for this participant yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Photo</th>
                          <th className="p-4">Title</th>
                          <th className="p-4">Participant Name</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-center">Avg</th>
                          <th className="p-4">Approval</th>
                          <th className="p-4">Explanation / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayedPhotos.map(photo => {
                          const scores = offlineScores[photo.photoId] || {
                            creativity: photo.score?.creativity || 5,
                            composition: photo.score?.composition || 5,
                            technicalQuality: photo.score?.technicalQuality || 5,
                            storytelling: photo.score?.storytelling || 5,
                            overallImpact: photo.score?.overallImpact || 5,
                            remarks: photo.score?.remarks || '',
                            approvalStatus: photo.score?.approvalStatus || 'Approved'
                          };
                          const appStatus = scores.approvalStatus || 'Approved';
                          const rowAvg = appStatus === 'Disapproved' ? 0 : (Number(scores.creativity) || 5);
                          return (
                            <tr key={photo.photoId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                              <td className="p-4">
                                <div 
                                  onClick={() => setOfflineZoomPhoto(photo)}
                                  className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                  data-tooltip="Click to zoom / view full photograph"
                                >
                                  <img 
                                    src={photo.fileUrl} 
                                    alt={photo.title} 
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </td>
                              <td className="p-4 min-w-[120px] font-bold text-slate-900 dark:text-white">
                                {photo.title}
                              </td>
                              <td className="p-4 min-w-[120px] font-medium text-slate-700 dark:text-slate-350">
                                {photo.participantName}
                              </td>
                              <td className="p-4">
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
                                  {photo.category}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  disabled={user?.role === 'Admin' || hasConfirmed}
                                  value={rowAvg}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleOfflineScoreChange(photo.photoId, 'creativity', val);
                                    handleOfflineScoreChange(photo.photoId, 'composition', val);
                                    handleOfflineScoreChange(photo.photoId, 'technicalQuality', val);
                                    handleOfflineScoreChange(photo.photoId, 'storytelling', val);
                                    handleOfflineScoreChange(photo.photoId, 'overallImpact', val);
                                  }}
                                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-[10px] font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-4">
                                <select
                                  disabled={user?.role === 'Admin' || hasConfirmed}
                                  value={appStatus}
                                  onChange={(e) => {
                                    handleOfflineScoreChange(photo.photoId, 'approvalStatus', e.target.value);
                                  }}
                                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="Approved">Approved</option>
                                  <option value="Disapproved">Disapproved</option>
                                </select>
                              </td>
                              <td className="p-4 min-w-[200px]">
                                <input
                                  type="text"
                                  disabled={user?.role === 'Admin' || hasConfirmed}
                                  value={scores.remarks || ''}
                                  onChange={(e) => {
                                    handleOfflineScoreChange(photo.photoId, 'remarks', e.target.value);
                                  }}
                                  placeholder={appStatus === 'Disapproved' ? 'Explanation required...' : 'Optional feedback...'}
                                  required={appStatus === 'Disapproved'}
                                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                    appStatus === 'Disapproved' && (!scores.remarks || scores.remarks.trim() === '')
                                      ? 'border-red-300 focus:ring-red-500 dark:border-red-900/45'
                                      : 'border-slate-200 dark:border-slate-800'
                                  }`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {user?.role !== 'Admin' && !hasConfirmed && displayedPhotos.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={handleSaveAllOfflineScores}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
              
              {/* Confirmation Sign-Off Banner */}
              {user?.role !== 'Admin' && photographs.length > 0 && (
                hasConfirmed ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-bold">Evaluation Signed Off</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">You have confirmed your reviews for this event. Thank you!</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg shrink-0">Confirmed</span>
                  </div>
                ) : (
                  allGraded && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-850 dark:text-amber-300">
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-bold">All Submissions Graded!</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Please submit your final review confirmation to notify the administrator.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmGrading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition-colors shrink-0 text-center"
                      >
                        Confirm Review & Sign-Off
                      </button>
                    </div>
                  )
                )
              )}

              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Assigned Submissions ({displayedPhotos.length})</h3>
              
              {displayedPhotos.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 animate-pulse">
                  <Camera size={36} className="text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No assigned photographs found.</p>
                  <p className="text-xs max-w-xs text-slate-500">There are no finalized contestant entry submissions uploaded for this participant yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedPhotos.map((photo) => (
                    <div
                      key={photo.photoId}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <WatermarkPreview src={photo.fileUrl} className="aspect-video w-full" />

                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                            {photo.title}
                          </h4>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
                            {photo.category}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 flex flex-col gap-1">
                          <p>Camera: <span className="font-bold text-slate-800 dark:text-slate-200">{photo.cameraBrand} {photo.cameraModel}</span></p>
                          <p>Lens: <span className="font-semibold text-slate-700 dark:text-slate-350 truncate block">{photo.lensUsed || 'N/A'}</span></p>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                          <div>
                            {photo.graded ? (
                              photo.score?.approvalStatus === 'Disapproved' ? (
                                <span className="text-[9px] bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-rose-100">
                                  <XCircle size={10} className="text-rose-500" />
                                  Disapproved
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-emerald-100">
                                  <CheckCircle2 size={10} />
                                  Graded ({photo.score.averageScore}/10)
                                </span>
                              )
                            ) : (
                              <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                                Ungraded
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenScoring(photo)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-0.5 cursor-pointer shadow-sm"
                          >
                            {hasConfirmed || photo.score?.approvalStatus === 'Disapproved' ? 'View Grade' : photo.graded ? 'Edit Grade' : 'Score Photo'}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Online Evaluation Modal Overlay (Zoom Mode + Grading Sheet Card side-by-side) */}
              {activePhoto && (() => {
                const isReadOnly = user?.role === 'Admin' || hasConfirmed || activePhoto.score?.approvalStatus === 'Disapproved';
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-7xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col lg:flex-row my-8 max-h-[90vh]">
                      
                      {/* Close button */}
                      <button
                        onClick={() => setActivePhoto(null)}
                        className="absolute top-4 right-4 z-10 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full cursor-pointer transition-colors"
                      >
                        <X size={20} />
                      </button>

                      {/* Left Side: Photo Zoom Detailed View */}
                      <div className="flex-1 bg-slate-950 flex flex-col justify-between p-6 relative min-h-[300px] lg:min-h-[580px]">
                        <div className="w-full flex-grow flex items-center justify-center overflow-hidden">
                          <WatermarkPreview src={activePhoto.fileUrl} className="w-full h-full max-h-[68vh] object-contain rounded-lg shadow-lg" enableZoom={true} />
                        </div>
                        
                        <div className="w-full mt-4 flex flex-col md:flex-row justify-between items-start gap-6 text-xs text-slate-300 pb-6 pr-2">
                          {/* Left: Metadata details */}
                          <div className="flex flex-col gap-1 text-left">
                            <h4 className="font-display font-extrabold text-sm text-white">{activePhoto.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                              <span>Category: <span className="font-bold text-slate-350">{activePhoto.category}</span></span>
                              <span>•</span>
                              <span>Photographer: <span className="font-bold text-slate-350">{activePhoto.participantName}</span></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                              <span>Camera: <span className="font-semibold text-slate-350">{activePhoto.cameraBrand} {activePhoto.cameraModel}</span></span>
                              <span>•</span>
                              <span>Lens: <span className="font-semibold text-slate-350">{activePhoto.lensUsed || 'N/A'}</span></span>
                            </div>
                          </div>

                          {/* Right: Description */}
                          <div className="max-w-[320px] lg:max-w-[420px] text-left md:text-right flex flex-col gap-1 md:items-end shrink-0">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                              Photo Description
                            </span>
                            <p className="text-[11px] text-slate-350 leading-relaxed font-medium italic">
                              "{activePhoto.description || 'No description shared.'}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Grading Sheet Card (same width w-[380px]) */}
                      <div className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-6 overflow-y-auto max-h-[90vh] text-left flex flex-col gap-5 bg-slate-50/30 dark:bg-slate-900/30">
                        <div>
                          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Grading Sheet</h3>
                          <span className="text-[10px] text-slate-400 font-semibold line-clamp-1 mt-0.5">"{activePhoto.title}"</span>
                        </div>

                        <form onSubmit={handleScoreSubmit} className="flex flex-col gap-4 text-xs">
                          
                          {/* Admin judge reviews inspector */}
                          {user?.role === 'Admin' && activePhoto.allScores && activePhoto.allScores.length > 0 && (
                            <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl">
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">
                                Judge Evaluations ({activePhoto.allScores.length})
                              </span>
                              <div className="flex flex-col gap-2 mt-1">
                                {activePhoto.allScores.map((s, sIdx) => (
                                  <div 
                                    key={sIdx} 
                                    onClick={() => {
                                      setCreativity(s.creativity || 5);
                                      setComposition(s.composition || 5);
                                      setTechnicalQuality(s.technicalQuality || 5);
                                      setStorytelling(s.storytelling || 5);
                                      setOverallImpact(s.overallImpact || 5);
                                      setRemarks(s.remarks || '');
                                    }}
                                    className="flex justify-between items-center text-[10px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition-colors"
                                    data-tooltip="Click to view details in sliders"
                                  >
                                    <div className="text-left">
                                      <p className="font-bold text-slate-800 dark:text-white">{s.judgeName}</p>
                                      <p className="text-[8px] text-slate-400 truncate max-w-[150px]">"{s.remarks || 'No remarks'}"</p>
                                    </div>
                                    <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">★ {s.averageScore?.toFixed(1)}/10</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Scoring criteria sliders */}
                          {[
                            { label: 'Creativity (1-10)', val: creativity, set: setCreativity, desc: 'Originality, artistic expression, and concept.' },
                            { label: 'Composition (1-10)', val: composition, set: setComposition, desc: 'Rule of thirds, balance, visual framing.' },
                            { label: 'Technical Quality (1-10)', val: technicalQuality, set: setTechnicalQuality, desc: 'Focus, exposure, lighting, noise control.' },
                            { label: 'Storytelling (1-10)', val: storytelling, set: setStorytelling, desc: 'Narrative element, emotional evoke.' },
                            { label: 'Overall Impact (1-10)', val: overallImpact, set: setOverallImpact, desc: 'First impression, visual stun factor.' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                <span className="font-display font-black text-sm text-indigo-600 dark:text-indigo-400">{item.val}</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={item.val}
                                onChange={(e) => item.set(Number(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-75"
                                disabled={isReadOnly}
                              />
                              <span className="text-[9px] text-slate-400 leading-snug">{item.desc}</span>
                            </div>
                          ))}

                          {/* Score summary */}
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex justify-between items-center text-center mt-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Total Score</span>
                              <p className="font-display font-black text-xl text-slate-800 dark:text-slate-100">{totalScore} <span className="text-slate-400 text-xs">/ 50</span></p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-850"></div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Average Score</span>
                              <p className="font-display font-black text-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-0.5">
                                <Star size={16} className="fill-current text-indigo-600 dark:text-indigo-400 shrink-0" />
                                {averageScore}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-700 dark:text-slate-200">Approval Status</label>
                            <select
                              value={approvalStatus}
                              onChange={(e) => setApprovalStatus(e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-[11px] font-semibold"
                            >
                              <option value="Approved">Approved</option>
                              <option value="Disapproved">Disapproved</option>
                            </select>
                            {approvalStatus === 'Disapproved' && (
                              <span className="text-[9px] text-red-500 font-semibold mt-0.5">⚠️ An explanation/remarks is required when disapproving.</span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-700 dark:text-slate-200">Remarks / Explanation</label>
                            <textarea
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder={approvalStatus === 'Disapproved' ? 'Please provide explanation for disapproval...' : user?.role === 'Admin' ? 'No remarks provided yet.' : 'Provide constructive feedback for the photographer...'}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-20 focus:outline-none focus:border-indigo-600 text-[11px]"
                              required={(user?.role !== 'Admin' && !hasConfirmed && approvalStatus === 'Disapproved') || (user?.role !== 'Admin' && !hasConfirmed)}
                              disabled={isReadOnly}
                            />
                          </div>

                          {isReadOnly ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold py-2.5 rounded-xl text-center text-[10px] flex flex-col gap-1 items-center justify-center">
                              {activePhoto.score?.approvalStatus === 'Disapproved' && (
                                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-0.5">Disapproved Entry</span>
                              )}
                              <span>
                                {hasConfirmed 
                                  ? 'Evaluation Read-Only (Signed Off)' 
                                  : activePhoto.score?.approvalStatus === 'Disapproved'
                                    ? 'Evaluation Read-Only (Disapproved)'
                                    : 'Evaluation Read-Only (Admin Mode)'}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-colors text-center"
                            >
                              Submit Grade Evaluation
                            </button>
                          )}
                        </form>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </>
    )}

      {/* OFFLINE EVALUATION: ZOOM MODE MODAL WITH DETAILS SIDEBAR */}
      {offlineZoomPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-7xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col lg:flex-row my-8 max-h-[90vh]">
            
            {/* Close button */}
            <button
              onClick={() => setOfflineZoomPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left Side: Photo Zoom Detailed View */}
            <div className="flex-1 bg-slate-950 flex flex-col justify-between p-6 relative min-h-[300px] lg:min-h-[580px] overflow-hidden">
              <div className="w-full flex-grow flex items-center justify-center overflow-hidden">
                <WatermarkPreview src={offlineZoomPhoto.fileUrl} className="w-full h-[72vh] rounded-lg shadow-lg" enableZoom={true} />
              </div>
              
              <div className="w-full mt-4 flex flex-col gap-1 text-xs text-slate-300 text-left pb-6">
                <h4 className="font-display font-extrabold text-sm text-white">{offlineZoomPhoto.title}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400">
                  <span>Category: <span className="font-bold text-slate-350">{offlineZoomPhoto.category}</span></span>
                  <span>•</span>
                  <span>Photographer: <span className="font-bold text-slate-350">{offlineZoomPhoto.participantName}</span></span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                  <span>Camera: <span className="font-semibold text-slate-300">{offlineZoomPhoto.cameraBrand} {offlineZoomPhoto.cameraModel}</span></span>
                  <span>•</span>
                  <span>Lens: <span className="font-semibold text-slate-300">{offlineZoomPhoto.lensUsed || 'N/A'}</span></span>
                </div>
              </div>
            </div>

            {/* Right Side: Details & Description Panel (same width w-[380px]) */}
            <div className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-6 overflow-y-auto max-h-[90vh] text-left flex flex-col gap-5 bg-slate-50/30 dark:bg-slate-900/30">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Photo Details</h3>
                <span className="text-[10px] text-slate-400 font-semibold line-clamp-1 mt-0.5">"{offlineZoomPhoto.title}"</span>
              </div>

              {/* Photo Description Section */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Photo Description
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                  "{offlineZoomPhoto.description || 'No description provided by the photographer.'}"
                </p>
              </div>

              {/* Photo Metadata Info */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-2.5 shadow-sm text-[11px]">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  Submission Details
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                    <span className="text-slate-400">Category</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{offlineZoomPhoto.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                    <span className="text-slate-400">Photographer</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{offlineZoomPhoto.participantName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                    <span className="text-slate-400">Camera</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{offlineZoomPhoto.cameraBrand} {offlineZoomPhoto.cameraModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lens</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{offlineZoomPhoto.lensUsed || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM SIGN-OFF MODAL */}
      {showSignOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Finalize Evaluations Sign-Off
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to finalize and submit your final grading evaluations for this event? Once confirmed, you will sign off on your reviews for the administrator.
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
