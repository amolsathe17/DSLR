import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useEvent } from "../context/EventContext";
import ExifReader from "exifreader";
import confetti from "canvas-confetti";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = data.payload.total || 1;
    const count = data.value;
    const pct = Math.round((count / total) * 100);
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900 text-white border border-slate-700/80 px-3 py-2 rounded-xl shadow-2xl text-xs backdrop-blur-md z-50 pointer-events-none">
        <div className="flex items-center gap-2 font-bold">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload.fill || data.color || '#6366f1' }} />
          <span>{data.name}</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-300 font-semibold pl-4">
          <span className="text-white font-extrabold">{count}</span> {count === 1 ? 'photo' : 'photos'} ({pct}%)
        </div>
      </div>
    );
  }
  return null;
};
import {
  Camera,
  CheckCircle,
  FileCheck,
  CreditCard,
  Download,
  AlertTriangle,
  Award,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ChevronDown,
  ChevronUp,
  Printer,
  Trophy,
  Eye,
  RotateCcw,
  History,
  FileText,
  Hash,
} from "lucide-react";
import DragDropUpload from "../components/DragDropUpload";
import WatermarkPreview from "../components/WatermarkPreview";
import QRInvoice from "../components/QRInvoice";
import Certificate from "../components/Certificate";
import { getBackendUrl, getApiBaseUrl } from "../utils/url";

export default function Dashboard() {
  const { apiFetch, user, token, refreshUser } = useAuth();
  const { allEvents: globalEvents } = useEvent();

  const COMMON_LABELS = [
    "Designer / Brand",
    "Garment Type",
    "Fabric / Material",
    "Color Palette",
    "Accessories Used",
    "Footwear",
    "Theme / Collection",
    "Runway / Venue"
  ];

  const [contestTypes, setContestTypes] = useState([]);

  const getActiveCustomLabels = (catObj) => {
    if (catObj && Array.isArray(catObj.customLabels) && catObj.customLabels.length > 0) {
      return catObj.customLabels;
    }
    if (Array.isArray(categories) && categories.length > 0) {
      const catWithLabels = categories.find(c => Array.isArray(c.customLabels) && c.customLabels.length > 0);
      if (catWithLabels && catWithLabels.customLabels.length > 0) return catWithLabels.customLabels;
    }
    if (Array.isArray(contestTypes) && contestTypes.length > 0) {
      const currentTypeName = (selectedTypeTab || (event && event.eventType) || '').toLowerCase();
      const matchedCt = contestTypes.find(ct => (ct.name || '').toLowerCase() === currentTypeName);
      if (matchedCt && Array.isArray(matchedCt.customLabels) && matchedCt.customLabels.length > 0) {
        return matchedCt.customLabels;
      }
    }
    return [];
  };

  const [dashboardTab, setDashboardTab] = useState("entries");
  const [confirmModal, setConfirmModal] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [event, setEvent] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedTypeTab, setSelectedTypeTab] = useState('Photography');
  const [historySelectedEventId, setHistorySelectedEventId] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handlePrintCertificate = (pdfUrl) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = getBackendUrl(pdfUrl);
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  };
  const [uploading, setUploading] = useState(false);

  // Form states for photo details
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cameraBrand, setCameraBrand] = useState("");
  const [cameraModel, setCameraModel] = useState("");
  const [lensUsed, setLensUsed] = useState("");
  const [location, setLocation] = useState("");
  const [dateCaptured, setDateCaptured] = useState("");
  const [description, setDescription] = useState("");

  // Edit Photo Modal states
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCameraBrand, setEditCameraBrand] = useState("");
  const [editCameraModel, setEditCameraModel] = useState("");
  const [editLensUsed, setEditLensUsed] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDateCaptured, setEditDateCaptured] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Dynamic Custom Fields state
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [editCustomFieldValues, setEditCustomFieldValues] = useState({});

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showQRInvoice, setShowQRInvoice] = useState(null);

  // Certificate Modal State
  const [showCertificate, setShowCertificate] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [certAlertMsg, setCertAlertMsg] = useState(null);

  const handleShowCertificateAlert = (type) => {
    setCertAlertMsg(
      `This is a preview of your ${type === 'Champion' ? 'Champion' : 'Participation'} Certificate. The official printed certificate can only be collected from the event office or the designated exhibition/gallery after the competition. Digital download is not available.`
    );
  };

  // Package & Declaration selection
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);
  const [expandedActiveEvents, setExpandedActiveEvents] = useState({});
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [loadingEventWorkspace, setLoadingEventWorkspace] = useState(false);

  const toggleActiveEvent = async (e) => {
    const isExpanding = !expandedActiveEvents[e._id];
    setExpandedActiveEvents({
      [e._id]: isExpanding
    });
    
    if (isExpanding) {
      setLoadingEventWorkspace(true);
      setEvent(e);
      try {
        const categoryData = await apiFetch(`/api/categories?contestType=${encodeURIComponent(e.eventType || '')}`);
        if (categoryData.success) {
          setCategories(categoryData.categories);
          if (categoryData.categories.length > 0) {
            setCategory("");
          }
        }
        const subData = await apiFetch(`/api/submissions/my-submission/${e._id}`);
        if (subData.success) {
          setSubmission(subData.submission);
        } else {
          setSubmission(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEventWorkspace(false);
      }
    } else {
      setEvent(null);
      setSubmission(null);
    }
  };

  const fetchDashboardData = async (selectedTab = selectedTypeTab) => {
    try {
      // 1. Fetch active event matching selected category tab
      const eventData = await apiFetch("/api/events");
      let activeEvent = null;
      if (eventData.success && eventData.events.length > 0) {
        setEventsList(eventData.events);
        const activeEvents = eventData.events.filter((e) => e.status === "Active");
        if (activeEvents.length > 0) {
          const ae = activeEvents[0];
          setExpandedActiveEvents((prev) => {
            if (Object.keys(prev).length === 0) {
              return { [ae._id]: true };
            }
            return prev;
          });
          activeEvent = ae;
          setEvent(ae);
          setSelectedPkgId(ae.packages[0].id);
        } else {
          setSubmission(null);
        }
      }

      // 2. Fetch categories filtered by this event's type and all contest types
      const categoryData = await apiFetch(`/api/categories?contestType=${encodeURIComponent(activeEvent?.eventType || activeType || '')}`);
      if (categoryData.success) {
        setCategories(categoryData.categories);
        if (categoryData.categories.length > 0) {
          setCategory("");
        }
      }

      try {
        const ctData = await apiFetch('/api/contest-types');
        if (ctData.success) {
          setContestTypes(ctData.contestTypes);
        }
      } catch (ctErr) {
        console.error("Error fetching contest types:", ctErr);
      }

      // 3. Fetch user's submission for this event
      if (activeEvent) {
        const subData = await apiFetch(
          `/api/submissions/my-submission/${activeEvent._id}`,
        );
        if (subData.success) {
          setSubmission(subData.submission);
        } else {
          setSubmission(null);
        }
      }

      // 4. Fetch all submissions for the participant (to populate history & overview stats)
      const allSubsData = await apiFetch("/api/submissions/my-submissions");
      if (allSubsData.success) {
        setAllSubmissions(allSubsData.submissions);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const autoSelectActiveTab = async () => {
      try {
        const eventData = await apiFetch("/api/events");
        if (eventData.success && eventData.events.length > 0) {
          const activeEvent = eventData.events.find((e) => e.status === "Active");
          if (activeEvent) {
            setSelectedTypeTab(activeEvent.eventType);
          }
        }
      } catch (err) {
        console.error("Auto select active tab failed:", err);
      }
    };
    autoSelectActiveTab();
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedTypeTab);
  }, [selectedTypeTab]);

  useEffect(() => {
    const selectedCat = categories.find(c => c.name === category) || categories.find(c => c.customLabels && c.customLabels.length > 0) || (categories.length > 0 ? categories[0] : null);
    const labels = getActiveCustomLabels(selectedCat);
    if (labels && labels.length > 0) {
      const initialVals = { ...customFieldValues };
      labels.forEach(l => {
        if (initialVals[l] === undefined) {
          initialVals[l] = '';
        }
      });
      setCustomFieldValues(initialVals);
    }
  }, [category, categories, contestTypes, selectedTypeTab, event]);

  useEffect(() => {
    if (editCategory || categories.length > 0) {
      const selectedCat = categories.find(c => c.name === editCategory) || (categories.length > 0 ? categories[0] : null);
      const labels = getActiveCustomLabels(selectedCat);
      if (labels && labels.length > 0) {
        const updatedVals = { ...editCustomFieldValues };
        
        Object.keys(updatedVals).forEach(key => {
          if (!labels.includes(key)) {
            delete updatedVals[key];
          }
        });

        labels.forEach(l => {
          if (updatedVals[l] === undefined) {
            const existingField = editingPhoto?.customFields?.find(f => f.label === l);
            updatedVals[l] = existingField ? existingField.value : '';
          }
        });
        setEditCustomFieldValues(updatedVals);
      } else {
        setEditCustomFieldValues({});
      }
    } else {
      setEditCustomFieldValues({});
    }
  }, [editCategory, categories, contestTypes, editingPhoto]);

  const handleStartSubmission = async (e) => {
    e.preventDefault();
    if (!acceptedDeclaration) {
      setError("You must accept the DSLR Eligibility Declaration to proceed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/submissions/start", {
        method: "POST",
        body: JSON.stringify({
          eventId: event._id,
          packageId: selectedPkgId,
          eligibilityAccepted: true,
        }),
      });

      if (data.success) {
        setSubmission(data.submission);
        const allSubsData = await apiFetch("/api/submissions/my-submissions");
        if (allSubsData.success) {
          setAllSubmissions(allSubsData.submissions);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // EXIF Extraction
  const handleFileAnalyze = async (file) => {
    try {
      const tags = await ExifReader.load(file);

      const make = tags["Make"]?.description || "";
      const model = tags["Model"]?.description || "";
      const lens =
        tags["LensModel"]?.description || tags["Lens"]?.description || "";

      let date = "";
      if (tags["DateTimeOriginal"]?.description) {
        // Standard EXIF dates format is "YYYY:MM:DD HH:MM:SS" -> convert to YYYY-MM-DD
        const dateStr = tags["DateTimeOriginal"].description.split(" ")[0];
        date = dateStr.replace(/:/g, "-");
      }

      setCameraBrand(make);
      setCameraModel(model);
      setLensUsed(lens);
      if (date) setDateCaptured(date);
    } catch (e) {
      console.warn("No EXIF metadata found or could not be read:", e.message);
    }
  };

  const handleUploadPhoto = async (photoFile, rawFile) => {
    if (photoFile && photoFile.size > 800 * 1024) {
      setError("Photograph file size must be below 800 KB.");
      return;
    }
    if (!title || !title.trim()) {
      setError("Photo Title is mandatory. Please enter a title for your photograph.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("eventId", event._id);
      formData.append("title", title.trim());
      formData.append("category", category || "General");
      formData.append("cameraBrand", cameraBrand || "");
      formData.append("cameraModel", cameraModel || "");
      formData.append("lensUsed", lensUsed || "");
      formData.append("location", location || "");
      formData.append("dateCaptured", dateCaptured || "");
      formData.append("description", description || "");

      const customFieldsArr = Object.entries(customFieldValues).map(([lbl, val]) => ({
        label: lbl,
        value: val
      }));
      formData.append("customFields", JSON.stringify(customFieldsArr));

      formData.append("photoFile", photoFile);

      if (rawFile) {
        formData.append("rawFile", rawFile);
      }

      const API_URL = getApiBaseUrl();

      console.log("VITE_API_URL:", API_URL);
      console.log("Upload API URL:", API_URL);

      const response = await fetch(`${API_URL}/api/submissions/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await response.text();

      console.log("Upload status:", response.status);
      console.log("Upload response:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}): ${responseText.substring(0, 150)}`,
        );
      }

      if (!response.ok) {
        throw new Error(data.message || `Upload failed (${response.status})`);
      }

      if (data.success) {
        setSubmission(data.submission);
        const allSubsData = await apiFetch("/api/submissions/my-submissions");
        if (allSubsData.success) {
          setAllSubmissions(allSubsData.submissions);
        }

        setTitle("");
        setCameraBrand("");
        setCameraModel("");
        setLensUsed("");
        setLocation("");
        setDateCaptured("");
        setDescription("");

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error("Photo upload error:", err);

      setError(err.message);

      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId) => {
    setConfirmModal({
      message: "Are you sure you want to remove this photograph from your entry?",
      onConfirm: async () => {
        setError("");
        try {
          const data = await apiFetch(
            `/api/submissions/photo/${event._id}/${photoId}`,
            {
              method: "DELETE",
            },
          );
          if (data.success) {
            setSubmission(data.submission);
            const allSubsData = await apiFetch("/api/submissions/my-submissions");
            if (allSubsData.success) {
              setAllSubmissions(allSubsData.submissions);
            }
          }
        } catch (err) {
          setError(err.message);
        }
      }
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentCleanup = async () => {
    try {
      const data = await apiFetch("/api/submissions/payment-failed", {
        method: "POST",
        body: JSON.stringify({ eventId: event._id })
      });
      if (data.success) {
        setSubmission(data.submission);
      }
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  };

  // Real Razorpay Payment Checkout
  const handlePayment = async () => {
    setLoading(true);
    setError("");
    setShowPaymentModal(false);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please verify your internet connection.");
      }

      const data = await apiFetch("/api/payments/pay", {
        method: "POST",
        body: JSON.stringify({
          eventId: event._id,
          packageId: submission.packageId,
        }),
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to create payment order.");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "DSLR Contest Portal",
        description: "Contest Package Registration Fee",
        order_id: data.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyData = await apiFetch("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyData.success) {
              setSubmission(verifyData.submission);
              setPaymentSuccess(verifyData.submission);
              confetti({ particleCount: 150, spread: 80, duration: 3000 });
              
              // Refresh submission state
              const subData = await apiFetch(
                `/api/submissions/my-submission/${event._id}`,
              );
              if (subData.success) {
                setSubmission(subData.submission);
              }
              const allSubsData = await apiFetch("/api/submissions/my-submissions");
              if (allSubsData.success) {
                setAllSubmissions(allSubsData.submissions);
              }
            } else {
              setError(verifyData.message || "Payment verification failed.");
              await handlePaymentCleanup();
            }
          } catch (verifyErr) {
            setError(verifyErr.message);
            await handlePaymentCleanup();
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: async function () {
            setLoading(false);
            await handlePaymentCleanup();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEditPhotoClick = (photo) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title || "");
    setEditCategory(photo.category || "");
    setEditCameraBrand(photo.cameraBrand || "");
    setEditCameraModel(photo.cameraModel || "");
    setEditLensUsed(photo.lensUsed || "");
    setEditLocation(photo.location || "");
    setEditDescription(photo.description || "");

    const initialVals = {};
    if (photo.customFields && photo.customFields.length > 0) {
      photo.customFields.forEach(cf => {
        initialVals[cf.label] = cf.value;
      });
    }
    setEditCustomFieldValues(initialVals);
    if (photo.dateCaptured) {
      try {
        const d = new Date(photo.dateCaptured);
        if (!isNaN(d.getTime())) {
          setEditDateCaptured(d.toISOString().substring(0, 10));
        } else {
          setEditDateCaptured("");
        }
      } catch {
        setEditDateCaptured("");
      }
    } else {
      setEditDateCaptured("");
    }
  };

  const handleUpdatePhoto = async (e) => {
    e.preventDefault();
    if (!editingPhoto) return;

    if (!editTitle || !editTitle.trim()) {
      setError("Photo Title is mandatory. Please enter a title for your photograph.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const customFieldsArr = Object.entries(editCustomFieldValues).map(([lbl, val]) => ({
        label: lbl,
        value: val
      }));

      const data = await apiFetch(`/api/submissions/photographs/${editingPhoto.id}`, {
        method: "PUT",
        body: JSON.stringify({
          eventId: event._id,
          title: editTitle.trim(),
          category: editCategory,
          cameraBrand: editCameraBrand,
          cameraModel: editCameraModel,
          lensUsed: editLensUsed,
          location: editLocation,
          dateCaptured: editDateCaptured,
          description: editDescription,
          customFields: customFieldsArr
        }),
      });

      if (data.success) {
        setSubmission(data.submission);
        setEditingPhoto(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Dummy Simulated Payment Bypass
  const handleDummyPayment = async () => {
    setLoading(true);
    setError("");
    setShowPaymentModal(false);

    try {
      const data = await apiFetch("/api/payments/dummy-bypass", {
        method: "POST",
        body: JSON.stringify({
          eventId: event._id,
          packageId: submission.packageId,
        }),
      });

      if (data.success) {
        setSubmission(data.submission);
        setPaymentSuccess(data.submission);
        confetti({ particleCount: 150, spread: 80, duration: 3000 });

        // Refresh submission state
        const subData = await apiFetch(
          `/api/submissions/my-submission/${event._id}`,
        );
        if (subData.success) {
          setSubmission(subData.submission);
        }
        const allSubsData = await apiFetch("/api/submissions/my-submissions");
        if (allSubsData.success) {
          setAllSubmissions(allSubsData.submissions);
        }
      } else {
        throw new Error(data.message || "Simulated payment failed.");
      }
    } catch (err) {
      setError(err.message);
      await handlePaymentCleanup();
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    setShowFinalSubmitModal(true);
  };

  const executeFinalSubmit = async () => {
    setShowFinalSubmitModal(false);
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/submissions/final-submit", {
        method: "POST",
        body: JSON.stringify({ eventId: event._id }),
      });

      if (data.success) {
        setSubmission(data.submission);
        confetti({ particleCount: 200, spread: 100, duration: 4000 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = (subId) => {
    setConfirmModal({
      message: "Are you sure you want to withdraw your entry folder from this contest? All uploaded photographs will be withdrawn, and a refund request will be registered with the administrator.",
      isAlert: false,
      onConfirm: () => executeWithdrawal(subId)
    });
  };

  const executeWithdrawal = async (subId) => {
    setConfirmModal(null);
    setLoading(true);
    try {
      const res = await apiFetch(`/api/submissions/withdraw/${subId}`, {
        method: 'POST'
      });
      if (res.success) {
        // Refresh local dashboard data
        await fetchDashboardData();
        // Refresh profile notifications
        if (refreshUser) await refreshUser();
        // Show success alert
        setConfirmModal({
          message: "refund request send successfully",
          isAlert: true
        });
      }
    } catch (err) {
      console.error(err);
      setConfirmModal({
        message: err.message || 'Failed to withdraw submission folder.',
        isAlert: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submission && !event) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Camera className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Loading Dashboard...
        </span>
      </div>
    );
  }

  const selectedPackage = event?.packages.find(
    (p) => p.id === submission?.packageId,
  );
  const isPaid = !!submission?.paymentId && submission?.paymentStatus !== 'Refunded';
  const isFinalized = !!submission?.isFinalSubmitted || user?.isSuspended;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-8 sm:px-6 sm:pt-5 lg:px-8 text-slate-800 dark:text-slate-200">
      
      {/* Dashboard Sub-navigation Tabs */}
      <div className="w-full overflow-x-auto mb-3">
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 min-w-max overflow-x-auto gap-1">
          <button
            onClick={() => setDashboardTab("overview")}
            className={`shrink-0 whitespace-nowrap text-center py-2 px-4 sm:px-6 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              dashboardTab === "overview"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setDashboardTab("entries")}
            className={`shrink-0 whitespace-nowrap text-center py-2 px-4 sm:px-6 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              dashboardTab === "entries"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            My Entries
          </button>
          <button
            onClick={() => setDashboardTab("certificates")}
            className={`shrink-0 whitespace-nowrap text-center py-2 px-4 sm:px-6 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              dashboardTab === "certificates"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Digital Certificates
          </button>
          <button
            onClick={() => setDashboardTab("event_history")}
            className={`shrink-0 whitespace-nowrap text-center py-2 px-4 sm:px-6 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              dashboardTab === "event_history"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Event History
          </button>
        </div>
      </div>

      {dashboardTab === "overview" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Welcome profile header */}
          <div className="bg-linear-to-r from-indigo-900/10 via-indigo-950/5 to-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest">
                Participant Dashboard
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Welcome back, {user?.name || "Participant"}!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your contest submissions, track payment invoices, view performance stats, and download certificates.
              </p>
            </div>
            
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Registered Contests */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-xs transition-all hover:shadow-sm">
              <span className="text-[10px] text-indigo-900/70 dark:text-indigo-300 font-extrabold uppercase tracking-wider">Registered Contests</span>
              <h3 className="font-display font-extrabold text-2xl text-indigo-600 dark:text-indigo-400">{allSubmissions.length}</h3>
              <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-medium">Total events registered</span>
            </div>
            
            {/* Card 2: Total Uploads */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-xs transition-all hover:shadow-sm">
              <span className="text-[10px] text-emerald-900/70 dark:text-emerald-300 font-extrabold uppercase tracking-wider">Total Uploads</span>
              <h3 className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                {allSubmissions.reduce((acc, s) => acc + (s.photographs || []).length, 0)}
              </h3>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">DSLR verified submissions</span>
            </div>

            {/* Card 3: Fees Paid */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-xs transition-all hover:shadow-sm">
              <span className="text-[10px] text-amber-900/70 dark:text-amber-300 font-extrabold uppercase tracking-wider">Fees Paid</span>
              <h3 className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-500">
                INR {allSubmissions.reduce((acc, s) => acc + (s.paymentStatus === 'Paid' ? s.amount : 0), 0)}
              </h3>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">Successful payments</span>
            </div>

            {/* Card 4: Account Status */}
            <div className={`${
              user?.isSuspended
                ? 'bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40'
                : 'bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40'
            } rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-xs transition-all hover:shadow-sm`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                user?.isSuspended ? 'text-red-900/70 dark:text-red-300' : 'text-teal-900/70 dark:text-teal-300'
              }`}>Account Status</span>
              <h3 className={`font-display font-extrabold text-lg flex items-center gap-1.5 mt-1 ${
                user?.isSuspended ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'
              }`}>
                {user?.isSuspended ? 'Suspended' : 'Active'}
              </h3>
              <span className={`text-[10px] font-medium ${
                user?.isSuspended ? 'text-red-600/70 dark:text-red-400/70' : 'text-teal-600/70 dark:text-teal-400/70'
              }`}>Participant privileges</span>
            </div>
          </div>

          {/* 4 Overview Cards Row */}
          {allSubmissions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Card 1: Donut Chart for Submission Status */}
              {(() => {
                const photosList = allSubmissions.reduce((acc, s) => [...acc, ...(s.photographs || [])], []);
                const totalPhotos = photosList.length;
                const approvedCount = photosList.filter(p => p.status === 'Approved').length;
                const rejectedCount = photosList.filter(p => p.status === 'Rejected' || p.status === 'Disapproved').length;
                const pendingCount = totalPhotos - approvedCount - rejectedCount;

                const statusData = [
                  { name: 'Approved', value: approvedCount, color: '#10B981', total: totalPhotos },
                  { name: 'Pending', value: pendingCount, color: '#F59E0B', total: totalPhotos },
                  { name: 'Disapproved', value: rejectedCount, color: '#7C3AED', total: totalPhotos }
                ].filter(d => d.value > 0);

                const displayData = statusData.length > 0 ? statusData : [
                  { name: 'Pending', value: 1, color: '#F59E0B', total: 0 }
                ];

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 text-left flex flex-col justify-between gap-5 shadow-xs">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                        Submission Status
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Breakdown of uploaded submissions by approval status
                      </p>
                    </div>

                    <div className="w-full h-52 sm:h-56 flex items-center justify-center my-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={displayData}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={82}
                            paddingAngle={displayData.length > 1 ? 5 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {displayData.map((entry, index) => (
                              <Cell key={`status-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-y-3 gap-x-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: '#10B981' }} />
                        <span>Approved ({approvedCount})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: '#F59E0B' }} />
                        <span>Pending ({pendingCount})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: '#7C3AED' }} />
                        <span>Disapproved ({rejectedCount})</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card 2: Donut Chart for Category Distribution */}
              {(() => {
                const photosList = allSubmissions.reduce((acc, s) => [...acc, ...(s.photographs || [])], []);
                const totalPhotos = photosList.length;
                
                const categoryColors = ['#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#06B6D4', '#F97316'];
                const categoriesMap = {};
                
                photosList.forEach(photo => {
                  const cat = photo.category || 'General';
                  categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
                });

                const catEntries = Object.entries(categoriesMap);
                
                const catData = catEntries.length > 0 
                  ? catEntries.map(([name, value], index) => ({
                      name,
                      value,
                      color: categoryColors[index % categoryColors.length],
                      total: totalPhotos
                    }))
                  : [
                      { name: 'In-door', value: 1, color: '#7C3AED', total: 0 },
                      { name: 'Out-Door', value: 1, color: '#F59E0B', total: 0 },
                      { name: 'Color', value: 1, color: '#10B981', total: 0 }
                    ];

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 text-left flex flex-col justify-between gap-5 shadow-xs">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                        Category Distribution
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Breakdown of uploaded submissions across event categories
                      </p>
                    </div>

                    <div className="w-full h-52 sm:h-56 flex items-center justify-center my-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={catData}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={82}
                            paddingAngle={catData.length > 1 ? 5 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {catData.map((entry, index) => (
                              <Cell key={`cat-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-y-3 gap-x-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {(catEntries.length > 0 ? catData : [
                        { name: 'In-door', value: 0, color: '#7C3AED' },
                        { name: 'Out-Door', value: 0, color: '#F59E0B' },
                        { name: 'Color', value: 0, color: '#10B981' }
                      ]).map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                          <span>{item.name} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Card 3: Activities History Timeline */}
              {(() => {
                const timelineEvents = [];
                allSubmissions.forEach(sub => {
                  timelineEvents.push({
                    title: `Joined: ${sub.eventTitle}`,
                    desc: `Entry #${sub.entryNumber} (${sub.photoLimit} photos limit).`,
                    date: new Date(sub.createdAt),
                    type: 'joined'
                  });

                  if (sub.paymentStatus === 'Paid') {
                    timelineEvents.push({
                      title: `Payment Received`,
                      desc: `Paid INR ${sub.amount} for package slots.`,
                      date: new Date(sub.updatedAt),
                      type: 'payment'
                    });
                  } else if (sub.paymentStatus === 'Refunded') {
                    timelineEvents.push({
                      title: `Payment Refunded`,
                      desc: `INR ${sub.amount} refunded by admin.`,
                      date: new Date(sub.updatedAt),
                      type: 'refund'
                    });
                  }

                  if (sub.isFinalSubmitted) {
                    timelineEvents.push({
                      title: `Final Submission`,
                      desc: `Finalized frames for jury evaluation.`,
                      date: new Date(sub.updatedAt),
                      type: 'locked'
                    });
                  }

                  (sub.photographs || []).forEach(photo => {
                    timelineEvents.push({
                      title: `Uploaded: "${photo.title}"`,
                      desc: `EXIF verified (${photo.cameraBrand || 'Camera'}).`,
                      date: new Date(photo.dateCaptured || sub.createdAt),
                      type: 'photo'
                    });
                  });
                });

                timelineEvents.sort((a, b) => b.date - a.date);

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 text-left flex flex-col justify-between gap-5 shadow-xs">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                        Activities History Timeline
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Recent account actions & contest activity log
                      </p>
                    </div>

                    <div className="w-full my-1">
                      {timelineEvents.length === 0 ? (
                        <div className="h-52 sm:h-56 flex items-center justify-center text-xs text-slate-400">
                          No timeline activities logged yet.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3.5 pl-3.5 border-l-2 border-indigo-100 dark:border-indigo-950/60 h-52 sm:h-56 overflow-y-auto pr-1 text-xs">
                          {timelineEvents.slice(0, 8).map((evt, idx) => (
                            <div key={idx} className="relative flex flex-col gap-0.5">
                              <span className="absolute -left-4.75 top-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600" />
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {evt.date.toLocaleDateString()} {evt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{evt.title}</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug line-clamp-2">{evt.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total events: <strong className="text-slate-900 dark:text-white">{timelineEvents.length}</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Card 4: Refund Status Tracking */}
              {(() => {
                const refundedSubs = allSubmissions.filter(s => s.paymentStatus === 'Refunded' || s.paymentStatus === 'Withdrawn');
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 text-left flex flex-col justify-between gap-5 shadow-xs">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                        Refund Status Tracking
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Status of fee refunds & entry withdrawals
                      </p>
                    </div>

                    <div className="w-full my-1">
                      {refundedSubs.length === 0 ? (
                        <div className="h-52 sm:h-56 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs text-center">
                          <span>No refunded or withdrawn entry packages.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 h-52 sm:h-56 overflow-y-auto pr-1">
                          {refundedSubs.map((sub, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col gap-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-30">{sub.eventTitle}</span>
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                                  sub.paymentStatus === 'Refunded' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {sub.paymentStatus === 'Refunded' ? 'Refunded' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>ID: #{sub.entryNumber}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">INR {sub.amount}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 italic line-clamp-2">
                                {sub.paymentStatus === 'Refunded'
                                  ? 'Registration fees reverted back to bank account.'
                                  : 'Withdrawal request registered; pending admin approval.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Refunded / Withdrawn: <strong className="text-slate-900 dark:text-white">{refundedSubs.length}</strong>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      )}

      {dashboardTab === "certificates" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200 text-left">
          <div>
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">Digital Certificates & Credentials</h2>
            <p className="text-xs text-slate-500 mt-1">
              Online reference previews of your contest certificates. Official physical copies are issued directly at the event office or gallery.
            </p>
          </div>

          {(() => {
            const eligibleSubs = allSubmissions.filter(sub => sub.isFinalSubmitted);

            // Group submissions into Winners and General Participants
            const winnerCards = [];
            const standardCards = [];

            eligibleSubs.forEach(sub => {
              const evDetails = eventsList.find(e => e._id === sub.eventId);
              if (evDetails?.status === 'Completed') {
                const winInfo = evDetails?.winners?.find(w => w.userId === user?._id || w.userId === user?.id);
                if (winInfo && winInfo.certificatePdfUrl) {
                  winnerCards.push({ sub, evDetails, winInfo });
                } else {
                  standardCards.push({ sub, evDetails });
                }
              }
            });

            if (winnerCards.length === 0 && standardCards.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs leading-relaxed max-w-lg mx-auto shadow-sm">
                  <div className="text-3xl mb-3">🎖️</div>
                  <h4 className="font-display font-extrabold text-slate-850 dark:text-white text-sm mb-1">Certificates Awaiting Event Completion</h4>
                  <p>Your digital certificates (Participation & Winner credentials) will be generated and made available here once the competition event has concluded and is marked as Completed by the administrator.</p>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-8">
                {/* 1. Champion Credentials Section */}
                {winnerCards.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-display font-black text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <Trophy size={16} className="text-amber-500 animate-pulse shrink-0" />
                      🥇 My Champion Credentials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {winnerCards.map(({ sub, evDetails, winInfo }, index) => {
                        const isFirst = winInfo.rank.toLowerCase().includes('1st') || winInfo.rank.toLowerCase().includes('first');
                        const isSecond = winInfo.rank.toLowerCase().includes('2nd') || winInfo.rank.toLowerCase().includes('second');
                        const certTemplateName = isFirst ? '1st-Prize.png' : isSecond ? '2nd-Prize.png' : '3rd-Prize.png';
                        const customCertUrl = isFirst ? evDetails?.certificates?.firstPrize : isSecond ? evDetails?.certificates?.secondPrize : evDetails?.certificates?.thirdPrize;
                        const certImgSrc = getBackendUrl(customCertUrl || winInfo.certificateImageUrl || `/${certTemplateName}`);
                        
                        return (
                          <div key={index} className="bg-linear-to-br from-amber-500/5 to-amber-600/5 border-2 border-amber-500/35 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 shadow-md justify-between items-center relative overflow-hidden">
                            
                            {/* Certificate Thumbnail Preview */}
                            <div className="shrink-0 w-28 aspect-[1/1.414] overflow-hidden rounded-lg border border-amber-500/20 shadow-sm cursor-pointer animate-in zoom-in-95 relative select-none"
                                 onClick={() => handleShowCertificateAlert('Champion')}>
                              <img
                                src={certImgSrc}
                                alt="Certificate Thumbnail"
                                className="w-full h-full object-cover filter blur-[0.3px] pointer-events-none select-none"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/${certTemplateName}`;
                                }}
                                onContextMenu={e => e.preventDefault()}
                              />
                              <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center p-1 pointer-events-none">
                                <div className="text-[5.5px] leading-tight font-black text-red-600/45 dark:text-red-500/35 uppercase tracking-tighter text-center select-none rotate-[-25deg] border border-dashed border-red-600/30 bg-white/80 px-1 py-0.5 rounded shadow-sm">
                                  SAMPLE CERTIFICATE
                                  <br />
                                  NOT VALID FOR
                                  <br />
                                  PRINT OR DOWNLOAD
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between h-full w-full gap-3 text-left">
                              <div>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600">
                                  🏆 {winInfo.rank} (Preview Only)
                                </span>
                                <h4 className="font-display font-black text-sm text-slate-900 dark:text-white mt-1.5 leading-tight">
                                  {sub.eventTitle}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                  Reward: <strong className="text-amber-700 dark:text-amber-500 font-bold">{winInfo.prizeAmount || (isFirst ? '₹50,000' : isSecond ? '₹30,000' : '₹20,000')}</strong>
                                </p>
                                <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-semibold">
                                  Winning Entry: <span className="italic">"{winInfo.photoTitle}"</span> (Grade: {winInfo.score}/10)
                                </p>
                              </div>

                              <div className="flex flex-col gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleShowCertificateAlert('Champion')}
                                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Eye size={12} />
                                  View Preview (Locked)
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleShowCertificateAlert('Champion')}
                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                                  >
                                    <Lock size={12} />
                                    Download PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleShowCertificateAlert('Champion')}
                                    className="px-2.5 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                                    title="Print Certificate (Disabled)"
                                  >
                                    <Lock size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Participation Credentials Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-display font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider">
                    🎖️ Contest Participation Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {standardCards.map(({ sub, evDetails, isDummy }, index) => {
                      const participationCertSrc = getBackendUrl(evDetails?.certificates?.participation || '/participation-template.png');
                      return (
                        <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 shadow-md justify-between items-center relative overflow-hidden">
                          
                          {/* Watermarked Thumbnail Preview */}
                          <div className="shrink-0 w-28 aspect-[1/1.414] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer select-none relative"
                               onClick={() => handleShowCertificateAlert('Participation')}>
                            <img
                              src={participationCertSrc}
                              alt="Participation Certificate Thumbnail"
                              className="w-full h-full object-cover filter blur-[0.3px] pointer-events-none select-none"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/participation-template.png';
                              }}
                              onContextMenu={e => e.preventDefault()}
                            />
                            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center p-1 pointer-events-none">
                              <div className="text-[5.5px] leading-tight font-black text-red-600/45 dark:text-red-500/35 uppercase tracking-tighter text-center select-none rotate-[-25deg] border border-dashed border-red-600/30 bg-white/80 px-1 py-0.5 rounded shadow-sm">
                                SAMPLE CERTIFICATE
                                <br />
                                NOT VALID FOR
                                <br />
                                PRINT OR DOWNLOAD
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between h-full w-full gap-3 text-left">
                            <div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isDummy ? 'bg-rose-500/10 text-rose-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                🎖️ {isDummy ? 'SAMPLE PREVIEW' : `Entry ${sub.entryNumber}`}
                              </span>
                              <h4 className="font-display font-black text-sm text-slate-900 dark:text-white mt-1.5 leading-tight">
                                {sub.eventTitle}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                Type: Participation Reference Preview
                              </p>
                              <p className="text-[10px] text-slate-500 leading-none mt-0.5 font-semibold">
                                Recipient: <span className="italic">{user?.name}</span>
                              </p>
                            </div>

                            <div className="flex flex-col gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() => handleShowCertificateAlert('Participation')}
                                className="w-full py-1.5 bg-slate-900/90 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye size={12} />
                                View Preview (Locked)
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleShowCertificateAlert('Participation')}
                                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                                  type="button"
                                >
                                  <Lock size={12} />
                                  Download PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShowCertificateAlert('Participation')}
                                  className="px-2.5 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                                  title="Print Certificate (Disabled)"
                                >
                                  <Lock size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {dashboardTab === "entries" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200 text-left">
          
          {/* Header */}
          <div>
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">My Contest Entries</h2>
            <p className="text-xs text-slate-500 mt-1">
              View and manage your active contest entries, upload DSLR photographs, and review historical enrollment details.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-4 rounded-2xl text-sm text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Contests Collapsible Panels */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Active Competitions</h3>
            {(() => {
              const activeEvents = eventsList.filter(e => e.status === 'Active');
              if (activeEvents.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                    No active competitions are running currently. Check back later!
                  </div>
                );
              }

              return activeEvents.map((e, index) => {
                const isExpanded = !!expandedActiveEvents[e._id];
                const activeSub = allSubmissions.find(s => s.eventId === e._id);
                const hasPaid = activeSub && activeSub.paymentStatus === 'Paid';
                const hasFinalized = activeSub && activeSub.isFinalSubmitted;

                // Alternating soft light background colors for multiple events
                const isEven = index % 2 === 0;
                const panelBgClass = isEven
                  ? "bg-indigo-50/70 dark:bg-indigo-950/25 border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-800"
                  : "bg-sky-50/70 dark:bg-sky-950/25 border-sky-200/60 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-800";

                const headerHoverClass = isEven
                  ? "hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40"
                  : "hover:bg-sky-100/60 dark:hover:bg-sky-950/40";

                const eventBadgeClass = isEven
                  ? "text-indigo-700 dark:text-indigo-300 bg-indigo-100/90 dark:bg-indigo-900/60"
                  : "text-sky-700 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-900/60";

                return (
                  <div key={e._id} className={`${panelBgClass} border rounded-3xl overflow-hidden shadow-xs flex flex-col transition-all duration-300`}>
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleActiveEvent(e)}
                      className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer ${headerHoverClass} transition-colors select-none gap-4 sm:gap-2`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                          {e.title}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full w-fit ${eventBadgeClass}`}>
                          {e.eventType} Contest
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {activeSub ? (
                          <div className="flex gap-1.5 items-center">
                            {hasFinalized ? (
                              <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                                Finalized
                              </span>
                            ) : hasPaid ? (
                              <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                                Paid (Uploading)
                              </span>
                            ) : (
                              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                                Unpaid
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              ({activeSub.photographs?.length || 0} / {activeSub.photoLimit} Uploaded)
                            </span>
                          </div>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                            Not Enrolled
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/60 dark:border-slate-800 p-6 flex flex-col gap-6 bg-white/80 dark:bg-slate-900/80">
                        {loadingEventWorkspace ? (
                          <div className="flex items-center justify-center py-10 gap-2.5">
                            <Camera className="w-5 h-5 text-indigo-600 animate-spin" />
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Loading Entry Folder...
                            </span>
                          </div>
                        ) : (
                          <>
                            {submission?.paymentStatus === 'Refunded' && (
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-5 rounded-2xl text-amber-800 dark:text-amber-300 mb-2 animate-in slide-in-from-top-4 duration-200">
                                <div className="flex items-start gap-3">
                                  <RotateCcw size={24} className="shrink-0 text-amber-600 dark:text-amber-400 mt-1 md:mt-0" />
                                  <div>
                                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Entry Payment Refunded</h4>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                                      Your entry submission payment has been refunded and credited back to your bank account by the administrator. All photo slots have been reset to unpaid status.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {user?.isSuspended && (
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-red-700 dark:text-red-400 mb-2 animate-in slide-in-from-top-4 duration-200">
                                <div className="flex items-start gap-3">
                                  <ShieldCheck size={24} className="shrink-0 text-red-600 dark:text-red-400 mt-1 md:mt-0" />
                                  <div>
                                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Account Suspended</h4>
                                    <p className="text-[11px] text-red-600 dark:text-red-400/80 mt-1">
                                      An administrator has suspended your participant account. You can view your current submissions in read-only mode, but all modifications, payments, and new uploads are disabled.
                                    </p>
                                    {user.suspensionReason && (
                                      <div className="mt-2.5 bg-red-100/50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-[10px] text-red-800 dark:text-red-300">
                                        <span className="font-bold uppercase tracking-wider block mb-1">Reason / Explanation:</span>
                                        <p className="italic">"{user.suspensionReason}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {e.gradingConfirmed && !isFinalized ? (
                              <div className="max-w-xl mx-auto bg-red-50 dark:bg-red-955/20 border border-red-200/50 p-6 rounded-3xl flex flex-col items-center gap-4 text-center my-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl">
                                  <ShieldAlert size={28} />
                                </div>
                                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                                  <h3 className="font-display font-black text-sm text-slate-900 dark:text-white">Submissions Closed</h3>
                                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                    The jury panel has finalized grading and signed off on this contest event. No new registrations, payments, or file uploads are permitted.
                                  </p>
                                </div>
                              </div>
                            ) : submission && (submission.paymentStatus === 'Withdrawn' || submission.paymentStatus === 'Refunded') ? (
                              null
                            ) : (
                              <>
                                {/* STEP 1: Not started yet */}
                                {!submission ? (
                              <div className="max-w-4xl mx-auto flex flex-col gap-6 py-2">
                                <div className="text-center flex flex-col gap-1.5">
                                  <h1 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                                    Join Competition
                                  </h1>
                                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                                    Ready to submit your {e.eventType.toLowerCase()} frames? Choose your package, confirm you follow our terms, and initiate your entry folder.
                                  </p>
                                </div>

                                <form onSubmit={handleStartSubmission} className="flex flex-col gap-6">
                                  {/* Packages Selector */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {e.packages.map((pkg) => {
                                      const isSelected = selectedPkgId === pkg.id;
                                      return (
                                        <label
                                          key={pkg.id}
                                          onClick={() => setSelectedPkgId(pkg.id)}
                                          className={`border-2 rounded-3xl p-6 flex flex-col gap-3 text-center cursor-pointer transition-all duration-200 ${
                                            isSelected
                                              ? "bg-linear-to-b from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/60 dark:to-purple-950/60 border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-600/20 shadow-md scale-[1.02]"
                                              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="packageSelect"
                                            checked={isSelected}
                                            onChange={() => setSelectedPkgId(pkg.id)}
                                            className="sr-only"
                                          />
                                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full w-fit mx-auto transition-all ${
                                            isSelected
                                              ? "text-indigo-700 dark:text-indigo-300 bg-indigo-100/90 dark:bg-indigo-900/60 shadow-2xs"
                                              : "text-slate-400 bg-slate-100/60 dark:bg-slate-800/40"
                                          }`}>
                                            {pkg.name}
                                          </span>
                                          <span className={`font-display font-black text-3xl transition-colors ${
                                            isSelected ? "text-indigo-950 dark:text-white" : "text-slate-900 dark:text-white"
                                          }`}>
                                            ₹{pkg.price}
                                          </span>
                                          <span className={`text-[11px] font-extrabold transition-colors ${
                                            isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"
                                          }`}>
                                            Max Uploads: {pkg.maxPhotos} {e.eventType === 'Photography' ? 'Photo' : 'Artwork'}{pkg.maxPhotos > 1 ? "s" : ""}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>

                                  {/* DSLR eligibility declaration */}
                                  <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3.5">
                                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                      <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-xs">
                                        Eligibility Declaration
                                      </h3>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                      {e.eventType === 'Photography' 
                                        ? 'In order to maintain a fair, high-caliber standard for photographic craftsmanship, we restrict uploads strictly to cameras with physical interchangeable lenses.'
                                        : 'Confirm that all submitted artwork entries are original creations made exclusively by you.'}
                                    </p>

                                    <label className="flex items-start gap-3 cursor-pointer select-none bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/20 p-3.5 rounded-xl">
                                      <input
                                        type="checkbox"
                                        checked={acceptedDeclaration}
                                        onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <span className="text-[11px] text-indigo-950 dark:text-indigo-300 font-semibold leading-relaxed">
                                        {e.eventType === 'Photography'
                                          ? '"I confirm that all submitted photographs are captured using a DSLR or Mirrorless Camera. Mobile Photography is not allowed. Any violation may result in immediate disqualification."'
                                          : '"I confirm that all submitted works are original artwork created solely by myself. Plagiarism or copyright violations will result in disqualification."'}
                                      </span>
                                    </label>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={user?.isSuspended}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md self-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {user?.isSuspended ? 'Account Suspended' : 'Start Entry Submission'}
                                  </button>
                                </form>
                              </div>
                            ) : (
                              /* STEP 2: Submission Folder is Active */
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-200">
                                {/* Left panel: Submissions Upload Wizard */}
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                  {/* Upload form - display only if not finalized and package limit not met */}
                                  {!isFinalized &&
                                    submission.photographs.length < selectedPackage?.maxPhotos && (
                                      <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-5 shadow-sm">
                                        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                                            Upload {e.eventType} Entry Photo
                                          </h3>
                                          <p className="text-[11px] text-slate-400 mt-0.5">
                                            {e.eventType === 'Photography' 
                                              ? 'Provide details and select files. We will parse EXIF metadata to auto-fill camera specifications.' 
                                              : 'Provide details, dimensions, medium and location specifications.'}
                                          </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                              <label htmlFor="photoTitle" className="font-semibold text-slate-400">Photo Title *</label>
                                              <input
                                                id="photoTitle"
                                                type="text"
                                                required
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Enter photo title"
                                                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                              />
                                            </div>
                                            <div className="flex flex-col gap-1 text-[11px]">
                                              <label htmlFor="photoCategory" className="font-semibold text-slate-400">Category *</label>
                                              <select
                                                id="photoCategory"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                              >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                  <option key={cat._id} value={cat.name}>
                                                    {cat.name}
                                                  </option>
                                                ))}
                                              </select>
                                              {(() => {
                                                const selectedCatObj = categories.find(c => c.name === category) || categories[0];
                                                const activeCustomLabels = getActiveCustomLabels(selectedCatObj);
                                                return activeCustomLabels.map((lbl) => (
                                                  <div className="flex flex-col gap-1 text-[11px]" key={lbl}>
                                                    <label className="font-semibold text-slate-400">{lbl} *</label>
                                                    <input
                                                      type="text"
                                                      required
                                                      value={customFieldValues[lbl] || ""}
                                                      onChange={(e) => setCustomFieldValues({
                                                        ...customFieldValues,
                                                        [lbl]: e.target.value
                                                      })}
                                                      placeholder={`Enter ${lbl}`}
                                                      className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                                    />
                                                  </div>
                                                ));
                                             })()}
                                            </div>
                                          </div>

                                          <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-1 text-[11px]">
                                              <label htmlFor="photoDescription" className="font-semibold text-slate-400">Description (Optional)</label>
                                              <textarea
                                                id="photoDescription"
                                                rows={2}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Tell us about your work..."
                                                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 resize-none text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                                              />
                                            </div>

                                            {/* Photo Upload Zone */}
                                            <div className="flex flex-col gap-1 text-[11px]">
                                              <label className="font-semibold text-slate-400">
                                                DSLR Photograph File (Max 800 KB) *
                                              </label>
                                              <DragDropUpload
                                                onUpload={async (photo, raw) => {
                                                  if (!category) {
                                                    setConfirmModal({
                                                      message: "Please select a Category first.",
                                                      isAlert: true
                                                    });
                                                    throw new Error("Category is required.");
                                                  }
                                                  await handleFileAnalyze(photo);
                                                  await handleUploadPhoto(photo, raw);
                                                }}
                                                isUploading={uploading}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  {/* List of uploaded photographs */}
                                  <div className="flex flex-col gap-4">
                                    <h3 className="font-display font-black text-slate-900 dark:text-white text-xs">
                                      Uploaded Contest Entries ({submission.photographs.length})
                                    </h3>

                                    {submission.photographs.length === 0 ? (
                                      <div className="glass-panel border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/10">
                                        <ImageIcon size={32} className="text-slate-300" />
                                        <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                          No photos uploaded in this entry folder yet.
                                        </p>
                                        <p className="text-xs max-w-xs text-slate-500">
                                          Use the entry form above to upload photographs corresponding to your selected package tier.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {submission.photographs.map((photo) => (
                                          <div key={photo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                                            <WatermarkPreview src={getBackendUrl(photo.fileUrl)} className="aspect-video w-full" />
                                            <div className="p-4 flex flex-col gap-3 grow justify-between">
                                              <div>
                                                <div className="flex justify-between items-start gap-2">
                                                  <h4 className="font-display font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                                    {photo.title}
                                                  </h4>
                                                  {(photo.status === 'Approved' || photo.status === 'Rejected' || photo.scores?.some(s => s.approvalStatus === 'Disapproved')) && (
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                                                      (photo.status === 'Approved' && !photo.scores?.some(s => s.approvalStatus === 'Disapproved'))
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500' 
                                                        : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                                    }`}>
                                                      {(photo.status === 'Rejected' || photo.scores?.some(s => s.approvalStatus === 'Disapproved')) ? 'Disapproved' : 'Approved'}
                                                    </span>
                                                  )}
                                                </div>
                                                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block mt-0.5">
                                                  {photo.category}
                                                </span>
                                                {(() => {
                                                   const selectedCatObj = categories.find(c => c.name === photo.category);
                                                   const activeLabels = getActiveCustomLabels(selectedCatObj);
                                                   const fieldsToDisplay = (photo.customFields || []).filter(cf => activeLabels.includes(cf.label));
                                                   if (fieldsToDisplay.length === 0) return null;
                                                   return (
                                                     <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-400">
                                                       {fieldsToDisplay.map((cf, idx) => (
                                                         <span key={idx} className="inline-block">
                                                           <strong className="text-slate-500">{cf.label}:</strong> {cf.value || 'N/A'}
                                                           {idx < fieldsToDisplay.length - 1 && <span className="ml-2 text-slate-350 dark:text-slate-800 font-normal">|</span>}
                                                         </span>
                                                       ))}
                                                     </div>
                                                   );
                                                 })()}

                                                 {/* Jury disapproval remarks */}
                                                 {(() => {
                                                   const disapprovedScore = photo.scores?.find(s => s.approvalStatus === 'Disapproved');
                                                   if (disapprovedScore) {
                                                     return (
                                                       <div className="mt-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-3 rounded-2xl text-[10px] text-red-800 dark:text-red-350 leading-relaxed font-semibold">
                                                         <div className="flex items-center gap-1.5 font-bold mb-1 text-red-900 dark:text-red-300">
                                                           <AlertTriangle size={14} className="text-red-650 shrink-0" />
                                                           <span>Jury Disapproval Feedback</span>
                                                         </div>
                                                         <p className="italic">"{disapprovedScore.remarks || 'No remarks provided.'}"</p>
                                                       </div>
                                                     );
                                                   }
                                                   return null;
                                                 })()}
                                              </div>

                                              {!isFinalized && (
                                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                                                  <button
                                                    onClick={() => handleEditPhotoClick(photo)}
                                                    className="flex-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-center py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                                  >
                                                    Edit Details
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                    className="text-[10px] font-semibold text-red-600 hover:text-red-700 text-center py-1 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200/40 dark:border-red-900/10"
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right panel: Submission info card, payment, finalize actions */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Folder Config</span>
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {isPaid ? 'Paid' : 'Awaiting Payment'}
                                      </span>
                                    </div>

                                    <div className="flex flex-col gap-2.5 text-xs text-left">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Contest Limit:</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{selectedPackage?.maxPhotos} photo frames</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Total Uploads:</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{submission.photographs.length} uploaded</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Toll Fee (Paid):</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-extrabold">₹{submission.amount}</strong>
                                      </div>
                                    </div>

                                    {/* Unpaid payment box */}
                                    {!isPaid && (
                                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-4 rounded-2xl flex flex-col gap-3 mt-1.5 text-xs">
                                        <div className="flex items-start gap-2.5">
                                          <CreditCard size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                            A registration invoice of <strong>₹{submission.amount}</strong> is pending for this submission slot. Pay now to initiate uploads.
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => setShowPaymentModal(true)}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                                        >
                                          <CreditCard size={16} />
                                          Complete Online Payment
                                        </button>
                                      </div>
                                    )}

                                    {/* Finalize submit actions */}
                                    {isPaid && (
                                      <div className="mt-2 flex flex-col gap-2.5">
                                        {isFinalized ? (
                                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 p-4 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-700 dark:text-emerald-500 leading-relaxed font-semibold">
                                            <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <p>This folder is sealed and submitted. Your DSLR EXIF specs are locked for jury panel grading. Best of luck!</p>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                                              <Clock size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                              <p>Provide all photo attachments. When complete, click the Lock folder button to submit to the panel.</p>
                                            </div>
                                            {submission.photographs.length < selectedPackage?.maxPhotos && (
                                              <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 p-3.5 rounded-2xl flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                <span>You must upload exactly {selectedPackage?.maxPhotos} photo{selectedPackage?.maxPhotos > 1 ? 's' : ''} for your selected package tier before you can finalize and lock your entry folder. (Currently {submission.photographs.length} uploaded)</span>
                                              </div>
                                            )}
                                            <button
                                              onClick={handleFinalSubmit}
                                              disabled={submission.photographs.length !== selectedPackage?.maxPhotos}
                                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              Finalize & Lock Entry
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {/* Withdrawal Button */}
                                    {submission && submission.paymentStatus !== 'Withdrawn' && submission.paymentStatus !== 'Refunded' && (new Date() < new Date(e.deadline)) && (
                                      <button
                                        onClick={() => handleWithdrawClick(submission._id)}
                                        className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                                      >
                                        <RotateCcw size={13} className="shrink-0" />
                                        Withdraw Entry & Refund
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* History Collapsible Panel */}
          {(() => {
            const pastSubmissions = allSubmissions.filter(sub => {
              const ev = eventsList.find(e => e._id === sub.eventId);
              return !ev || ev.status !== 'Active';
            });

            if (pastSubmissions.length === 0) return null;

            return (
              <div className="bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs flex flex-col transition-all duration-300 mt-4 text-left">
                {/* Accordion Header */}
                <div
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                      Historical Enrollments & Past Entries ({pastSubmissions.length})
                    </span>
                  </div>
                  {historyExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>

                {/* Accordion Body */}
                {historyExpanded && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 p-6 flex flex-col gap-6 bg-white/80 dark:bg-slate-950/80">
                    <div className="grid grid-cols-1 gap-6">
                      {pastSubmissions.map((sub, idx) => {
                        const ev = eventsList.find(e => e._id === sub.eventId);
                        return (
                          <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                              <div>
                                <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                  {sub.eventTitle}
                                </h4>
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Event Date: {ev ? new Date(ev.eventDate).toLocaleDateString() : 'N/A'} | Category: {ev?.eventType} Contest
                                </span>
                              </div>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase">
                                Ended
                              </span>
                            </div>

                            {/* Photographs Grid for this historical entry */}
                            {sub.photographs?.length === 0 ? (
                              <p className="text-[11px] text-slate-400">No photos were uploaded for this historical entry.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {sub.photographs.map((photo) => {
                                  const isDisapproved = photo.status === 'Rejected' || 
                                    photo.score?.approvalStatus === 'Disapproved' || 
                                    photo.scores?.some(s => s.approvalStatus === 'Disapproved');
                                  const disapprovedRemarks = photo.score?.approvalStatus === 'Disapproved'
                                    ? photo.score.remarks
                                    : photo.scores?.find(s => s.approvalStatus === 'Disapproved')?.remarks;
                                  return (
                                    <div key={photo.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                                      <WatermarkPreview src={getBackendUrl(photo.fileUrl)} className="aspect-video w-full" />
                                      <div className="p-3.5 flex flex-col gap-2.5">
                                        <div>
                                          <div className="flex justify-between items-start gap-2">
                                            <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{photo.title}</h5>
                                            {isDisapproved && (
                                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                                                Disapproved
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[9px] text-indigo-500 font-extrabold uppercase mt-0.5 block">{photo.category}</span>
                                        </div>
                                        {(() => {
                                           const selectedCatObj = categories.find(c => c.name === photo.category);
                                           const activeLabels = getActiveCustomLabels(selectedCatObj);
                                           const fieldsToDisplay = (photo.customFields || []).filter(cf => activeLabels.includes(cf.label));
                                           if (fieldsToDisplay.length === 0) return null;
                                           return (
                                             <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                                               {fieldsToDisplay.map((cf, idx) => (
                                                 <span key={idx} className="inline-block">
                                                   <strong className="text-slate-500">{cf.label}:</strong> {cf.value || 'N/A'}
                                                   {idx < fieldsToDisplay.length - 1 && <span className="ml-2 text-slate-350 dark:text-slate-800 font-normal">|</span>}
                                                 </span>
                                               ))}
                                             </div>
                                           );
                                         })()}

                                        {isDisapproved && disapprovedRemarks && (
                                          <div className="mt-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-3 rounded-2xl text-[10px] text-red-800 dark:text-red-350 leading-relaxed font-semibold">
                                            <div className="flex items-center gap-1.5 font-bold mb-1 text-red-900 dark:text-red-300">
                                              <AlertTriangle size={14} className="text-red-655 shrink-0" />
                                              <span>Jury Disapproval Feedback</span>
                                            </div>
                                            <p className="italic">"{disapprovedRemarks}"</p>
                                          </div>
                                        )}

                                        {/* Ratings and Jury comments if available */}
                                        {photo.score ? (
                                          <div className="mt-1 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 p-2.5 rounded-lg text-[10px] leading-relaxed">
                                            <div className="flex justify-between font-bold text-indigo-950 dark:text-indigo-300">
                                              <span>Jury Rating:</span>
                                              <span>{photo.score.averageScore} / 10</span>
                                            </div>
                                            {photo.score.remarks && !isDisapproved && (
                                              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 italic leading-snug">
                                                "{photo.score.remarks}"
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          !isDisapproved && (
                                            <div className="mt-1 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg text-[10px] text-slate-400 italic">
                                              No scores available.
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200 text-left my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                  Edit Photo Parameters
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Update title, categories, and capture configuration tags
                </span>
              </div>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdatePhoto} className="flex flex-col gap-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Edit Title */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="editPhotoTitle" className="font-extrabold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Photo Title *
                  </label>
                  <input
                    type="text"
                    id="editPhotoTitle"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter photo title (Required)"
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-slate-100 text-xs"
                  />
                </div>

                {/* Edit Category */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editPhotoCategory" className="font-extrabold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Contest Category *
                  </label>
                  <select
                    id="editPhotoCategory"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selectedCatObj = categories.find(c => c.name === editCategory);
                  const activeCustomLabels = getActiveCustomLabels(selectedCatObj);
                  return activeCustomLabels.map((lbl) => (
                    <div className="flex flex-col gap-1.5" key={lbl}>
                      <label className="font-extrabold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                        {lbl} *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustomFieldValues[lbl] || ""}
                        onChange={(e) => setEditCustomFieldValues({
                          ...editCustomFieldValues,
                          [lbl]: e.target.value
                        })}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  ));
                })()}

                {/* Edit Date Captured */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="editDateCaptured" className="font-extrabold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Date Captured
                  </label>
                  <input
                    type="date"
                    id="editDateCaptured"
                    value={editDateCaptured}
                    onChange={(e) => setDateCaptured(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Edit Description */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="editPhotoDescription" className="font-extrabold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Photo Description *
                  </label>
                  <textarea
                    id="editPhotoDescription"
                    required
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed font-semibold text-slate-700 dark:text-slate-300 text-xs"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI/CREDIT CARD MOCK PAYMENT GATEWAY DRAWER */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-1 items-center">
              <CreditCard size={28} className="text-indigo-600" />
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Secure Checkout Gateway
              </h3>
              <p className="text-xs text-slate-400">
                Select simulated payment option to complete booking
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    Selected Package
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPackage?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    Total Fee
                  </span>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    ₹{selectedPackage?.price}.00
                  </p>
                </div>
              </div>

              {/* Test Mode Help Alert */}
              <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/50 p-3.5 rounded-2xl flex flex-col gap-1 text-[11px] text-amber-700 dark:text-amber-300 text-left">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle size={13} className="shrink-0" />
                  Razorpay Test Mode Info
                </span>
                <p className="leading-relaxed">
                  This portal is in <strong>Test Mode</strong>. You will not receive a real OTP on your phone. To complete the payment:
                </p>
                <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                  <li>Use any 6-digit number (e.g., <strong>123456</strong>) on the OTP screen and click <strong>Continue</strong>.</li>
                  <li>Or click the <strong>"Pay on bank's page"</strong> link on the OTP screen and click <strong>"Success"</strong>.</li>
                </ul>
              </div>

            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePayment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center flex items-center justify-center gap-2"
              >
                <CreditCard size={14} />
                Pay via Razorpay (UPI, Cards, Netbanking)
              </button>

              <button
                type="button"
                onClick={handleDummyPayment}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} />
                Simulate Dummy Payment (Instant Bypass)
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer text-xs text-center"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Invoice Modal */}
      {showQRInvoice && (
        <QRInvoice
          payment={showQRInvoice}
          onClose={() => setShowQRInvoice(null)}
        />
      )}

      {/* Certificate Viewer Modal */}
      {showCertificate && (
        <Certificate
          user={user}
          submission={submission}
          event={event}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Custom Certificate Preview Alert Modal */}
      {certAlertMsg && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex flex-col gap-2 items-center">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl mb-2">
                <Lock size={28} className="animate-pulse" />
              </div>
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">
                Reference Preview Only
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                {certAlertMsg}
              </p>
            </div>
            <button
              onClick={() => setCertAlertMsg(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* FINAL SUBMISSION CONFIRMATION MODAL */}
      {showFinalSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl mb-2">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Final Entry Lock Confirmation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                FINAL SUBMISSION: This will lock all your photos and descriptions for grading. You cannot make changes afterwards. Proceed?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinalSubmitModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs text-center"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={executeFinalSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Yes, Finalize Entry
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Alert/Confirm Modal Popup Centered on Page */}
      {confirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200 text-center items-center">
            <div className={`p-3 rounded-2xl ${confirmModal.isAlert ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                {confirmModal.isAlert ? "Attention Required" : "Confirm Action"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              {confirmModal.isAlert ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer text-xs"
                >
                  OK
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmModal.onCancel) confirmModal.onCancel();
                      setConfirmModal(null);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl shadow-md cursor-pointer text-xs"
                  >
                    Confirm
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {dashboardTab === "event_history" && (() => {
        // 1. Filter events to ONLY those the participant has enrolled in or paid for
        const myEnrolledEvents = eventsList.filter(ev => {
          return allSubmissions.some(s => 
            s.eventId === ev._id || 
            (s.eventTitle && s.eventTitle.trim().toLowerCase() === ev.title.trim().toLowerCase())
          );
        });

        const selectedHistoryEvent = myEnrolledEvents.find(ev => ev._id === historySelectedEventId) || myEnrolledEvents[0];
        const selectedHistorySub = allSubmissions.find(s => 
          selectedHistoryEvent && (s.eventId === selectedHistoryEvent._id || (s.eventTitle && s.eventTitle.trim().toLowerCase() === selectedHistoryEvent.title.trim().toLowerCase()))
        );

        const uploadedPhotos = selectedHistorySub?.photographs || [];
        const isWinner = selectedHistoryEvent?.winnersPublished && selectedHistoryEvent?.winners?.some(w => w.userId === user?._id || (w.userName && w.userName === user?.name));
        const winnerInfo = isWinner ? selectedHistoryEvent?.winners?.find(w => w.userId === user?._id || (w.userName && w.userName === user?.name)) : null;

        return (
          <div className="animate-in fade-in duration-200 flex flex-col gap-6">
            {/* Header & Event Selector ("My Event History & Details" card - Prominent style) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-r from-indigo-50 via-purple-50/60 to-indigo-50/40 dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-slate-900/80 p-6 sm:p-7 rounded-3xl border-2 border-indigo-200/80 dark:border-indigo-800/60 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shrink-0 shadow-sm">
                  <History size={24} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest block mb-0.5">
                    Contest Archives
                  </span>
                  <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">My Event History & Details</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">View complete registration, payment, uploaded photos, and results for enrolled contests</p>
                </div>
              </div>

              {myEnrolledEvents.length > 0 && (
                <div className="w-full sm:w-auto shrink-0 text-left sm:text-right">
                  <label className="text-[10px] font-extrabold text-indigo-900/70 dark:text-indigo-300 uppercase tracking-wider block mb-1">
                    Select Enrolled Event ({myEnrolledEvents.length})
                  </label>
                  <select
                    value={selectedHistoryEvent?._id || ''}
                    onChange={(e) => setHistorySelectedEventId(e.target.value)}
                    className="w-full sm:w-72 md:w-80 px-4 py-2.5 bg-white dark:bg-slate-950 border border-indigo-300 dark:border-indigo-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                  >
                    {myEnrolledEvents.map(ev => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} ({ev.eventType || 'Contest'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Empty State: No Enrolled Events */}
            {myEnrolledEvents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full">
                  <Calendar size={40} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">No Enrolled Events Found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    You haven't enrolled or registered for any photography contests yet. Explore active contests and submit your entries today!
                  </p>
                </div>
                <a
                  href="/info"
                  className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Explore Active Contests
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* 1. Certificates Received Section - Light Amber Card */}
                <div className="bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                  <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Award size={18} className="text-amber-500" />
                    Certificates & Accolades
                  </h4>

                  {isWinner ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl font-black text-lg">
                          🏆
                        </div>
                        <div>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Winner - {winnerInfo?.rank}
                          </span>
                          <h5 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-1">
                            Official Winner Certificate Granted
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Congratulations! You earned {winnerInfo?.rank} place in {selectedHistoryEvent?.title}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : selectedHistoryEvent?.winnersPublished ? (
                    <div className="bg-white/80 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl font-black text-lg">
                          🎖️
                        </div>
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Participant Certificate
                          </span>
                          <h5 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-1">
                            Certificate of Participation Available
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Thank you for competing in {selectedHistoryEvent?.title}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/10 dark:bg-slate-950/40 border border-dashed border-amber-200/80 dark:border-amber-900/40 rounded-2xl text-center text-slate-800 dark:text-slate-600 text-sm">
                      ⏳ Certificates will be generated automatically once final results are published by the judging panel.
                    </div>
                  )}
                </div>

                {/* 2. Status Overview & Event Banner - Light Indigo Card */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-3xl p-6 shadow-xs flex flex-col gap-6">
                  
                  {/* Event Title Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-100 dark:border-indigo-900/30 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                          {selectedHistoryEvent?.eventType || 'Photography'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          selectedHistoryEvent?.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          selectedHistoryEvent?.status === 'Completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {selectedHistoryEvent?.status || 'Active'}
                        </span>
                      </div>
                      <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                        {selectedHistoryEvent?.title}
                      </h3>
                      {selectedHistoryEvent?.theme && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          <strong>Theme:</strong> {selectedHistoryEvent.theme}
                        </p>
                      )}
                    </div>
                    
                    {selectedHistorySub?.entryNumber && (
                      <div className="px-3.5 py-2 bg-white/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center gap-2.5 shrink-0 whitespace-nowrap shadow-2xs">
                        <div className="p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shrink-0 shadow-2xs">
                          <Hash size={14} />
                        </div>
                        <div className="flex flex-col whitespace-nowrap text-left">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 whitespace-nowrap block leading-none mb-0.5">
                            Official Entry Code
                          </span>
                          <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap block leading-tight">
                            #{selectedHistorySub.entryNumber}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Status Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* 1. Registration Status */}
                    <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-300">Registration Status</span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          Enrolled & Confirmed
                        </span>
                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 block mt-0.5">
                          Enrolled: {selectedHistorySub?.createdAt ? new Date(selectedHistorySub.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Payment Status */}
                    <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-900/70 dark:text-indigo-300">Payment Status</span>
                        <CreditCard size={14} className="text-indigo-500" />
                      </div>
                      <div>
                        <span className={`text-xs font-black block ${
                          selectedHistorySub?.paymentStatus === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' :
                          selectedHistorySub?.paymentStatus === 'Refunded' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {selectedHistorySub?.paymentStatus || 'Paid'} (₹{selectedHistorySub?.totalAmount || '200'})
                        </span>
                        <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 block mt-0.5 truncate" title={selectedHistorySub?.transactionId}>
                          Package: {selectedHistorySub?.packageName || 'Standard'} • Txn: #{selectedHistorySub?.transactionId || 'TXN-OK'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Withdrawal Status */}
                    <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-900/70 dark:text-blue-300">Withdrawal Status</span>
                        <ShieldCheck size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <span className={`text-xs font-black block ${
                          selectedHistorySub?.isWithdrawn ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {selectedHistorySub?.isWithdrawn ? 'Withdrawn' : 'Active (Not Withdrawn)'}
                        </span>
                        <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 block mt-0.5">
                          {selectedHistorySub?.isWithdrawn ? 'Entry withdrawn by participant' : 'Entry eligible for judging'}
                        </span>
                      </div>
                    </div>

                    {/* 4. Judging / Result Status */}
                    <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-900/70 dark:text-purple-300">Judging / Results</span>
                        <Award size={14} className="text-purple-500" />
                      </div>
                      <div>
                        <span className={`text-xs font-black block ${
                          selectedHistoryEvent?.winnersPublished ? 'text-purple-600 dark:text-purple-400' :
                          selectedHistoryEvent?.status === 'Completed' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                        }`}>
                          {selectedHistoryEvent?.winnersPublished ? 'Winners Declared' :
                           selectedHistoryEvent?.status === 'Completed' ? 'Under Evaluation' : 'Pending Judging'}
                        </span>
                        <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 block mt-0.5">
                          {selectedHistoryEvent?.winnersPublished ? 'Final grades & ranks released' : 'Evaluating jury panel'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. Uploaded Photographs Section - Light Purple Card */}
                <div className="bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200/60 dark:border-purple-900/40 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera size={18} className="text-purple-600 dark:text-purple-400" />
                      Uploaded Photographs ({uploadedPhotos.length})
                    </h4>
                    <span className="text-xs text-purple-950/70 dark:text-purple-300 font-semibold">
                      Submission Status: <strong className="text-purple-700 dark:text-purple-400 font-extrabold">{selectedHistorySub?.isFinalSubmitted ? 'Finalized' : 'Draft'}</strong>
                    </span>
                  </div>

                  {uploadedPhotos.length === 0 ? (
                    <div className="p-8 bg-white/70 dark:bg-slate-950/60 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs border border-dashed border-purple-200/60 dark:border-purple-900/30">
                      No photographs uploaded for this contest yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, pIdx) => {
                        const imgUrl = getBackendUrl(photo.fileUrl);
                        const hasScore = typeof photo.score === 'number' || (Array.isArray(photo.scores) && photo.scores.length > 0);
                        const finalScore = typeof photo.score === 'number' ? photo.score : (photo.scores?.[0]?.score || 'N/A');

                        return (
                          <div key={pIdx} className="bg-white/90 dark:bg-slate-950 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs">
                            <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 relative">
                              <img
                                src={imgUrl}
                                alt={photo.title || `Photo ${pIdx+1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                                {photo.category || 'Standard'}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-display font-bold text-xs text-slate-900 dark:text-white truncate">
                                {photo.title || 'Untitled Photo'}
                              </h5>
                              {(photo.cameraBrand || photo.cameraModel) && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  📷 {photo.cameraBrand} {photo.cameraModel}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-purple-100 dark:border-purple-950 text-[10px]">
                              <span className="text-slate-400 font-medium">Jury Rating:</span>
                              <span className="font-black text-purple-600 dark:text-purple-400">
                                {hasScore ? `${finalScore}/10` : 'Pending Grade'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Event Information & History Timeline - Light Sky Card */}
                <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
                  <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    Event Information & History Log
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-white/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Key Event Dates</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Start Date:</strong> {selectedHistoryEvent?.startDate ? new Date(selectedHistoryEvent.startDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Submission Deadline:</strong> {selectedHistoryEvent?.deadline ? new Date(selectedHistoryEvent.deadline).toLocaleDateString() : 'N/A'}
                      </p>
                      {selectedHistoryEvent?.exhibitionFromDate && (
                        <p className="text-slate-700 dark:text-slate-300">
                          <strong>Exhibition Dates:</strong> {new Date(selectedHistoryEvent.exhibitionFromDate).toLocaleDateString()} - {new Date(selectedHistoryEvent.exhibitionToDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Contest Location & Details</span>
                      <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                        <strong>Official Entry Code:</strong> <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 rounded-lg text-xs">#{selectedHistorySub?.entryNumber || 'N/A'}</span>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Venue:</strong> {selectedHistoryEvent?.venue || 'Online Portal'}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Category Type:</strong> {selectedHistoryEvent?.eventType || 'Photography'}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Selected Entry Package:</strong> {selectedHistorySub?.packageName || 'Standard Entry'} (₹{selectedHistorySub?.totalAmount || '200'})
                      </p>
                    </div>

                    {/* Activity History Timeline placed beside right side of Contest Location & Details */}
                    <div className="p-4 bg-white/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Activity History Timeline</span>
                      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Event Enrollment:</span>
                            <span className="text-slate-400 text-[11px]">Enrolled in contest ({selectedHistorySub?.createdAt ? new Date(selectedHistorySub.createdAt).toLocaleDateString() : 'Completed'})</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Payment Processed:</span>
                            <span className="text-slate-400 text-[11px]">{selectedHistorySub?.paymentStatus || 'Paid'} (₹{selectedHistorySub?.totalAmount || '200'})</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Photo Uploads:</span>
                            <span className="text-slate-400 text-[11px]">{uploadedPhotos.length} photo(s) submitted</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${selectedHistoryEvent?.winnersPublished ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Results & Certification:</span>
                            <span className="text-slate-400 text-[11px]">{selectedHistoryEvent?.winnersPublished ? 'Winners & certificates published' : 'Awaiting judging completion'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}

