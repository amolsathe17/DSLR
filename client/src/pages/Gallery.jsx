import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Filter, Award, Sparkles, X, Maximize2, ShieldCheck, HelpCircle, Flag, MessageSquare, AlertTriangle, Trophy, Eye, Download } from 'lucide-react';
import WatermarkPreview from '../components/WatermarkPreview';

export default function Gallery() {
  const { apiFetch, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('winners'); // Default to winners for guests
  const [event, setEvent] = useState(null);
  const [photographs, setPhotographs] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default active tab based on user status when auth completes loading
  useEffect(() => {
    if (!authLoading) {
      setActiveTab(user ? 'gallery' : 'winners');
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        // Fetch active event
        const eData = await apiFetch('/api/events');
        if (eData.success && eData.events.length > 0) {
          const active = eData.events.find(e => e.status === 'Active') || eData.events[0];
          setEvent(active);
        }

        // Fetch categories
        const cData = await apiFetch('/api/categories');
        if (cData.success) setCategories(cData.categories);

        // Fetch approved gallery photos
        const pData = await apiFetch('/api/submissions/gallery');
        if (pData.success) setPhotographs(pData.photographs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryData();
  }, []);

  const filteredPhotos = photographs.filter(p => {
    // If logged in as Participant, only see own photos
    if (user && user.role === 'Participant') {
      const isOwnPhoto = p.userId === user._id || p.participantEmail === user.email;
      if (!isOwnPhoto) return false;
    }

    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.participantName.toLowerCase().includes(search.toLowerCase()) ||
      p.cameraModel.toLowerCase().includes(search.toLowerCase()) ||
      p.cameraBrand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? p.category === category : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading Exhibition...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-2 mb-12">
          <div className="inline-flex self-center items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            Public Exhibition
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Exhibition Gallery & Results
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Browse through approved DSLR photographs or view the champions' leaderboard.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 max-w-xl mx-auto gap-8 mb-8">
          {user && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 pb-3 border-b-2 font-display text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Camera size={16} />
              Approved Entries
            </button>
          )}
          {user && (user.role === 'Admin' || user.role === 'Participant') && (
            <button
              onClick={() => setActiveTab('disapproved')}
              className={`flex items-center gap-1.5 pb-3 border-b-2 font-display text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'disapproved'
                  ? 'border-red-500 text-red-650 dark:text-red-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Flag size={16} className={activeTab === 'disapproved' ? 'text-red-500' : 'text-slate-400'} />
              Disapproved Entries
            </button>
          )}
          {(!user || user.role !== 'Participant' || event?.winnersPublished) && (
            <button
              onClick={() => setActiveTab('winners')}
              className={`flex items-center gap-1.5 pb-3 border-b-2 font-display text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'winners'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Award size={16} />
              Winners Circle
            </button>
          )}
        </div>

        {/* TAB 1: APPROVED SUBMISSIONS */}
        {activeTab === 'gallery' && user && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, camera, photographer..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Gallery Grid */}
            {(() => {
              const approvedPhotos = filteredPhotos.filter(p => !p.scores || p.scores.every(s => s.approvalStatus === 'Approved'));
              if (approvedPhotos.length === 0) {
                return (
                  <div className="text-center text-slate-400 py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Camera size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No approved photographs to display.</p>
                    <p className="text-xs text-slate-500 mt-1">Check back later once submissions are processed.</p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedPhotos.map(photo => (
                    <div
                      key={photo.photoId}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group"
                    >
                      <div className="relative overflow-hidden aspect-video">
                        <img
                          src={photo.fileUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => setSelectedPhoto(photo)}
                          className="absolute top-3 right-3 p-1.5 bg-slate-950/60 hover:bg-slate-950 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col gap-3 justify-between flex-grow">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                              {photo.title}
                            </h3>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-bold text-slate-500">
                              {photo.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            By {photo.participantName}
                          </p>
                        </div>

                        {/* Exif details footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-[9px] text-slate-450 uppercase tracking-wider font-bold">
                          <span>{photo.cameraBrand} {photo.cameraModel}</span>
                          <button
                            onClick={() => setSelectedPhoto(photo)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 1.5: DISAPPROVED SUBMISSIONS */}
        {activeTab === 'disapproved' && user && (user.role === 'Admin' || user.role === 'Participant') && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, camera, photographer..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Gallery Grid */}
            {(() => {
              const disapprovedPhotos = filteredPhotos.filter(p => p.scores && p.scores.some(s => s.approvalStatus === 'Disapproved'));
              if (disapprovedPhotos.length === 0) {
                return (
                  <div className="text-center text-slate-400 py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Flag size={36} className="mx-auto mb-2 text-slate-350" />
                    <p className="text-sm font-semibold">No disapproved photographs to display.</p>
                    <p className="text-xs text-slate-500 mt-1">Excellent! No entries have been disapproved by judges.</p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {disapprovedPhotos.map(photo => {
                    const disapprovals = photo.scores.filter(s => s.approvalStatus === 'Disapproved');
                    return (
                      <div
                        key={photo.photoId}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group justify-between"
                      >
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={photo.fileUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                          />
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Flag size={9} className="fill-white" /> Disapproved
                          </span>
                          <button
                            onClick={() => setSelectedPhoto(photo)}
                            className="absolute top-3 right-3 p-1.5 bg-slate-950/60 hover:bg-slate-950 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>

                        <div className="p-4 flex flex-col gap-3 justify-between flex-grow">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                                {photo.title}
                              </h3>
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-bold text-slate-500">
                                {photo.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              By {photo.participantName}
                            </p>

                            {/* Disapproval reasons */}
                            <div className="mt-2 pt-2 border-t border-red-200/40 dark:border-red-900/20 text-[10px] bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/10">
                              <span className="font-extrabold text-red-650 dark:text-red-455 flex items-center gap-1">
                                ⚠️ Entry Disapproved by Judge
                              </span>
                              <div className="flex flex-col gap-1.5 mt-1 text-slate-650 dark:text-slate-400">
                                {disapprovals.map((s, idx) => (
                                  <div key={idx} className="border-t border-red-100/30 dark:border-red-900/10 pt-1.5 first:border-0 first:pt-0">
                                    <span className="font-bold text-[9px] text-slate-500 uppercase tracking-wider block">Explanation Remarks ({s.judgeName || 'Panel Judge'}):</span>
                                    <p className="italic mt-0.5">"{s.remarks || 'No remarks provided.'}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Exif details footer */}
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-[9px] text-slate-450 uppercase tracking-wider font-bold">
                            <span>{photo.cameraBrand} {photo.cameraModel}</span>
                            <button
                              onClick={() => setSelectedPhoto(photo)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: WINNERS CIRCLE */}
        {activeTab === 'winners' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-200 flex flex-col gap-6">
            {!event?.winnersPublished ? (
              <div className="text-center text-slate-400 py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                <Award size={36} className="mx-auto mb-2 text-slate-350 animate-bounce" />
                <p className="text-sm font-semibold">Rankings pending publication.</p>
                <p className="text-xs text-slate-500 mt-1">Judges are currently grading the entries. Winners will be declared shortly.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
                {event.winners.map((w, idx) => {
                  const isFirst = w.rank.toLowerCase().includes('1st') || w.rank.toLowerCase().includes('first');
                  const isSecond = w.rank.toLowerCase().includes('2nd') || w.rank.toLowerCase().includes('second');
                  
                  const trophyColor = isFirst ? 'text-amber-500' : isSecond ? 'text-slate-400' : 'text-amber-700';
                  const badgeBg = isFirst ? 'bg-amber-500/10 text-amber-600' : isSecond ? 'bg-slate-300/20 text-slate-600 dark:text-slate-400' : 'bg-amber-700/10 text-amber-800 dark:text-amber-600';
                  const cardBorder = isFirst ? 'border-amber-500/40 bg-amber-500/5' : isSecond ? 'border-slate-300 dark:border-slate-700' : 'border-amber-750/30';
                  
                  // Predefined certificate template preview
                  const certTemplateName = isFirst ? '1st-Prize.png' : isSecond ? '2nd-Prize.png' : '3rd-Prize.png';
                  
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col lg:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-md transition-all hover:shadow-lg ${cardBorder}`}
                    >
                      {/* Left: Winning Photograph Display */}
                      <div className="relative group shrink-0 w-full lg:w-64 aspect-video overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <img
                          src={w.fileUrl || photographs.find(p => p.photoId === w.photoId || p.photoId === w.photographId)?.fileUrl}
                          alt={w.photoTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[9px] text-white font-extrabold uppercase">
                          Winning Frame
                        </div>
                      </div>
                      
                      {/* Middle: Winner details */}
                      <div className="flex-1 flex flex-col justify-between gap-4 text-left w-full">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${badgeBg}`}>
                              <Trophy size={11} className={trophyColor} />
                              {w.rank}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Final Score: {w.score}/10
                            </span>
                          </div>

                          <h3 className="font-display font-black text-xl text-slate-900 dark:text-white leading-snug">
                            {w.photoTitle}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
                            <div>
                              <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Champion Artist</p>
                              <p className="mt-0.5 text-slate-850 dark:text-slate-200 font-extrabold text-sm">{w.userName}</p>
                              {w.userEmail && <p className="text-[10px] text-slate-400 mt-0.5">{w.userEmail}</p>}
                            </div>
                            <div>
                              <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Reward & Accolades</p>
                              <p className="mt-0.5 text-indigo-600 dark:text-indigo-400 font-bold">{w.prizeAmount || (isFirst ? '₹50,000' : isSecond ? '₹30,000' : '₹20,000')} Cash</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">Includes Winner Trophy & Certificate</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Certificate Preview and Action Buttons */}
                      <div className="shrink-0 w-full lg:w-44 flex flex-col gap-3 items-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/60 pt-4 lg:pt-0 lg:pl-6">
                        <div className="relative group w-28 aspect-[1/1.414] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer"
                             onClick={() => w.certificatePdfUrl && window.open(w.certificatePdfUrl, '_blank')}>
                          <img
                            src={`/uploads/${certTemplateName}`}
                            alt="Certificate Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 flex items-center justify-center transition-all duration-300">
                            <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Certificate Preview</span>

                        <div className="flex flex-col gap-1.5 w-full mt-1">
                          <button
                            type="button"
                            onClick={() => w.certificatePdfUrl && window.open(w.certificatePdfUrl, '_blank')}
                            className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            View Certificate
                          </button>
                          <a
                            href={w.certificatePdfUrl || '#'}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all text-center"
                          >
                            <Download size={12} />
                            Download PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
                {/* Custom Watermarked Preview component */}
                <WatermarkPreview src={selectedPhoto.fileUrl} className="w-full h-full" />
              </div>
              <div className="lg:col-span-4 p-6 flex flex-col justify-between text-xs max-h-[500px] overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">{selectedPhoto.title}</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded font-bold text-[9px] inline-block mt-1">
                      {selectedPhoto.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Photographer</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-250">{selectedPhoto.participantName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</span>
                    <p className="text-slate-500 leading-relaxed mt-0.5">{selectedPhoto.description || 'No description shared.'}</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">EXIF Capture Info</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div>
                        <span>Brand:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.cameraBrand || 'Unknown'}</p>
                      </div>
                      <div>
                        <span>Model:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.cameraModel || 'Unknown'}</p>
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

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-6">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck size={16} className="text-indigo-650" />
                    <span>EXIF Audited DSLR Capture</span>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl shadow cursor-pointer text-xs"
                  >
                    Close View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
