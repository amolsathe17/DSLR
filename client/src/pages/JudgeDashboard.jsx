import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, ShieldAlert, Award, Star, CheckCircle2, ChevronRight, X, Check, AlertTriangle } from 'lucide-react';
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
  const [creativity, setCreativity] = useState(5);
  const [composition, setComposition] = useState(5);
  const [technicalQuality, setTechnicalQuality] = useState(5);
  const [storytelling, setStorytelling] = useState(5);
  const [overallImpact, setOverallImpact] = useState(5);
  const [remarks, setRemarks] = useState('');

  const fetchJudgeData = async () => {
    try {
      const eventData = await apiFetch('/api/events');
      if (eventData.success && eventData.events.length > 0) {
        // Filter events where this judge is assigned
        const assigned = eventData.events.filter(e => e.assignedJudges && e.assignedJudges.includes(user?._id));
        setEvents(assigned);
        
        if (assigned.length > 0) {
          const active = assigned.find(e => e.status === 'Active') || assigned[0];
          setEvent(active);
          
          // Fetch assigned photos for this active event
          const photoData = await apiFetch(`/api/judges/assigned-photos/${active._id}`);
          if (photoData.success) {
            setPhotographs(photoData.photographs);
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
      }
    } catch (err) {
      console.error(err);
      setError('Could not load photographs for this event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchJudgeData();
    }
  }, [user?._id]);

  const handleOpenScoring = (photo) => {
    setActivePhoto(photo);
    if (photo.score) {
      setCreativity(photo.score.creativity);
      setComposition(photo.score.composition);
      setTechnicalQuality(photo.score.technicalQuality);
      setStorytelling(photo.score.storytelling);
      setOverallImpact(photo.score.overallImpact);
      setRemarks(photo.score.remarks || '');
    } else {
      setCreativity(5);
      setComposition(5);
      setTechnicalQuality(5);
      setStorytelling(5);
      setOverallImpact(5);
      setRemarks('');
    }
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
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
          remarks
        })
      });

      if (data.success) {
        // Refresh photo list
        const photoData = await apiFetch(`/api/judges/assigned-photos/${event._id}`);
        if (photoData.success) {
          setPhotographs(photoData.photographs);
        }
        setActivePhoto(null);
        alert('Score reviews submitted successfully!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGrading = async () => {
    if (!event) return;
    if (!confirm("Are you sure you want to finalize and submit your final grading evaluations for this event? Once confirmed, you will sign off on your reviews for the administrator.")) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/events/${event._id}/confirm-grading`, {
        method: 'POST'
      });
      if (data.success) {
        setEvent(data.event);
        setEvents(events.map(e => e._id === data.event._id ? data.event : e));
        alert("Grading sign-off successfully submitted!");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit grading sign-off");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic calculations
  const totalScore = creativity + composition + technicalQuality + storytelling + overallImpact;
  const averageScore = (totalScore / 5).toFixed(1);
  const allGraded = photographs.length > 0 && photographs.every(p => p.graded);
  const hasConfirmed = event?.confirmedJudges?.includes(user?._id);

  if (loading && photographs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading assigned entries...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-200">
      
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Photos grid */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Confirmation Sign-Off Banner */}
            {photographs.length > 0 && (
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

            <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Assigned Submissions ({photographs.length})</h3>
            
            {photographs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 animate-pulse">
                <Camera size={36} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium">No assigned photographs found.</p>
                <p className="text-xs max-w-xs text-slate-500">There are no finalized contestant entry submissions uploaded for this contest yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {photographs.map((photo) => (
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
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-emerald-100">
                            <CheckCircle2 size={10} />
                            Graded ({photo.score.averageScore}/10)
                          </span>
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
                        {photo.graded ? 'Edit Grade' : 'Score Photo'}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Column: Scoring Sheet Drawer */}
        <div className="lg:col-span-4">
          {activePhoto ? (
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md flex flex-col gap-6 animate-in slide-in-from-right-4 duration-200 sticky top-20">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Grading Sheet</h3>
                  <span className="text-[10px] text-slate-400 font-semibold line-clamp-1 mt-0.5">"{activePhoto.title}"</span>
                </div>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScoreSubmit} className="flex flex-col gap-4 text-xs">
                
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
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
                  <label className="font-bold text-slate-700 dark:text-slate-200">Judge Remarks / Critiques</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide constructive feedback for the photographer..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-20 focus:outline-none focus:border-indigo-600 text-[11px]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-colors text-center"
                >
                  Submit Grade Evaluation
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 h-80 text-slate-400">
              <Star size={28} className="text-slate-300 animate-pulse mb-3" />
              <p className="text-xs font-semibold">Select a photograph on the left to begin evaluation grading sheets.</p>
            </div>
          )}
        </div>
      </div>
    )}

  </div>
);
}
