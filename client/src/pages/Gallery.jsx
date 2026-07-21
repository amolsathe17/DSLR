import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Filter, Award, Sparkles, X, Maximize2, ShieldCheck, HelpCircle, Flag, MessageSquare, AlertTriangle } from 'lucide-react';
import WatermarkPreview from '../components/WatermarkPreview';

export default function Gallery() {
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' or 'winners'
  const [event, setEvent] = useState(null);
  const [photographs, setPhotographs] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

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
        </div>

        {/* TAB 1: APPROVED SUBMISSIONS */}
        {activeTab === 'gallery' && (
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
        {activeTab === 'disapproved' && (
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
                            <div className="mt-3 flex flex-col gap-1.5 border border-red-200/50 dark:border-red-900/30 rounded-xl p-2.5 bg-red-50/40 dark:bg-red-950/10">
                              <span className="text-[9px] font-bold text-red-655 dark:text-red-400 uppercase tracking-wide flex items-center gap-1">
                                <AlertTriangle size={10} className="text-red-500 shrink-0" />
                                <span>Judge Remarks:</span>
                              </span>
                              {disapprovals.map((s, i) => (
                                <div key={i} className="text-[9px] border-t border-red-150/40 dark:border-red-900/20 pt-1.5 first:border-0 first:pt-0">
                                  <span className="font-bold text-red-600">✗ {s.judgeName || 'Judge'}:</span>
                                  {s.remarks ? (
                                    <p className="italic text-red-500 dark:text-red-300 mt-0.5 leading-snug">"{s.remarks}"</p>
                                  ) : (
                                    <p className="italic text-red-450 dark:text-red-350 mt-0.5">No comments left.</p>
                                  )}
                                </div>
                              ))}
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
              <div className="flex flex-col gap-6">
                {event.winners.map((w, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-sm ${
                      idx === 0 
                        ? 'border-amber-500/40 bg-amber-500/5' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="relative group shrink-0 w-full sm:w-48 aspect-video sm:aspect-square overflow-hidden rounded-2xl bg-slate-900">
                      <img
                        src={w.fileUrl || photographs.find(p => p.photoId === w.photoId || p.photoId === w.photographId)?.fileUrl}
                        alt={w.photoTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between h-full gap-4 text-center sm:text-left w-full">
                      <div className="flex-grow flex flex-col gap-3">
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider block ${idx === 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>
                            {w.rank}
                          </span>
                          <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                            {w.photoTitle}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                          <div>
                            <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Participant Details</p>
                            <p className="mt-0.5 text-slate-850 dark:text-slate-200 font-semibold">{w.userName}</p>
                            {w.userEmail && <p className="text-[10px] text-slate-400 mt-0.5">{w.userEmail}</p>}
                            {w.userCity && <p className="text-[10px] text-slate-400">City: {w.userCity}</p>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Evaluated By Judges</p>
                            <p className="mt-0.5 text-slate-850 dark:text-slate-200 font-semibold">
                              {w.judges && w.judges.length > 0 ? w.judges.join(', ') : 'Assigned Panel'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Grade Score: {w.score}/10</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 flex justify-between items-center text-xs mt-1">
                          <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1 rounded-xl">
                            Reward: {w.reward}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1 rounded-xl">
                            Verified Grade: {w.score}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
