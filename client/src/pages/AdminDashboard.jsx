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
  Maximize2,
  FileCheck,
  RefreshCw,
  History
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
  const [photoDslrStatus, setPhotoDslrStatus] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Judges states
  const [judges, setJudges] = useState([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgePassword, setNewJudgePassword] = useState('');
  const [newJudgeMobile, setNewJudgeMobile] = useState('');
  const [newJudgeCity, setNewJudgeCity] = useState('');
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showAssignJudgesModal, setShowAssignJudgesModal] = useState(false);
  const [selectedEventForJudges, setSelectedEventForJudges] = useState(null);
  const [selectedJudgesForEvent, setSelectedJudgesForEvent] = useState([]);

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
  const [eventType, setEventType] = useState('Photography');
  const [customEventType, setCustomEventType] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('Bal-Gandharv Art Gallery, Jangali Mharaj Road Pune 411030');
  const [hasExhibition, setHasExhibition] = useState(false);
  const [exhibitionFromDate, setExhibitionFromDate] = useState('');
  const [exhibitionToDate, setExhibitionToDate] = useState('');
  const [loginBgUrl, setLoginBgUrl] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [prize1Reward, setPrize1Reward] = useState('₹50,000 Cash + Gold Trophy');
  const [prize2Reward, setPrize2Reward] = useState('₹30,000 Cash + Silver Trophy');
  const [prize3Reward, setPrize3Reward] = useState('₹20,000 Cash + Bronze Trophy');
  const [newEventPackages, setNewEventPackages] = useState([
    { name: 'Starter', price: 200, maxPhotos: 1 },
    { name: 'Amateur', price: 300, maxPhotos: 2 },
    { name: 'Pro', price: 400, maxPhotos: 5 }
  ]);

  // Edit Event states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventTheme, setEditEventTheme] = useState('');
  const [editEventDeadline, setEditEventDeadline] = useState('');
  const [editEventRules, setEditEventRules] = useState('');
  const [editEventType, setEditEventType] = useState('Photography');
  const [editCustomEventType, setEditCustomEventType] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [editEventVenue, setEditEventVenue] = useState('');
  const [editHasExhibition, setEditHasExhibition] = useState(false);
  const [editExhibitionFromDate, setEditExhibitionFromDate] = useState('');
  const [editExhibitionToDate, setEditExhibitionToDate] = useState('');
  const [editPrize1Reward, setEditPrize1Reward] = useState('');
  const [editPrize2Reward, setEditPrize2Reward] = useState('');
  const [editPrize3Reward, setEditPrize3Reward] = useState('');
  const [editEventPackages, setEditEventPackages] = useState([
    { name: 'Starter', price: 200, maxPhotos: 1 },
    { name: 'Amateur', price: 300, maxPhotos: 2 },
    { name: 'Pro', price: 400, maxPhotos: 5 }
  ]);

  // Purge confirmation modal states
  const [showPurgeConfirmModal, setShowPurgeConfirmModal] = useState(false);
  const [purgeBackupTarget, setPurgeBackupTarget] = useState(null);

  // Activate confirmation modal states
  const [showActivateConfirmModal, setShowActivateConfirmModal] = useState(false);
  const [activateTargetId, setActivateTargetId] = useState(null);

  useEffect(() => {
    let defaultRules = '';
    let defaultDesc = '';
    const actualType = eventType === 'Other' ? (customEventType || 'Contest') : eventType;
    
    if (eventType === 'Photography') {
      defaultRules = [
        'All submissions must be captured using a DSLR or Mirrorless Camera. Mobile photography is strictly prohibited and results in immediate disqualification.',
        'Participants must upload high-resolution images in JPEG, PNG, or TIFF format. RAW files (.cr2, .nef, etc.) are highly recommended for metadata verification.',
        'Submissions must not contain watermarks, signatures, or borders added by post-processing.',
        'Basic editing (brightness, contrast, crop) is allowed. Heavily manipulated composites, AI additions, or removals are strictly forbidden.',
        'Entries must be uploaded before the submission deadline. Late entries will not be accepted under any circumstances.'
      ].join('\n');
      defaultDesc = 'The premier national photography competition designed exclusively for DSLR & Mirrorless camera enthusiasts. Show us your vision of nature, wildlife, and landscapes.';
    } else if (eventType === 'Painting') {
      defaultRules = [
        'All submissions must be original hand-painted physical works (Watercolor, Acrylic, Oil, Canvas, etc.). Digital paintings are strictly prohibited.',
        'Participants must upload a clear high-resolution photograph of the physical painting under balanced lighting.',
        'Entries must not contain digital borders, frames, watermarks, or signatures.',
        'Only original artwork created solely by the participant will be considered. Plagiarism results in immediate disqualification.'
      ].join('\n');
      defaultDesc = 'Celebrate the beauty of color and texture. An open competition for physical painting entries highlighting original artistic expressions.';
    } else if (eventType === 'Drawing') {
      defaultRules = [
        'All submissions must be hand-drawn artworks (Pencil sketch, Charcoal, Ink, Pastels, etc.). Digital drawings are not allowed.',
        'Participants must upload a clear high-resolution scan or photo of the drawing.',
        'Entries must be 100% hand-made without digital enhancements or retouching.',
        'Plagiarism or copying from pre-existing copyrighted artwork is strictly prohibited.'
      ].join('\n');
      defaultDesc = 'A national championship celebrating the art of lines, shading, and sketches. Unveil your creations in pencil, charcoal, or ink.';
    } else if (eventType === 'Paper Craft') {
      defaultRules = [
        'Submissions must be original three-dimensional craft works made primarily from paper (Origami, Paper Quilling, Paper Sculptures, Paper mache, etc.).',
        'Participants must upload a clear showcase photograph displaying their craft from the best angle.',
        'Structural materials (like wire, wood or glue) must be minimal and subordinate to paper.',
        'Submissions using pre-fabricated kits or commercial templates are strictly prohibited.'
      ].join('\n');
      defaultDesc = 'Turning paper into awe-inspiring art. Join the premier national craft championship for origami and paper sculpture enthusiasts.';
    } else {
      defaultRules = [
        'All entries must be original works created by the participant.',
        'Participants must upload high-resolution images or files of their entry.',
        'Plagiarism or copying from existing works is strictly prohibited.',
        'Decisions of the evaluation panel will be final.'
      ].join('\n');
      defaultDesc = `The national ${actualType.toLowerCase()} championship. Open to all creative minds to showcase their talent in this category.`;
    }
    
    setNewEventRules(defaultRules);
    setNewEventDescription(defaultDesc);
  }, [eventType, customEventType]);

  const [showEventSuccessModal, setShowEventSuccessModal] = useState(false);
  const [createdEventTitle, setCreatedEventTitle] = useState('');
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState(null);
  const [eventToDeleteTitle, setEventToDeleteTitle] = useState('');
  const [showDeleteCatModal, setShowDeleteCatModal] = useState(false);
  const [catToDeleteId, setCatToDeleteId] = useState(null);
  const [catToDeleteName, setCatToDeleteName] = useState('');
  const [showDeleteParticipantModal, setShowDeleteParticipantModal] = useState(false);
  const [participantToDeleteId, setParticipantToDeleteId] = useState(null);
  const [participantToDeleteName, setParticipantToDeleteName] = useState('');
  const [showDeleteJudgeModal, setShowDeleteJudgeModal] = useState(false);
  const [judgeToDeleteId, setJudgeToDeleteId] = useState(null);
  const [judgeToDeleteName, setJudgeToDeleteName] = useState('');
  const [showGeneralSuccessModal, setShowGeneralSuccessModal] = useState(false);
  const [generalSuccessTitle, setGeneralSuccessTitle] = useState('');
  const [generalSuccessMsg, setGeneralSuccessMsg] = useState('');

  const triggerSuccessModal = (title, message) => {
    setGeneralSuccessTitle(title);
    setGeneralSuccessMsg(message);
    setShowGeneralSuccessModal(true);
  };

  // Event History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [eventHistory, setEventHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryEvent, setActiveHistoryEvent] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  
  // Selection/Modals
  const [selectedPhoto, setSelectedPhoto] = useState(null); // zoom / detail
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [assignJudgesPhoto, setAssignJudgesPhoto] = useState(null);
  const [selectedAssignJudges, setSelectedAssignJudges] = useState([]);

  // Winner rankings states
  const [eventToPublish, setEventToPublish] = useState(null);
  const [winnerAssignments, setWinnerAssignments] = useState([
    { rank: '1st Prize', reward: '₹50,000 Cash + Gold Trophy', submissionId: '', photoId: '', photographId: '', userName: '', photoTitle: '', fileUrl: '', score: 0 },
    { rank: '2nd Prize', reward: '₹30,000 Cash + Silver Trophy', submissionId: '', photoId: '', photographId: '', userName: '', photoTitle: '', fileUrl: '', score: 0 },
    { rank: '3rd Prize', reward: '₹20,000 Cash + Bronze Trophy', submissionId: '', photoId: '', photographId: '', userName: '', photoTitle: '', fileUrl: '', score: 0 }
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
      const url = `/api/admin/photographs?search=${photoSearch}&category=${photoCategory}&status=${photoStatus}&dslrStatus=${photoDslrStatus}`;
      const data = await apiFetch(url);
      if (data.success) {
        setPhotographs(data.photographs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const data = await apiFetch('/api/events/backups/list');
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (e) {
      console.error('Error fetching event backups:', e.message);
    } finally {
      setLoadingBackups(false);
    }
  };

  const fetchJudgesAndEvents = async () => {
    try {
      const jData = await apiFetch('/api/admin/judges');
      if (jData.success) setJudges(jData.judges);

      const eData = await apiFetch('/api/events?includeDrafts=true');
      if (eData.success) setEvents(eData.events);

      const cData = await apiFetch('/api/categories');
      if (cData.success) setCategories(cData.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEventHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiFetch('/api/admin/events-history');
      if (data.success) {
        setEventHistory(data.history);
        if (data.history.length > 0 && !activeHistoryEvent) {
          setActiveHistoryEvent(data.history[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        fetchJudgesAndEvents(),
        fetchParticipants(),
        fetchPhotographs(),
        fetchStats(),
        fetchBackups()
      ]);
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
      fetchJudgesAndEvents(),
      fetchBackups()
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
  }, [photoSearch, photoCategory, photoStatus, photoDslrStatus]);

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

  const executeDeleteParticipant = async () => {
    if (!participantToDeleteId) return;
    setShowDeleteParticipantModal(false);
    try {
      const data = await apiFetch(`/api/admin/participants/${participantToDeleteId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        triggerSuccessModal('Participant Deleted', 'The participant account and all their photo submissions have been deleted successfully.');
        fetchParticipants();
        fetchPhotographs();
        fetchStats();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setParticipantToDeleteId(null);
      setParticipantToDeleteName('');
    }
  };

  const executeDeleteJudge = async () => {
    if (!judgeToDeleteId) return;
    setShowDeleteJudgeModal(false);
    try {
      const data = await apiFetch(`/api/admin/judges/${judgeToDeleteId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        triggerSuccessModal('Judge Deleted', 'The judge account has been permanently deleted and unassigned from all events.');
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setJudgeToDeleteId(null);
      setJudgeToDeleteName('');
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

  const executeDeleteCategory = async () => {
    if (!catToDeleteId) return;
    setShowDeleteCatModal(false);
    try {
      const data = await apiFetch(`/api/categories/${catToDeleteId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        triggerSuccessModal('Category Deleted', 'The category has been deleted successfully.');
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setCatToDeleteId(null);
      setCatToDeleteName('');
    }
  };

  const handleLoginBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('loginBg', file);

    setUploadingBg(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/upload-bg`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setLoginBgUrl(data.fileUrl);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading login background image');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleDownloadBackup = async (backup) => {
    const fileUrl = backup.backupPath.startsWith('http') 
      ? backup.backupPath 
      : `${import.meta.env.VITE_API_URL || ''}${backup.backupPath}`;
    window.open(fileUrl, '_blank');

    try {
      const data = await apiFetch(`/api/events/backups/${backup._id}/downloaded`, {
        method: 'PUT'
      });
      if (data.success) {
        fetchBackups();
      }
    } catch (err) {
      console.error('Error marking backup downloaded:', err.message);
    }
  };

  const handlePurgeBackup = (backup) => {
    setPurgeBackupTarget(backup);
    setShowPurgeConfirmModal(true);
  };

  const executePurgeBackup = async () => {
    if (!purgeBackupTarget) return;
    setShowPurgeConfirmModal(false);
    try {
      const data = await apiFetch(`/api/events/backups/${purgeBackupTarget._id}/purge`, {
        method: 'DELETE'
      });
      if (data.success) {
        triggerSuccessModal('Contest Purged', 'The contest event and all associated details have been permanently deleted and purged from the portal.');
        fetchBackups();
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setPurgeBackupTarget(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const actualType = eventType === 'Other' ? customEventType : eventType;
      
      const data = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: newEventTitle,
          eventType: actualType || 'Photography',
          theme: newEventTheme,
          description: newEventDescription,
          venue: newEventVenue,
          rules: newEventRules.split('\n').filter(r => r.trim() !== ''),
          deadline: newEventDeadline,
          eventDate: hasExhibition && exhibitionFromDate 
            ? new Date(exhibitionFromDate) 
            : new Date(new Date(newEventDeadline).getTime() + 15 * 24 * 60 * 60 * 1000),
          hasExhibition,
          exhibitionFromDate: hasExhibition && exhibitionFromDate ? new Date(exhibitionFromDate) : null,
          exhibitionToDate: hasExhibition && exhibitionToDate ? new Date(exhibitionToDate) : null,
          loginBgUrl: loginBgUrl || null,
          prizes: [
            { rank: '1st Prize', reward: prize1Reward, description: 'Winner of the Championship Title' },
            { rank: '2nd Prize', reward: prize2Reward, description: 'Runner-up of the Championship' },
            { rank: '3rd Prize', reward: prize3Reward, description: 'Second Runner-up of the Championship' }
          ],
          faqs: [
            { question: `Is digital work allowed?`, answer: eventType === 'Photography' ? 'No. Only DSLR/Mirrorless photos are allowed.' : 'No. Only physical hand-made works are accepted.' },
            { question: 'What is the package fee?', answer: `We offer packages ranging from Starter to Pro options. View prices when starting your entry folder.` },
            { question: 'How will I receive my certificate?', answer: 'All valid participants can download a digital participation certificate directly from their dashboard after results are declared.' }
          ],
          terms: [
            'Participants retain copyright of their entries, but grant the organizer rights to showcase submissions on websites and promotional materials.',
            'Fees are non-refundable once payment is completed.',
            'The decision of the judging panel will be final and binding.'
          ],
          packages: newEventPackages.map((pkg, idx) => ({
            id: `pkg-${idx + 1}`,
            name: pkg.name,
            price: Number(pkg.price),
            maxPhotos: Number(pkg.maxPhotos)
          }))
        })
      });
      if (data.success) {
        setCreatedEventTitle(newEventTitle);
        setShowEventSuccessModal(true);
        setNewEventTitle('');
        setNewEventTheme('');
        setNewEventDeadline('');
        setNewEventRules('');
        setEventType('Photography');
        setCustomEventType('');
        setNewEventDescription('');
        setNewEventVenue('Bal-Gandharv Art Gallery, Jangali Mharaj Road Pune 411030');
        setHasExhibition(false);
        setExhibitionFromDate('');
        setExhibitionToDate('');
        setLoginBgUrl('');
        setPrize1Reward('₹50,000 Cash + Gold Trophy');
        setPrize2Reward('₹30,000 Cash + Silver Trophy');
        setPrize3Reward('₹20,000 Cash + Bronze Trophy');
        setNewEventPackages([
          { name: 'Starter', price: 200, maxPhotos: 1 },
          { name: 'Amateur', price: 300, maxPhotos: 2 },
          { name: 'Pro', price: 400, maxPhotos: 5 }
        ]);
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleEditClick = (e) => {
    setEditingEventId(e._id);
    setEditEventTitle(e.title || '');
    setEditEventType(e.eventType || 'Photography');
    setEditCustomEventType('');
    setEditEventTheme(e.theme || '');
    setEditEventDescription(e.description || '');
    setEditEventVenue(e.venue || '');
    setEditEventRules(e.rules ? e.rules.join('\n') : '');
    
    const dDate = e.deadline ? new Date(e.deadline).toISOString().split('T')[0] : '';
    setEditEventDeadline(dDate);
    setEditHasExhibition(!!e.hasExhibition);
    
    const fromD = e.exhibitionFromDate ? new Date(e.exhibitionFromDate).toISOString().split('T')[0] : '';
    setEditExhibitionFromDate(fromD);
    
    const toD = e.exhibitionToDate ? new Date(e.exhibitionToDate).toISOString().split('T')[0] : '';
    setEditExhibitionToDate(toD);
    
    const p1 = e.prizes && e.prizes.find(p => p.rank === '1st Prize');
    setEditPrize1Reward(p1 ? p1.reward : '');
    const p2 = e.prizes && e.prizes.find(p => p.rank === '2nd Prize');
    setEditPrize2Reward(p2 ? p2.reward : '');
    const p3 = e.prizes && e.prizes.find(p => p.rank === '3rd Prize');
    setEditPrize3Reward(p3 ? p3.reward : '');
    
    if (e.packages && e.packages.length > 0) {
      setEditEventPackages(e.packages.map(p => ({
        name: p.name,
        price: p.price,
        maxPhotos: p.maxPhotos
      })));
    } else {
      setEditEventPackages([
        { name: 'Starter', price: 200, maxPhotos: 1 },
        { name: 'Amateur', price: 300, maxPhotos: 2 },
        { name: 'Pro', price: 400, maxPhotos: 5 }
      ]);
    }
    
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const actualType = editEventType === 'Other' ? editCustomEventType : editEventType;
      
      const data = await apiFetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editEventTitle,
          eventType: actualType || 'Photography',
          theme: editEventTheme,
          description: editEventDescription,
          venue: editEventVenue,
          rules: editEventRules.split('\n').filter(r => r.trim() !== ''),
          deadline: editEventDeadline,
          eventDate: editHasExhibition && editExhibitionFromDate 
            ? new Date(editExhibitionFromDate) 
            : new Date(new Date(editEventDeadline).getTime() + 15 * 24 * 60 * 60 * 1000),
          hasExhibition: editHasExhibition,
          exhibitionFromDate: editHasExhibition && editExhibitionFromDate ? new Date(editExhibitionFromDate) : null,
          exhibitionToDate: editHasExhibition && editExhibitionToDate ? new Date(editExhibitionToDate) : null,
          prizes: [
            { rank: '1st Prize', reward: editPrize1Reward, description: 'Winner of the Championship Title' },
            { rank: '2nd Prize', reward: editPrize2Reward, description: 'Runner-up of the Championship' },
            { rank: '3rd Prize', reward: editPrize3Reward, description: 'Second Runner-up of the Championship' }
          ],
          packages: editEventPackages.map((pkg, idx) => ({
            id: `pkg-${idx + 1}`,
            name: pkg.name,
            price: Number(pkg.price),
            maxPhotos: Number(pkg.maxPhotos)
          }))
        })
      });
      if (data.success) {
        triggerSuccessModal('Contest Updated', `The contest "${editEventTitle}" has been updated successfully.`);
        setShowEditModal(false);
        fetchJudgesAndEvents();
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating contest event: ' + err.message);
    }
  };

  const executeDeleteEvent = async () => {
    if (!eventToDeleteId) return;
    setShowDeleteEventModal(false);
    try {
      const data = await apiFetch(`/api/events/${eventToDeleteId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        triggerSuccessModal('Contest Deleted & Archived', 'The contest event has been successfully deleted. A complete ledger history and results snapshot PDF has been generated and archived.');
        fetchJudgesAndEvents();
        fetchBackups();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setEventToDeleteId(null);
      setEventToDeleteTitle('');
    }
  };

  const handleActivateEvent = (eventId) => {
    setActivateTargetId(eventId);
    setShowActivateConfirmModal(true);
  };

  const executeActivateEvent = async () => {
    if (!activateTargetId) return;
    try {
      const data = await apiFetch(`/api/events/${activateTargetId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Active' })
      });
      if (data.success) {
        triggerSuccessModal('Contest Activated', 'The contest event is now active and visible to all participants.');
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setShowActivateConfirmModal(false);
      setActivateTargetId(null);
    }
  };

  const handleSaveEventJudges = async () => {
    if (!selectedEventForJudges) return;
    try {
      const data = await apiFetch(`/api/events/${selectedEventForJudges._id}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedJudges: selectedJudgesForEvent })
      });
      if (data.success) {
        triggerSuccessModal('Judges Updated', 'The assigned judges for this event have been updated successfully.');
        setShowAssignJudgesModal(false);
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
        triggerSuccessModal('Results Published', 'The contest results and winners have been published successfully.');
        setEventToPublish(null);
        fetchJudgesAndEvents();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportCSV = (reportType, eventId = '') => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const path = `${baseUrl}/api/reports/${reportType}${eventId ? '/' + eventId : ''}`;
    
    // Trigger download with headers
    fetch(path, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to export report: ${res.statusText}`);
        }
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(e => {
        console.error(e);
        alert(`Failed to export CSV: ${e.message}`);
      });
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
          onClick={() => {
            fetchEventHistory();
            setShowHistoryModal(true);
          }}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
        >
          <History size={14} />
          View Events History
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
                          onClick={() => setSelectedParticipant(p)}
                          className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 rounded-lg cursor-pointer"
                          title="Audit Profile Details"
                        >
                          <FileCheck size={14} />
                        </button>
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
                          onClick={() => {
                            setParticipantToDeleteId(p._id);
                            setParticipantToDeleteName(p.name);
                            setShowDeleteParticipantModal(true);
                          }}
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
                <option value="">All Audit Statuses</option>
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                value={photoDslrStatus}
                onChange={(e) => setPhotoDslrStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="">All DSLR Statuses</option>
                <option value="VERIFIED">Verified DSLR</option>
                <option value="MANUAL_REVIEW">Manual Review EXIF</option>
                <option value="REJECTED">Rejected Mobile</option>
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
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
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
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-2">
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
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">DSLR Validation</span>
                        {photo.dslrValidationStatus === 'VERIFIED' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Verified DSLR</span>
                        ) : photo.dslrValidationStatus === 'REJECTED' ? (
                          <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded font-bold">Rejected Mobile</span>
                        ) : (
                          <div>
                            <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded font-bold">Manual Review</span>
                            <span className="block text-[8px] text-slate-400 mt-0.5 line-clamp-1">{photo.validationReason}</span>
                          </div>
                        )}
                      </div>
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
                      <span className="text-[9px] text-slate-400">{j.email} • {j.city}</span>
                    </div>
                    <button
                      onClick={() => {
                        setJudgeToDeleteId(j._id);
                        setJudgeToDeleteName(j.name);
                        setShowDeleteJudgeModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                      title="Delete Judge permanently"
                    >
                      <Trash2 size={14} />
                    </button>
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
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                  Score Leaderboard & Results Declaration
                </h3>
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="Refresh Leaderboard & Progress"
                >
                  <RefreshCw size={12} className="shrink-0" />
                  Refresh
                </button>
              </div>

              <div className="flex flex-col gap-6 mt-4">
                {/* Select contest */}
                {events.map(e => {
                  // Calculate rank averages for this event specifically (only paid ones)
                  const eventPhotos = photographs.filter(p => p.eventId === e._id && p.paymentStatus === 'Paid');
                  const finalPhotos = eventPhotos.filter(p => p.isFinalSubmitted);
                  const gradedPhotos = eventPhotos.filter(p => p.scores && p.scores.length > 0);

                  // Sort graded photos by score (total or average)
                  gradedPhotos.sort((a, b) => b.averageScore - a.averageScore);

                  const assignedJudges = e.assignedJudges || [];
                  const totalRequiredReviews = finalPhotos.length * assignedJudges.length;
                  let completedReviews = 0;
                  finalPhotos.forEach(p => {
                    p.scores.forEach(s => {
                      if (assignedJudges.includes(s.judgeId)) {
                        completedReviews++;
                      }
                    });
                  });

                  const confirmedJudgesList = e.confirmedJudges || [];
                  const allConfirmed = assignedJudges.every(jId => confirmedJudgesList.includes(jId));
                  const approvalsPending = assignedJudges.length === 0 || completedReviews < totalRequiredReviews || !allConfirmed;

                  const pendingJudges = [];
                  if (approvalsPending && assignedJudges.length > 0) {
                    assignedJudges.forEach(jId => {
                      const judgeObj = judges.find(j => j._id === jId);
                      if (judgeObj) {
                        let gradedCount = 0;
                        finalPhotos.forEach(p => {
                          if (p.scores.some(s => s.judgeId === jId)) {
                            gradedCount++;
                          }
                        });
                        
                        const isConfirmed = confirmedJudgesList.includes(jId);
                        if (gradedCount < finalPhotos.length) {
                          pendingJudges.push({
                            name: judgeObj.name,
                            statusText: `${finalPhotos.length - gradedCount} left`
                          });
                        } else if (!isConfirmed) {
                          pendingJudges.push({
                            name: judgeObj.name,
                            statusText: 'Awaiting Confirmation'
                          });
                        }
                      }
                    });
                  }

                  return (
                    <div key={e._id} className="flex flex-col gap-4 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">{e.title}</h4>
                          <span className="text-[10px] text-slate-400">Deadline: {new Date(e.deadline).toLocaleDateString()}</span>
                        </div>
                        
                        {!e.winnersPublished ? (
                          <button
                            disabled={approvalsPending || finalPhotos.length === 0}
                            onClick={() => {
                              setEventToPublish(e);
                              // Seed top 3 photos from leaderboard
                              const updatedWinners = [...winnerAssignments];
                              for (let idx = 0; idx < 3; idx++) {
                                if (gradedPhotos[idx]) {
                                  updatedWinners[idx].submissionId = gradedPhotos[idx].submissionId;
                                  updatedWinners[idx].photoId = gradedPhotos[idx].photoId;
                                  updatedWinners[idx].photographId = gradedPhotos[idx].photoId;
                                  updatedWinners[idx].userName = gradedPhotos[idx].participantName;
                                  updatedWinners[idx].photoTitle = gradedPhotos[idx].title;
                                  updatedWinners[idx].fileUrl = gradedPhotos[idx].fileUrl;
                                  updatedWinners[idx].score = gradedPhotos[idx].averageScore;
                                }
                              }
                              setWinnerAssignments(updatedWinners);
                            }}
                            className={`font-bold text-xs py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
                              approvalsPending || finalPhotos.length === 0
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none dark:bg-slate-800"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                            }`}
                          >
                            Assign Winners & Publish
                          </button>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 px-3 py-1 rounded font-bold">Results Published</span>
                        )}
                      </div>

                      {/* Assigned Judges display */}
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2.5 rounded-xl text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Event Judges:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedJudges.length > 0 ? (
                              assignedJudges.map(jId => {
                                const judgeObj = judges.find(j => j._id === jId);
                                return (
                                  <span key={jId} className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-medium">
                                    {judgeObj ? judgeObj.name : 'Unknown Judge'}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-amber-600 italic">No judges assigned.</span>
                            )}
                          </div>
                        </div>
                        {e.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              setSelectedEventForJudges(e);
                              setSelectedJudgesForEvent(e.assignedJudges || []);
                              setShowAssignJudgesModal(true);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/40 text-[10px] py-1.5 px-2.5 rounded-lg cursor-pointer transition-all font-semibold"
                          >
                            Manage Event Judges
                          </button>
                        )}
                      </div>

                      {/* Grading and Approval Progress */}
                      <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-3 rounded-xl">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Grading Progress:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {completedReviews} / {totalRequiredReviews} Reviews Completed
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${approvalsPending ? 'bg-amber-500' : 'bg-emerald-600'}`}
                            style={{ width: `${totalRequiredReviews > 0 ? (completedReviews / totalRequiredReviews) * 100 : 0}%` }}
                          ></div>
                        </div>
                        {approvalsPending && (
                          <div className="flex flex-col gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={12} className="shrink-0" />
                              <span>
                                {assignedJudges.length === 0 
                                  ? 'Please assign judges to this event to begin grading.' 
                                  : `Approvals Pending: All assigned judges must grade all ${finalPhotos.length} entries before results can be published.`}
                              </span>
                            </div>
                            {pendingJudges.length > 0 && (
                              <div className="pl-4.5 text-[9px] text-slate-500 dark:text-slate-400 font-semibold italic">
                                Pending review from: {pendingJudges.map(pj => `${pj.name} (${pj.statusText})`).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                        {!approvalsPending && finalPhotos.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                            <Check size={12} className="shrink-0" />
                            <span>All judge approvals completed. Ready to publish results!</span>
                          </div>
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
                Setup New Contest (Saved as Draft)
              </h3>
              
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Contest Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    >
                      <option value="Photography">Photography</option>
                      <option value="Painting">Painting</option>
                      <option value="Drawing">Drawing</option>
                      <option value="Paper Craft">Paper Craft (Origami, Quilling, etc.)</option>
                      <option value="Other">Other (Custom Type)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    {eventType === 'Other' ? (
                      <>
                        <label className="text-xs text-slate-500 font-semibold">Custom Type Name</label>
                        <input
                          type="text"
                          value={customEventType}
                          onChange={(e) => setCustomEventType(e.target.value)}
                          placeholder="e.g. Sculpture"
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                          required
                        />
                      </>
                    ) : (
                      <div className="hidden md:block"></div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Login Page Background Image</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center px-3 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs cursor-pointer hover:border-indigo-600 transition-colors">
                        <span className="text-[11px] text-slate-500 truncate">
                          {uploadingBg ? 'Uploading...' : loginBgUrl ? 'Image Uploaded ✓' : 'Upload Image (PNG/JPG)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLoginBgUpload}
                          className="hidden"
                          disabled={uploadingBg}
                        />
                      </label>
                      {loginBgUrl && (
                        <button
                          type="button"
                          onClick={() => setLoginBgUrl('')}
                          className="text-[10px] text-red-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-1 gap-4">
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
                    <label className="text-xs text-slate-500 font-semibold">Theme & Description (Text relevant to the contest/event)</label>
                    <textarea
                      value={newEventTheme}
                      onChange={(e) => setNewEventTheme(e.target.value)}
                      placeholder="e.g. Rain and Shadows - Capture the transition of weather, dark cloud details, reflecting pools, and urban silhouettes during rainfall."
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-20 resize-none"
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
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Exhibition Venue</label>
                    <input
                      type="text"
                      value={newEventVenue}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      placeholder="e.g. Bal-Gandharv Art Gallery Pune"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasExhibition}
                      onChange={(e) => setHasExhibition(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    />
                    <span>Organizing physical exhibition at this venue?</span>
                  </label>
                  
                  {hasExhibition && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Exhibition Start Date (Optional)</label>
                        <input
                          type="date"
                          value={exhibitionFromDate}
                          onChange={(e) => setExhibitionFromDate(e.target.value)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Exhibition End Date (Optional)</label>
                        <input
                          type="date"
                          value={exhibitionToDate}
                          onChange={(e) => setExhibitionToDate(e.target.value)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-semibold">Contest Description</label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Enter descriptive details for the competition..."
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-16"
                    required
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <h4 className="font-display font-semibold text-slate-700 dark:text-slate-350 text-xs mb-2">Rewards & Prize Valuation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-medium">1st Prize Reward</label>
                      <input
                        type="text"
                        value={prize1Reward}
                        onChange={(e) => setPrize1Reward(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-medium">2nd Prize Reward</label>
                      <input
                        type="text"
                        value={prize2Reward}
                        onChange={(e) => setPrize2Reward(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-medium">3rd Prize Reward</label>
                      <input
                        type="text"
                        value={prize3Reward}
                        onChange={(e) => setPrize3Reward(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-display font-semibold text-slate-700 dark:text-slate-350 text-xs">Package Entry Fees (INR)</h4>
                    <button
                      type="button"
                      onClick={() => setNewEventPackages([...newEventPackages, { name: '', price: 0, maxPhotos: 1 }])}
                      className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      + Add Package
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {newEventPackages.map((pkg, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold">Package Name</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => {
                              const updated = [...newEventPackages];
                              updated[idx].name = e.target.value;
                              setNewEventPackages(updated);
                            }}
                            placeholder="e.g. Starter, Amateur"
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                            required
                          />
                        </div>
                        
                        <div className="w-24 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold">Price (₹)</label>
                          <input
                            type="number"
                            value={pkg.price || ''}
                            onChange={(e) => {
                              const updated = [...newEventPackages];
                              updated[idx].price = Number(e.target.value);
                              setNewEventPackages(updated);
                            }}
                            placeholder="Price"
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                            required
                          />
                        </div>

                        <div className="w-28 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold">Max Uploads</label>
                          <input
                            type="number"
                            value={pkg.maxPhotos || ''}
                            onChange={(e) => {
                              const updated = [...newEventPackages];
                              updated[idx].maxPhotos = Number(e.target.value);
                              setNewEventPackages(updated);
                            }}
                            placeholder="Max photos"
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                            required
                          />
                        </div>

                        {newEventPackages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newEventPackages.filter((_, pIdx) => pIdx !== idx);
                              setNewEventPackages(updated);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            title="Remove Package"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <label className="text-xs text-slate-500 font-semibold">Rules & Guidelines (One per line, auto-seeded)</label>
                  <textarea
                    value={newEventRules}
                    onChange={(e) => setNewEventRules(e.target.value)}
                    placeholder="Rules..."
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-24"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl self-start cursor-pointer shadow mt-2"
                >
                  Create Contest Draft
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
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        e.status === 'Active' 
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' 
                          : e.status === 'Draft' 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' 
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {e.status}
                      </span>
                      {e.status === 'Draft' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(e)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-3 rounded-lg cursor-pointer transition-all shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleActivateEvent(e._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1 px-3 rounded-lg cursor-pointer transition-all shadow-sm"
                          >
                            Activate
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEventToDeleteId(e._id);
                          setEventToDeleteTitle(e.title);
                          setShowDeleteEventModal(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                        title="Delete & Archive Contest"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deleted Contests Backups */}
            <div className="flex flex-col gap-4 mt-6">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Deleted Contest Backups & Archives</h3>
              <div className="flex flex-col gap-3">
                {backups.map(b => (
                  <div key={b._id} className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                      <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">{b.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Type: {b.eventType} • Deleted: {new Date(b.deletedAt || b.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadBackup(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Download PDF Backup
                      </button>
                      <button
                        onClick={() => handlePurgeBackup(b)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          b.downloaded 
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40' 
                            : 'bg-slate-100 text-slate-350 cursor-not-allowed dark:bg-slate-800 dark:text-slate-650'
                        }`}
                        disabled={!b.downloaded}
                        title={b.downloaded ? 'Permanently Purge from Database' : 'You must download the PDF backup before you can permanently purge this event'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {backups.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No deleted event archives or backups found.
                  </div>
                )}
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
                      onClick={() => {
                        setCatToDeleteId(c._id);
                        setCatToDeleteName(c.name);
                        setShowDeleteCatModal(true);
                      }}
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
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
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
                      <div>
                        <span>Dimensions:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.width && selectedPhoto.height ? `${selectedPhoto.width}x${selectedPhoto.height}` : 'N/A'}</p>
                      </div>
                      <div>
                        <span>Format:</span>
                        <p className="font-bold text-slate-700 dark:text-slate-250">{selectedPhoto.format || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">Cloudinary & Security</span>
                    <div className="text-[10px] text-slate-500 flex flex-col gap-1">
                      <p>Cloudinary ID: <span className="font-mono text-slate-700 dark:text-slate-350">{selectedPhoto.cloudinaryPublicId || 'N/A'}</span></p>
                      <p>Original File: <span className="font-mono text-slate-700 dark:text-slate-350">{selectedPhoto.originalFilename || 'N/A'}</span></p>
                      <p>DSLR Validation: 
                        <span className={`ml-1 font-bold ${
                          selectedPhoto.dslrValidationStatus === 'VERIFIED' 
                            ? 'text-emerald-500' 
                            : selectedPhoto.dslrValidationStatus === 'REJECTED' 
                              ? 'text-red-500' 
                              : 'text-amber-500'
                        }`}>
                          {selectedPhoto.dslrValidationStatus}
                        </span>
                      </p>
                      {selectedPhoto.validationReason && (
                        <p className="italic text-slate-400 mt-0.5">"{selectedPhoto.validationReason}"</p>
                      )}
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

      {/* PARTICIPANT DETAIL INSPECTOR MODAL */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">Photographer Profile Audit</h3>
                <p className="text-xs text-slate-400">Detailed account, payment and entry records for {selectedParticipant.name}</p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-full cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs">
              {/* Profile and Entry Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Account Details */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col gap-2">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px]">Account Profile</h4>
                  <div className="flex flex-col gap-1 text-slate-500">
                    <p>Name: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedParticipant.name}</span></p>
                    <p>Email: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.email}</span></p>
                    <p>Mobile: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.mobile}</span></p>
                    <p>City: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.city}</span></p>
                    <p>Registered: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(selectedParticipant.createdAt).toLocaleString()}</span></p>
                    <p>Last Login: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.lastLogin ? new Date(selectedParticipant.lastLogin).toLocaleString() : 'Never'}</span></p>
                  </div>
                </div>

                {/* 2. Entry details */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col gap-2">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px]">Contest Folder</h4>
                  <div className="flex flex-col gap-1 text-slate-500">
                    <p>Entry Number: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedParticipant.entryNumber}</span></p>
                    <p>Plan Selected: <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedParticipant.packageId === 'pkg-1' ? 'Starter (1 Photo)' : selectedParticipant.packageId === 'pkg-2' ? 'Amateur (2 Photos)' : selectedParticipant.packageId === 'pkg-3' ? 'Pro (5 Photos)' : 'None'}
                    </span></p>
                    <p>Entry Amount: <span className="font-semibold text-slate-700 dark:text-slate-300 font-bold text-slate-950 dark:text-white">₹{selectedParticipant.amount}</span></p>
                    <p>Slots Limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.photoLimit} photos</span></p>
                    <p>Uploaded Count: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.photosCount} photos</span></p>
                    <p>Remaining Slots: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.remainingSlots}</span></p>
                    <p>Entry Status: 
                      <span className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedParticipant.entryStatus === 'Finalized' 
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' 
                          : 'bg-slate-100 text-slate-650 dark:bg-slate-800'
                      }`}>
                        {selectedParticipant.entryStatus}
                      </span>
                    </p>
                  </div>
                </div>

                {/* 3. Payment Gateway Audits */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col gap-2">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px]">Razorpay Gateway Audit</h4>
                  <div className="flex flex-col gap-1 text-slate-500">
                    <p>Payment Status: 
                      <span className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedParticipant.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                          : selectedParticipant.paymentStatus === 'Pending' 
                            ? 'bg-amber-50 text-amber-650' 
                            : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                      }`}>
                        {selectedParticipant.paymentStatus}
                      </span>
                    </p>
                    <p>Razorpay Order ID: <span className="font-mono font-semibold text-slate-700 dark:text-slate-350 block truncate">{selectedParticipant.razorpayOrderId}</span></p>
                    <p>Razorpay Payment ID: <span className="font-mono font-semibold text-slate-700 dark:text-slate-350 block truncate">{selectedParticipant.razorpayPaymentId}</span></p>
                    <p>Payment Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParticipant.paymentDate ? new Date(selectedParticipant.paymentDate).toLocaleString() : 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Uploaded Photos Section */}
              <div>
                <h4 className="font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-3">Submitted Photographs ({selectedParticipant.photosCount})</h4>
                
                {selectedParticipant.photographs && selectedParticipant.photographs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedParticipant.photographs.map(photo => (
                      <div key={photo.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex gap-3 p-3">
                        <img 
                          src={photo.fileUrl} 
                          alt={photo.title}
                          className="w-24 h-24 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-800"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col gap-1 min-w-0">
                          <h5 className="font-bold text-slate-900 dark:text-white truncate">{photo.title}</h5>
                          <p className="text-[9px] text-slate-400">Filename: <span className="font-mono truncate block">{photo.originalFilename || 'N/A'}</span></p>
                          <p className="text-[9px] text-slate-500">Camera: <span className="font-semibold">{photo.cameraBrand} {photo.cameraModel}</span></p>
                          <p className="text-[9px] text-slate-500">Lens: <span className="font-semibold">{photo.lensUsed || 'N/A'}</span></p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              photo.status === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                : photo.status === 'Rejected' 
                                  ? 'bg-red-50 text-red-600' 
                                  : 'bg-slate-100 text-slate-500'
                            }`}>
                              Audit: {photo.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              photo.dslrValidationStatus === 'VERIFIED' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                : photo.dslrValidationStatus === 'REJECTED' 
                                  ? 'bg-red-50 text-red-600' 
                                  : 'bg-amber-50 text-amber-650'
                            }`}>
                              EXIF: {photo.dslrValidationStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 text-slate-450 italic">No photographs uploaded yet.</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-right">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Close Audit View
              </button>
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
                            updated[idx].photographId = photoId;
                            updated[idx].userName = photo ? photo.participantName : '';
                            updated[idx].photoTitle = photo ? photo.title : '';
                            updated[idx].fileUrl = photo ? photo.fileUrl : '';
                            updated[idx].score = photo ? photo.averageScore : 0;
                            setWinnerAssignments(updated);
                          }}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          required
                        >
                          <option value="">-- Choose Photograph --</option>
                          {photographs
                            .filter(p => p.status === 'Approved' && p.scores?.length > 0 && p.paymentStatus === 'Paid')
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

      {/* ASSIGN JUDGES TO EVENT MODAL */}
      {showAssignJudgesModal && selectedEventForJudges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Assign Judges to Event
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Selected judges will have access to see and grade all submissions for <strong>{selectedEventForJudges.title}</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {judges.map(j => {
                const isChecked = selectedJudgesForEvent.includes(j._id);
                return (
                  <label 
                    key={j._id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900' 
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJudgesForEvent([...selectedJudgesForEvent, j._id]);
                        } else {
                          setSelectedJudgesForEvent(selectedJudgesForEvent.filter(id => id !== j._id));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{j.name}</span>
                      <span className="text-[10px] text-slate-400">{j.email} • {j.city}</span>
                    </div>
                  </label>
                );
              })}
              {judges.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No judge accounts created yet. Please create judge accounts first.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAssignJudgesModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEventJudges}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl shadow transition-all cursor-pointer font-bold text-xs"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEST CREATION SUCCESS MODAL */}
      {showEventSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl mb-2">
                <Check size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Contest Draft Created
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The contest draft <strong>"{createdEventTitle}"</strong> has been successfully created. You can now assign judges to it or click "Activate" to publish it live for contestants.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowEventSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
            >
              Awesome, Understood
            </button>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                Edit Draft Contest
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contest Title</label>
                  <input
                    type="text"
                    value={editEventTitle}
                    onChange={(e) => setEditEventTitle(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contest Category Type</label>
                  <select
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 font-bold cursor-pointer"
                  >
                    <option value="Photography">Photography</option>
                    <option value="Painting">Painting</option>
                    <option value="Sculpting">Sculpting</option>
                    <option value="Writing">Writing</option>
                    <option value="Digital Art">Digital Art</option>
                    <option value="Other">Other (Custom Type)</option>
                  </select>
                </div>
              </div>

              {editEventType === 'Other' && (
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Custom Category Name</label>
                  <input
                    type="text"
                    value={editCustomEventType}
                    onChange={(e) => setEditCustomEventType(e.target.value)}
                    placeholder="e.g. Calligraphy"
                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contest Theme / Subtitle</label>
                  <input
                    type="text"
                    value={editEventTheme}
                    onChange={(e) => setEditEventTheme(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Submission Deadline</label>
                  <input
                    type="date"
                    value={editEventDeadline}
                    onChange={(e) => setEditEventDeadline(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Venue Location Address</label>
                <input
                  type="text"
                  value={editEventVenue}
                  onChange={(e) => setEditEventVenue(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Contest Description</label>
                <textarea
                  value={editEventDescription}
                  onChange={(e) => setEditEventDescription(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-20 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Rules & Guidelines (One per line)</label>
                <textarea
                  value={editEventRules}
                  onChange={(e) => setEditEventRules(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-24 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Exhibition Range */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHasExhibition}
                    onChange={(e) => setEditHasExhibition(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Is there an Exhibition scheduled at the Venue?</span>
                </label>

                {editHasExhibition && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-500">Exhibition Start Date</span>
                      <input
                        type="date"
                        value={editExhibitionFromDate}
                        onChange={(e) => setEditExhibitionFromDate(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-500">Exhibition End Date</span>
                      <input
                        type="date"
                        value={editExhibitionToDate}
                        onChange={(e) => setEditExhibitionToDate(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Prizes Rewards */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="font-bold text-slate-850 dark:text-white">Prizes & Awards Configuration</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">1st Prize Reward</span>
                    <input
                      type="text"
                      value={editPrize1Reward}
                      onChange={(e) => setEditPrize1Reward(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">2nd Prize Reward</span>
                    <input
                      type="text"
                      value={editPrize2Reward}
                      onChange={(e) => setEditPrize2Reward(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">3rd Prize Reward</span>
                    <input
                      type="text"
                      value={editPrize3Reward}
                      onChange={(e) => setEditPrize3Reward(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Packages config */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-850 dark:text-white">Submission Entry Packages Fees</span>
                  <button
                    type="button"
                    onClick={() => setEditEventPackages([...editEventPackages, { name: '', price: 0, maxPhotos: 1 }])}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    + Add Package
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {editEventPackages.map((pkg, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                      
                      <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Package Name</label>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => {
                            const newPkgs = [...editEventPackages];
                            newPkgs[idx].name = e.target.value;
                            setEditEventPackages(newPkgs);
                          }}
                          placeholder="e.g. Starter, Amateur"
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
                          required
                        />
                      </div>
                      
                      <div className="w-24 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Price (₹)</label>
                        <input
                          type="number"
                          value={pkg.price || ''}
                          onChange={(e) => {
                            const newPkgs = [...editEventPackages];
                            newPkgs[idx].price = Number(e.target.value);
                            setEditEventPackages(newPkgs);
                          }}
                          placeholder="Price"
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          required
                        />
                      </div>

                      <div className="w-28 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-semibold">Max Uploads</label>
                        <input
                          type="number"
                          value={pkg.maxPhotos || ''}
                          onChange={(e) => {
                            const newPkgs = [...editEventPackages];
                            newPkgs[idx].maxPhotos = Number(e.target.value);
                            setEditEventPackages(newPkgs);
                          }}
                          placeholder="Max photos"
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          required
                        />
                      </div>

                      {editEventPackages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPkgs = editEventPackages.filter((_, pIdx) => pIdx !== idx);
                            setEditEventPackages(newPkgs);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                          title="Remove Package"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVATE CONTEST CONFIRMATION MODAL */}
      {showActivateConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-2xl mb-2 animate-bounce">
                <Sparkles size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Activate Contest
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to activate this contest? This will make it visible to all participants on the home page and enable registrations.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowActivateConfirmModal(false);
                  setActivateTargetId(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeActivateEvent}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Yes, Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT PURGE CONFIRMATION MODAL */}
      {showPurgeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Permanent Purge Warning
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you absolutely sure you want to PERMANENTLY PURGE <strong>"{purgeBackupTarget?.title}"</strong>? This will delete all submissions, payments, uploaded photographs, and judges evaluations from the database forever. This action CANNOT be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeConfirmModal(false);
                  setPurgeBackupTarget(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executePurgeBackup}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Yes, Purge Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {showDeleteEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Delete Contest Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete the event <strong>"{eventToDeleteTitle}"</strong>? This will permanently delete the event record, rules, and winner lists. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteEventModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteEvent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Delete Contest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {showDeleteCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Delete Category Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete the category <strong>"{catToDeleteName}"</strong>? This will permanently delete the category. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteCatModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PARTICIPANT CONFIRMATION MODAL */}
      {showDeleteParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Delete Participant Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete the participant <strong>"{participantToDeleteName}"</strong>? This deletes their account and all uploaded submissions permanently. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteParticipantModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteParticipant}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Delete Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE JUDGE CONFIRMATION MODAL */}
      {showDeleteJudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl mb-2 animate-bounce">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Delete Judge Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete the judge <strong>"{judgeToDeleteName}"</strong>? This will permanently delete their account. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteJudgeModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteJudge}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Delete Judge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT HISTORY LEDGER MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                    Contest Ledger & Events History
                  </h3>
                  <p className="text-[10px] text-slate-400">Complete historical financial audits, judges sign-off status, and winner lists</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-hidden flex flex-col md:flex-row min-h-0">
              
              {/* Left Column: Events List */}
              <div className="w-full md:w-1/3 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search contests by name..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-indigo-600" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Loading history data...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {eventHistory
                      .filter(e => e.title.toLowerCase().includes(historySearch.toLowerCase()))
                      .map(e => (
                        <div
                          key={e.id}
                          onClick={() => setActiveHistoryEvent(e)}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all text-xs ${
                            activeHistoryEvent?.id === e.id
                              ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                              : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                              {e.title}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                              e.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                              e.status === 'Closed' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                              e.status === 'Active' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {e.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2">
                            <span>Deadline: {new Date(e.deadline).toLocaleDateString()}</span>
                            <span>Created: {new Date(e.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}

                    {eventHistory.length === 0 && (
                      <div className="text-center text-slate-400 py-12 text-xs">No contests found.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Detail View */}
              <div className="flex-grow overflow-y-auto p-6 bg-white dark:bg-slate-900">
                {activeHistoryEvent ? (
                  <div className="flex flex-col gap-6">
                    {/* Event Title & status */}
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                          {activeHistoryEvent.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Theme: {activeHistoryEvent.theme}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                          activeHistoryEvent.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                          activeHistoryEvent.status === 'Closed' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                          activeHistoryEvent.status === 'Active' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {activeHistoryEvent.status}
                        </span>
                        <button
                          onClick={() => {
                            setEventToDeleteId(activeHistoryEvent.id);
                            setEventToDeleteTitle(activeHistoryEvent.title);
                            setShowDeleteEventModal(true);
                            setShowHistoryModal(false);
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 rounded-lg cursor-pointer transition-colors"
                          title="Archive & Delete Contest"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Quick stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Participants</span>
                        <span className="text-lg font-black text-slate-950 dark:text-white mt-0.5 block">
                          {activeHistoryEvent.participantsCount}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Photos</span>
                        <span className="text-lg font-black text-slate-950 dark:text-white mt-0.5 block">
                          {activeHistoryEvent.totalPhotos}
                        </span>
                        <span className="text-[8px] text-slate-400 mt-0.5 block">
                          {activeHistoryEvent.approvedPhotos} Approved • {activeHistoryEvent.rejectedPhotos} Rejected
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Payments</span>
                        <span className="text-lg font-black text-slate-950 dark:text-white mt-0.5 block">
                          {activeHistoryEvent.totalPaymentsCount}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl text-center">
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold block uppercase tracking-wider">Total Revenue</span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block font-display">
                          ₹{activeHistoryEvent.totalRevenue?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Winners section */}
                    <div>
                      <h5 className="font-display font-extrabold text-slate-900 dark:text-white text-[11px] mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                        <Award size={13} className="text-indigo-600" />
                        Winners Circle
                      </h5>
                      {activeHistoryEvent.winnersPublished && activeHistoryEvent.winners?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {activeHistoryEvent.winners.map((win, index) => (
                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col gap-1.5">
                              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">{win.rank}</span>
                              <p className="font-bold text-[11px] text-slate-900 dark:text-white line-clamp-1">{win.photoTitle || 'Untitled'}</p>
                              <div className="text-[9px] text-slate-400 flex flex-col gap-0.5">
                                <span>By: {win.userName}</span>
                                <span>Reward: {win.reward}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">Grade: {win.score}/10</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                          Winners rankings have not been declared/published for this contest yet.
                        </div>
                      )}
                    </div>

                    {/* Judges Section */}
                    <div>
                      <h5 className="font-display font-extrabold text-slate-900 dark:text-white text-[11px] mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                        <Users size={13} className="text-indigo-600" />
                        Evaluation Judges Panel
                      </h5>
                      {activeHistoryEvent.judgeDetails?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeHistoryEvent.judgeDetails.map((j) => (
                            <div key={j.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-[11px] text-slate-900 dark:text-white">{j.name}</p>
                                <p className="text-[9px] text-slate-400">{j.email} • {j.city}</p>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                j.hasConfirmed 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}>
                                {j.hasConfirmed ? 'Signed Off' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                          No judges assigned to this event.
                        </div>
                      )}
                    </div>

                    {/* Split lists: Participants vs Payments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Participants List */}
                      <div>
                        <h5 className="font-display font-extrabold text-slate-900 dark:text-white text-[11px] mb-3 uppercase tracking-wide">
                          Contestants ({activeHistoryEvent.participantDetails?.length || 0})
                        </h5>
                        <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
                          {activeHistoryEvent.participantDetails?.map((p) => (
                            <div key={p.userId} className="p-2.5 flex justify-between items-center text-[10px] bg-slate-50/50 dark:bg-slate-950/30">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-[9px] text-slate-400">{p.email}</p>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                p.isFinalSubmitted 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {p.isFinalSubmitted ? 'Finalized' : 'Draft'}
                              </span>
                            </div>
                          ))}
                          {(!activeHistoryEvent.participantDetails || activeHistoryEvent.participantDetails.length === 0) && (
                            <div className="text-[10px] text-slate-400 p-6 text-center">No participants registered yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Payments List */}
                      <div>
                        <h5 className="font-display font-extrabold text-slate-900 dark:text-white text-[11px] mb-3 uppercase tracking-wide">
                          Revenue Transactions ({activeHistoryEvent.paymentDetails?.length || 0})
                        </h5>
                        <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
                          {activeHistoryEvent.paymentDetails?.map((pay, pIdx) => (
                            <div key={pIdx} className="p-2.5 text-[10px] bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-start">
                              <div>
                                <p className="font-bold text-slate-950 dark:text-white">{pay.userName}</p>
                                <p className="text-[8px] text-slate-400 font-mono mt-0.5">TXN: {pay.transactionId}</p>
                                <p className="text-[8px] text-slate-400 mt-0.5">Date: {new Date(pay.paymentDate).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 font-display block">
                                  ₹{pay.amount}
                                </span>
                                <span className="text-[8px] text-slate-400 mt-0.5 block">{pay.packageName}</span>
                              </div>
                            </div>
                          ))}
                          {(!activeHistoryEvent.paymentDetails || activeHistoryEvent.paymentDetails.length === 0) && (
                            <div className="text-[10px] text-slate-400 p-6 text-center">No payment transactions processed yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                    <History size={36} className="text-slate-300 mb-2 animate-pulse" />
                    <p className="text-xs font-semibold">Select a contest from the left to view complete history details.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* GENERAL SUCCESS MESSAGE MODAL */}
      {showGeneralSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl mb-2">
                <Check size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                {generalSuccessTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {generalSuccessMsg}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGeneralSuccessModal(false)}
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
