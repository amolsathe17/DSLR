import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ExifReader from "exifreader";
import confetti from "canvas-confetti";
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
} from "lucide-react";
import DragDropUpload from "../components/DragDropUpload";
import WatermarkPreview from "../components/WatermarkPreview";
import QRInvoice from "../components/QRInvoice";
import Certificate from "../components/Certificate";

export default function Dashboard() {
  const { apiFetch, user, token } = useAuth();
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [event, setEvent] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedTypeTab, setSelectedTypeTab] = useState('Photography');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showQRInvoice, setShowQRInvoice] = useState(null);

  // Certificate Modal State
  const [showCertificate, setShowCertificate] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);

  // Package & Declaration selection
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);

  const fetchDashboardData = async (selectedTab = selectedTypeTab) => {
    try {
      // 1. Fetch active event matching selected category tab
      const eventData = await apiFetch("/api/events");
      let activeEvent = null;
      if (eventData.success && eventData.events.length > 0) {
        setEventsList(eventData.events);
        activeEvent = eventData.events.find((e) => e.status === "Active" && e.eventType === selectedTab);
        setEvent(activeEvent || null);
        if (activeEvent) {
          setSelectedPkgId(activeEvent.packages[0].id);
        } else {
          setSubmission(null);
        }
      }

      // 2. Fetch categories filtered by this event's type
      const categoryData = await apiFetch(`/api/categories?contestType=${encodeURIComponent(activeEvent?.eventType || '')}`);
      if (categoryData.success) {
        setCategories(categoryData.categories);
        if (categoryData.categories.length > 0) {
          setCategory(categoryData.categories[0].name);
        }
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
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("eventId", event._id);
      formData.append("title", title || "Untitled");
      formData.append("category", category || "General");
      formData.append("cameraBrand", cameraBrand || "");
      formData.append("cameraModel", cameraModel || "");
      formData.append("lensUsed", lensUsed || "");
      formData.append("location", location || "");
      formData.append("dateCaptured", dateCaptured || "");
      formData.append("description", description || "");

      formData.append("photoFile", photoFile);

      if (rawFile) {
        formData.append("rawFile", rawFile);
      }

      const API_URL = import.meta.env.VITE_API_URL || "https://dslr-production-45ef.up.railway.app";

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

  const handleDeletePhoto = async (photoId) => {
    if (
      !confirm(
        "Are you sure you want to remove this photograph from your entry?",
      )
    )
      return;
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
      }
    } catch (err) {
      setError(err.message);
    }
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
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(`/api/submissions/photographs/${editingPhoto.id}`, {
        method: "PUT",
        body: JSON.stringify({
          eventId: event._id,
          title: editTitle,
          category: editCategory,
          cameraBrand: editCameraBrand,
          cameraModel: editCameraModel,
          lensUsed: editLensUsed,
          location: editLocation,
          dateCaptured: editDateCaptured,
          description: editDescription,
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-200">
      
      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 justify-center sm:justify-start">
        <button
          onClick={() => setDashboardTab("overview")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            dashboardTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setDashboardTab("entries")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            dashboardTab === "entries"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          My Entries
        </button>
        <button
          onClick={() => setDashboardTab("certificates")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            dashboardTab === "certificates"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Digital Certificates
        </button>
      </div>

      {dashboardTab === "overview" && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          {/* Welcome profile header */}
          <div className="bg-gradient-to-r from-indigo-900/10 via-indigo-950/5 to-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-left">
              <span className="text-[10px] text-indigo-505 font-extrabold uppercase tracking-widest">
                Participant Dashboard
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Welcome back, {user?.name || "Participant"}!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your contest submissions, track payment invoices, view performance stats, and download certificates.
              </p>
            </div>
            <div className="flex gap-2 self-start md:self-center">
              <button
                onClick={() => setDashboardTab("entries")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} /> Submit New Photo
              </button>
            </div>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Registered Contests</span>
              <h3 className="font-display font-extrabold text-2xl text-indigo-600 dark:text-indigo-400">{allSubmissions.length}</h3>
              <span className="text-[10px] text-slate-400">Total events registered</span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Uploads</span>
              <h3 className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                {allSubmissions.reduce((acc, s) => acc + (s.photographs || []).length, 0)}
              </h3>
              <span className="text-[10px] text-slate-400">DSLR verified submissions</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Fees Paid</span>
              <h3 className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-500">
                INR {allSubmissions.reduce((acc, s) => acc + (s.paymentStatus === 'Paid' ? s.amount : 0), 0)}
              </h3>
              <span className="text-[10px] text-slate-400">Successful payments</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Account Status</span>
              <h3 className={`font-display font-extrabold text-lg flex items-center gap-1.5 mt-1 ${user?.isSuspended ? 'text-red-600' : 'text-emerald-600'}`}>
                {user?.isSuspended ? 'Suspended' : 'Active'}
              </h3>
              <span className="text-[10px] text-slate-400">Participant privileges</span>
            </div>
          </div>

          {/* SVG Charts Row */}
          {allSubmissions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Donut Chart for status */}
              {(() => {
                const photosList = allSubmissions.reduce((acc, s) => [...acc, ...(s.photographs || [])], []);
                const totalPhotos = photosList.length;
                const approvedCount = photosList.filter(p => p.status === 'Approved').length;
                const rejectedCount = photosList.filter(p => p.status === 'Rejected').length;
                const pendingCount = totalPhotos - approvedCount - rejectedCount;

                if (totalPhotos === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[260px] shadow-sm">
                      <ImageIcon className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-700" />
                      <span>Upload photos in the entries tab to view metrics charts.</span>
                    </div>
                  );
                }

                // Donut geometry calculations
                const approvedPct = totalPhotos ? (approvedCount / totalPhotos) : 0;
                const rejectedPct = totalPhotos ? (rejectedCount / totalPhotos) : 0;
                const pendingPct = totalPhotos ? (pendingCount / totalPhotos) : 0;

                const radius = 50;
                const circumference = 2 * Math.PI * radius;

                const approvedStroke = circumference * approvedPct;
                const pendingStroke = circumference * pendingPct;
                const rejectedStroke = circumference * rejectedPct;

                const approvedOffset = circumference;
                const pendingOffset = circumference - approvedStroke;
                const rejectedOffset = circumference - approvedStroke - pendingStroke;

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Submission Status</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                      {/* SVG Circle */}
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                          {/* Background track */}
                          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="12" />
                          {/* Approved segment (Green) */}
                          {approvedStroke > 0 && (
                            <circle
                              cx="70"
                              cy="70"
                              r={radius}
                              fill="transparent"
                              stroke="#10b981"
                              strokeWidth="12"
                              strokeDasharray={circumference}
                              strokeDashoffset={approvedOffset}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          )}
                          {/* Pending segment (Amber) */}
                          {pendingStroke > 0 && (
                            <circle
                              cx="70"
                              cy="70"
                              r={radius}
                              fill="transparent"
                              stroke="#f59e0b"
                              strokeWidth="12"
                              strokeDasharray={circumference}
                              strokeDashoffset={pendingOffset}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          )}
                          {/* Rejected segment (Red) */}
                          {rejectedStroke > 0 && (
                            <circle
                              cx="70"
                              cy="70"
                              r={radius}
                              fill="transparent"
                              stroke="#ef4444"
                              strokeWidth="12"
                              strokeDasharray={circumference}
                              strokeDashoffset={rejectedOffset}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display font-black text-2xl text-slate-900 dark:text-white">{totalPhotos}</span>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase">Photos</span>
                        </div>
                      </div>

                      {/* Legend details */}
                      <div className="flex flex-col gap-2.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Approved: <strong className="text-slate-900 dark:text-white">{approvedCount}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Pending: <strong className="text-slate-900 dark:text-white">{pendingCount}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Disapproved: <strong className="text-slate-900 dark:text-white">{rejectedCount}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Chart 2: Category distribution Bar Chart */}
              {(() => {
                const photosList = allSubmissions.reduce((acc, s) => [...acc, ...(s.photographs || [])], []);
                const categoriesMap = {};
                photosList.forEach(photo => {
                  categoriesMap[photo.category] = (categoriesMap[photo.category] || 0) + 1;
                });
                const catData = Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));

                if (catData.length === 0) {
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[260px] shadow-sm">
                      <ImageIcon className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-700" />
                      <span>Upload photos under categories to view distribution bar chart.</span>
                    </div>
                  );
                }

                const maxCount = Math.max(...catData.map(c => c.count));

                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Submission Categories</h3>
                    <div className="flex flex-col gap-3 py-1">
                      {catData.map(({ name, count }) => {
                        const widthPct = maxCount ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={name} className="flex flex-col gap-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-650 dark:text-slate-300">{name}</span>
                              <span className="text-slate-500">{count} {count === 1 ? 'photo' : 'photos'}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
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

          {/* History Timeline & Refund details side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left side: Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-5 shadow-sm">
              <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Activities History Timeline</h3>
              
              {(() => {
                const timelineEvents = [];
                allSubmissions.forEach(sub => {
                  timelineEvents.push({
                    title: `Joined event: ${sub.eventTitle}`,
                    desc: `Created entry folder under entry number ${sub.entryNumber}. Package: ${sub.photoLimit} photos.`,
                    date: new Date(sub.createdAt),
                    type: 'joined'
                  });

                  if (sub.paymentStatus === 'Paid') {
                    timelineEvents.push({
                      title: `Payment Succeeded`,
                      desc: `Paid INR ${sub.amount} for package ${sub.photoLimit} slots. Transaction reference ID attached.`,
                      date: new Date(sub.updatedAt),
                      type: 'payment'
                    });
                  } else if (sub.paymentStatus === 'Refunded') {
                    timelineEvents.push({
                      title: `Payment Refunded`,
                      desc: `Refund of INR ${sub.amount} credited back to bank account by admin.`,
                      date: new Date(sub.updatedAt),
                      type: 'refund'
                    });
                  }

                  if (sub.isFinalSubmitted) {
                    timelineEvents.push({
                      title: `Entries Locked (Final Submit)`,
                      desc: `Finalized all uploaded frames for jury evaluation for ${sub.eventTitle}.`,
                      date: new Date(sub.updatedAt),
                      type: 'locked'
                    });
                  }

                  (sub.photographs || []).forEach(photo => {
                    timelineEvents.push({
                      title: `Uploaded photo: "${photo.title}"`,
                      desc: `Exif verified (${photo.cameraBrand || 'N/A'} ${photo.cameraModel || 'N/A'}). Status: ${photo.status}.`,
                      date: new Date(photo.dateCaptured || sub.createdAt),
                      type: 'photo'
                    });
                  });
                });

                // Sort timeline events
                timelineEvents.sort((a, b) => b.date - a.date);

                if (timelineEvents.length === 0) {
                  return <p className="text-xs text-slate-400 py-6">No historical timeline activities yet.</p>;
                }

                return (
                  <div className="flex flex-col gap-6 pl-4 border-l border-slate-100 dark:border-slate-800 max-h-[320px] overflow-y-auto pr-2">
                    {timelineEvents.slice(0, 8).map((evt, idx) => (
                      <div key={idx} className="relative flex flex-col gap-1 text-xs">
                        {/* Circle dot marker */}
                        <span className="absolute -left-[22px] top-1 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-505" />
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {evt.date.toLocaleDateString()} {evt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <h4 className="font-extrabold text-slate-955 dark:text-white leading-none">{evt.title}</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{evt.desc}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Right side: Refund status tracking */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm">
              <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Refund Status Tracking</h3>
              {(() => {
                const refundedSubs = allSubmissions.filter(s => s.paymentStatus === 'Refunded');
                if (refundedSubs.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs min-h-[220px]">
                      <span>No refunded entry packages.</span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-2">
                    {refundedSubs.map((sub, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900 dark:text-white">{sub.eventTitle}</span>
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-500 rounded-full">
                            Refunded
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Entry ID: {sub.entryNumber}</span>
                          <span>Refunded Amount: <strong className="text-indigo-650 dark:text-indigo-400">INR {sub.amount}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic mt-0.5">
                          Status: The registration fees have been reverted. Photo upload limits reset to unpaid.
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {dashboardTab === "certificates" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200 text-left">
          <div>
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-white">Digital Certificates & Credentials</h2>
            <p className="text-xs text-slate-500 mt-1">
              You can claim digital credentials for contests you finalized once results are officially compiled and published by the administrators.
            </p>
          </div>

          {(() => {
            const eligibleSubs = allSubmissions.filter(sub => sub.isFinalSubmitted);
            
            if (eligibleSubs.length === 0) {
              return (
                <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-8 rounded-3xl shadow-sm w-full">
                  <Award className="w-10 h-10 text-indigo-505 animate-bounce" />
                  <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">No Finalized Entries Found</h2>
                  <p className="text-[11px] text-slate-500">
                    You haven't finalized any contest submissions yet. Once you complete the upload, pay, and finalized under the "My Entries" tab, you'll be able to claim your certificate here once grading finishes!
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eligibleSubs.map((sub, index) => {
                  const evDetails = eventsList.find(e => e._id === sub.eventId);
                  const isReady = evDetails?.winnersPublished;

                  return (
                    <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-4 text-left shadow-sm justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider">
                            Entry {sub.entryNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${isReady ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {isReady ? 'Ready for Download' : 'Grading in Progress'}
                          </span>
                        </div>
                        <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {sub.eventTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Package: {sub.photoLimit} photos ({sub.photographs?.length || 0} uploaded). Submitted on {new Date(sub.updatedAt).toLocaleDateString()}.
                        </p>
                      </div>

                      {isReady ? (
                        <button
                          onClick={() => {
                            setEvent(evDetails);
                            setSubmission(sub);
                            setShowCertificate(true);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full mt-2"
                        >
                          <Award size={14} />
                          View & Download Certificate
                        </button>
                      ) : (
                        <div className="bg-slate-55 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 p-3 rounded-xl text-[10px] text-slate-400 mt-2 flex items-center gap-2">
                          <Clock size={14} className="shrink-0" />
                          <span>Jury panel is compiling results. Certificate unlocks immediately upon publishing.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {dashboardTab === "entries" && (
        !event ? (
          <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-8 rounded-3xl shadow-sm">
            <Layers className="w-10 h-10 text-indigo-500 animate-pulse animate-in zoom-in-90 duration-200" />
            <h2 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mt-2">No Active {selectedTypeTab} Contests</h2>
            <p className="text-[11px] text-slate-500">
              There are currently no active {selectedTypeTab.toLowerCase()} competitions accepting submissions. Please check our other tabs or check back later!
            </p>
          </div>
        ) : (
          <>
            {/* Event Type Tabs */}
            <div className="flex flex-wrap gap-2 justify-center mb-10 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto">
              {['Photography', 'Painting', 'Drawing', 'Paper Craft', 'Other'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedTypeTab(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                    selectedTypeTab === type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {type} Contests
                </button>
              ))}
            </div>

            {submission?.paymentStatus === 'Refunded' && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-955/20 border border-amber-205/50 dark:border-amber-900/30 p-5 rounded-2xl text-amber-800 dark:text-amber-300 mb-8 animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-start gap-3">
                  <RotateCcw size={24} className="shrink-0 text-amber-600 dark:text-amber-400 mt-1 md:mt-0" />
                  <div>
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Entry Payment Refunded</h4>
                    <p className="text-[11px] text-amber-707 dark:text-amber-450 mt-1">
                      Your entry submission payment has been refunded and credited back to your bank account by the administrator. All photo slots have been reset to unpaid status.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user?.isSuspended && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-red-750 dark:text-red-400 mb-8 animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={24} className="shrink-0 text-red-650 dark:text-red-400 mt-1 md:mt-0" />
                  <div>
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Account Suspended</h4>
                    <p className="text-[11px] text-red-650 dark:text-red-400/80 mt-1">
                      An administrator has suspended your participant account. You can view your current submissions in read-only mode, but all modifications, payments, and new uploads are disabled.
                    </p>
                    {user.suspensionReason && (
                      <div className="mt-2.5 bg-red-100/50 dark:bg-red-955/40 border border-red-200/50 dark:border-red-900/20 p-3 rounded-xl text-[10px] text-red-800 dark:text-red-300">
                        <span className="font-bold uppercase tracking-wider block mb-1">Reason / Explanation:</span>
                        <p className="italic">"${user.suspensionReason}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-955/20 border border-red-205/50 dark:border-red-900/20 p-4 rounded-2xl text-sm text-red-600 dark:text-red-400 mb-6">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Not started yet */}
            {!submission ? (
              <div className="max-w-4xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="text-center flex flex-col gap-2">
                  <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white">
                    Join Competition
                  </h1>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto">
                    Ready to submit your DSLR frames? Choose your package, confirm you
                    follow our DSLR-only camera terms, and initiate your entry folder.
                  </p>
                </div>

                <form
                  onSubmit={handleStartSubmission}
                  className="flex flex-col gap-8"
                >
                  {/* Grid layout for packages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {event.packages.map((pkg) => (
                      <label
                        key={pkg.id || pkg._id}
                        className={`glass-panel border-2 rounded-3xl p-6 flex flex-col gap-4 cursor-pointer relative transition-all ${
                          selectedPkgId === pkg.id
                            ? "border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/10"
                            : "border-slate-200 dark:border-slate-805 hover:border-slate-305"
                        }`}
                      >
                        <input
                          type="radio"
                          name="packageId"
                          value={pkg.id}
                          checked={selectedPkgId === pkg.id}
                          onChange={(e) => setSelectedPkgId(e.target.value)}
                          className="sr-only"
                        />
                        {selectedPkgId === pkg.id && (
                          <span className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                        <div>
                          <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                            {pkg.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                            {pkg.maxPhotos} Photo {pkg.maxPhotos === 1 ? 'Slot' : 'Slots'}
                          </p>
                        </div>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="font-display font-black text-3xl text-slate-900 dark:text-white">
                            INR {pkg.price}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            / registration
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Declaration Terms Check */}
                  <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-4 text-left max-w-xl mx-auto">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptedDeclaration"
                        checked={acceptedDeclaration}
                        onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                        className="mt-1 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="acceptedDeclaration"
                        className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none"
                      >
                        I declare that all uploaded photographs will be taken with
                        a dedicated <strong>DSLR / Mirrorless camera</strong>. I
                        understand that AI-generated imagery and mobile phone
                        photographs are strictly prohibited and will be
                        disqualified immediately upon backend EXIF inspections.
                      </label>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={!acceptedDeclaration || loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? "Initiating..." : "Initiate Entry Folder"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* STEP 2 & 3: Workspace */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Columns (Photo Grid / Upload Area) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Photo Slots Counter */}
                  <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                          Entries Directory
                        </h3>
                        <p className="text-[10px] text-slate-550 font-semibold">
                          Registered: {selectedPackage?.name} ({submission.photoLimit} photo slots)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-black text-lg text-slate-900 dark:text-white">
                        {submission.photographs.length} / {submission.photoLimit}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
                        Slots Filled
                      </span>
                    </div>
                  </div>

                  {/* Upload photo workspace (Only if slots available and unpaid/draft) */}
                  {!isPaid && !isFinalized && submission.photographs.length < submission.photoLimit && (
                    <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-6 text-left">
                      <div>
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">
                          Add Photograph
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Load high-res JPG frames and fill metadata parameters below
                        </span>
                      </div>

                      <form onSubmit={handleUploadPhoto} className="flex flex-col gap-5">
                        
                        {/* Drag and drop zone */}
                        <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                          <label className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Photograph File * (Max 800 KB)</label>
                          <DragDropUpload
                            id="photoFile"
                            accept="image/jpeg"
                            onChange={handlePhotoFileChange}
                          />
                        </div>

                        {/* Optional raw/original file link */}
                        <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                          <label className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                            Optional RAW / Original High-Res File (ZIP/NEF/CR3/RAW)
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-850 px-1 rounded-md text-slate-500 lowercase">verification bonus</span>
                          </label>
                          <DragDropUpload
                            id="rawFile"
                            accept=".zip,.nef,.cr2,.cr3,.arw,.dng"
                            onChange={handleRawFileChange}
                            placeholder="Upload ZIP of camera original / original RAW file (Optional)"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          
                          {/* Title */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="photoTitle" className="font-extrabold text-slate-500 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                              Photograph Title *
                            </label>
                            <input
                              type="text"
                              id="photoTitle"
                              required
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g. Whispers of Winter"
                              className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Category selector */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="photoCategory" className="font-extrabold text-slate-500 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                              Contest Category *
                            </label>
                            <select
                              id="photoCategory"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {categories.map((c) => (
                                <option key={c._id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Camera Brand */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="cameraBrand" className="font-extrabold text-slate-500 dark:text-slate-550 uppercase text-[9px] tracking-wider">
                              Camera Brand (Auto-fill on load)
                            </label>
                            <input
                              type="text"
                              id="cameraBrand"
                              value={cameraBrand}
                              onChange={(e) => setCameraBrand(e.target.value)}
                              placeholder="e.g. Canon"
                              className="bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Camera Model */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="cameraModel" className="font-extrabold text-slate-500 dark:text-slate-550 uppercase text-[9px] tracking-wider">
                              Camera Model (Auto-fill on load)
                            </label>
                            <input
                              type="text"
                              id="cameraModel"
                              value={cameraModel}
                              onChange={(e) => setCameraModel(e.target.value)}
                              placeholder="e.g. EOS R5"
                              className="bg-slate-55 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Lens Used */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="lensUsed" className="font-extrabold text-slate-550 dark:text-slate-550 uppercase text-[9px] tracking-wider">
                              Lens Model Used
                            </label>
                            <input
                              type="text"
                              id="lensUsed"
                              value={lensUsed}
                              onChange={(e) => setLensUsed(e.target.value)}
                              placeholder="e.g. RF 24-70mm f/2.8L IS USM"
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Location Captured */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <label htmlFor="locationCaptured" className="font-extrabold text-slate-550 dark:text-slate-550 uppercase text-[9px] tracking-wider">
                              Location Captured
                            </label>
                            <input
                              type="text"
                              id="locationCaptured"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="e.g. Ladakh, India"
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Date Captured */}
                          <div className="flex flex-col gap-1.5 text-xs md:col-span-2">
                            <label htmlFor="dateCaptured" className="font-extrabold text-slate-550 dark:text-slate-555 uppercase text-[9px] tracking-wider">
                              Date Captured
                            </label>
                            <input
                              type="date"
                              id="dateCaptured"
                              value={dateCaptured}
                              onChange={(e) => setDateCaptured(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Description */}
                          <div className="flex flex-col gap-1.5 text-xs md:col-span-2">
                            <label htmlFor="photoDescription" className="font-extrabold text-slate-450 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                              Photo Description & Background Details *
                            </label>
                            <textarea
                              id="photoDescription"
                              required
                              rows={3}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Share details about the camera setup, composition settings, exif stories, or subject background info..."
                              className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium text-slate-700 dark:text-slate-350 leading-relaxed text-xs"
                            />
                          </div>

                        </div>

                        {/* Submit Button */}
                        <div className="text-right">
                          <button
                            type="submit"
                            disabled={uploading}
                            className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {uploading ? "Uploading & Analyzing EXIF..." : "Upload Photograph"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Photo Grid List */}
                  {submission.photographs.length === 0 ? (
                    <div className="glass-panel border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                      <Camera size={36} className="text-slate-300 dark:text-slate-700" />
                      <h4 className="font-display font-bold text-sm text-slate-600">No uploads in directory</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs">
                        Initiated entries folder is empty. Upload your first photograph under the contest package above to start your submission.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                      {submission.photographs.map((photo) => (
                        <div
                          key={photo.id || photo._id}
                          className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow transition-all flex flex-col justify-between"
                        >
                          {/* Image preview with watermark preview */}
                          <div className="w-full h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                            <WatermarkPreview
                              src={photo.fileUrl}
                              className="w-full h-full object-contain"
                            />
                            
                            {/* EXIF status badge */}
                            <span className={`absolute top-3 left-3 px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full shadow-sm ${
                              photo.status === 'Approved' ? 'bg-emerald-500 text-white' :
                              photo.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              EXIF {photo.status}
                            </span>
                          </div>

                          {/* Photo content */}
                          <div className="p-4 flex flex-col gap-3 flex-grow justify-between">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                                {photo.title}
                              </h4>
                              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                                {photo.category}
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                {photo.description || 'No description shared.'}
                              </p>
                            </div>

                            {/* Camera EXIF Tags Details */}
                            <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-800/40 text-[10px] flex flex-col gap-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Camera</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                  {photo.cameraBrand || 'N/A'} {photo.cameraModel || ''}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Lens</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                  {photo.lensUsed || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-105 dark:border-slate-800/40 pt-1 mt-1">
                                <span className="text-slate-400">Date</span>
                                <span className="text-slate-500">
                                  {photo.dateCaptured ? new Date(photo.dateCaptured).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>

                            {/* Actions (Only if draft & unpaid) */}
                            {!isPaid && !isFinalized && (
                              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleEditPhotoClick(photo)}
                                  className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit2 size={10} /> Edit Info
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(photo.id || photo._id)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-955/40 text-red-655 dark:text-red-400 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={10} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Right Columns (Checkout & Actions panel) */}
                <div className="flex flex-col gap-6">
                  
                  {/* Step Status summary */}
                  <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm bg-slate-50/20 dark:bg-slate-900/10">
                    <div>
                      <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-sm">
                        Submission Status Checklist
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        Track progress of your entry validation
                      </span>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                      {/* Step 1: Upload slots filled */}
                      <div className="flex items-start gap-2.5 text-xs">
                        {submission.photographs.length === submission.photoLimit ? (
                          <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">1</span>
                        )}
                        <div>
                          <span className={`font-extrabold ${submission.photographs.length === submission.photoLimit ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            Upload Photographs
                          </span>
                          <span className="text-[10px] text-slate-450 block">
                            Fill all {submission.photoLimit} registered package slots ({submission.photographs.length} filled)
                          </span>
                        </div>
                      </div>

                      {/* Step 2: Payment invoice */}
                      <div className="flex items-start gap-2.5 text-xs">
                        {isPaid ? (
                          <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">2</span>
                        )}
                        <div>
                          <span className={`font-extrabold ${isPaid ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            Checkout package fee
                          </span>
                          <span className="text-[10px] text-slate-450 block">
                            INR {submission.amount} package registration checkout
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Final lock submit */}
                      <div className="flex items-start gap-2.5 text-xs">
                        {isFinalized ? (
                          <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</span>
                        )}
                        <div>
                          <span className={`font-extrabold ${isFinalized ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            Lock Submissions
                          </span>
                          <span className="text-[10px] text-slate-450 block">
                            Sign off and finalize photographs for jury scoring
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkout trigger box (If unpaid) */}
                  {!isPaid && !isFinalized && (
                    <div className="glass-panel border border-slate-200 dark:border-slate-805 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm bg-indigo-50/10 dark:bg-indigo-950/5">
                      <div>
                        <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-sm">
                          Payment Checkout
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Purchase contest slots to authorize final submissions
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xs text-slate-500">Package amount:</span>
                        <span className="font-display font-black text-2xl text-slate-900 dark:text-white">
                          INR {submission.amount}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <CreditCard size={14} /> Checkout Package Fee
                      </button>
                    </div>
                  )}

                  {/* QR Invoice display (If paid) */}
                  {isPaid && submission.paymentDetails && (
                    <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left flex flex-col gap-3 shadow-sm bg-emerald-500/5">
                      <div className="flex items-center gap-2 text-emerald-650 dark:text-emerald-500 font-display font-extrabold text-sm">
                        <CheckCircle size={18} />
                        Payment Confirmed
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        INR {submission.amount} paid successfully. Razorpay ID: {submission.paymentId}. Reference invoice signed.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowQRInvoice(submission.paymentDetails)}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download size={12} /> View Payment Invoice / QR
                      </button>
                    </div>
                  )}

                  {/* Lock Submissions trigger (If paid and not finalized and slots full) */}
                  {isPaid && !isFinalized && (
                    <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 shadow-sm bg-amber-500/5">
                      <div>
                        <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-sm">
                          Finalize Entry Folder
                        </h4>
                        <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">
                          Lock uploaded photographs to trigger judge assignment and scoring
                        </span>
                      </div>

                      {submission.photographs.length < submission.photoLimit ? (
                        <div className="bg-amber-100/50 dark:bg-amber-950/20 border border-amber-200/50 p-3 rounded-2xl text-[10px] text-amber-700 dark:text-amber-455 leading-relaxed">
                          Fill remaining {submission.photoLimit - submission.photographs.length} photographic slots to enable final lock submissions.
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowFinalSubmitModal(true)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                        >
                          <FileCheck size={14} /> Finalize Submissions
                        </button>
                      )}
                    </div>
                  )}

                  {/* Finalized summary (If finalized) */}
                  {isFinalized && (
                    <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-left flex flex-col gap-3.5 shadow-sm bg-indigo-500/5">
                      <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400 font-display font-extrabold text-sm">
                        <Lock size={18} />
                        Submission Locked
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        Your DSLR photograph list is locked for grading review. Judges are scoring composition, storytelling, and quality benchmarks.
                      </p>

                      {/* DSLR Declaration Lock */}
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-2.5 bg-slate-50/50 dark:bg-slate-900/20 text-[10px] text-slate-400 leading-relaxed font-semibold">
                        <ShieldCheck
                          size={16}
                          className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5"
                        />
                        <p>
                          Eligibility accepted. Digital file signatures are locked. All uploads must match DSLR/Mirrorless EXIF properties.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </>
        )
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditPhotoSubmit} className="flex flex-col gap-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Edit Title */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editPhotoTitle" className="font-extrabold text-slate-450 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Photograph Title *
                  </label>
                  <input
                    type="text"
                    id="editPhotoTitle"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Edit Category */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editPhotoCategory" className="font-extrabold text-slate-455 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Contest Category *
                  </label>
                  <select
                    id="editPhotoCategory"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-855 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit Camera Brand */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editCameraBrand" className="font-extrabold text-slate-450 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Camera Brand
                  </label>
                  <input
                    type="text"
                    id="editCameraBrand"
                    value={editCameraBrand}
                    onChange={(e) => setEditCameraBrand(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-205 border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Edit Camera Model */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editCameraModel" className="font-extrabold text-slate-450 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Camera Model
                  </label>
                  <input
                    type="text"
                    id="editCameraModel"
                    value={editCameraModel}
                    onChange={(e) => setEditCameraModel(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Edit Lens Used */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editLensUsed" className="font-extrabold text-slate-450 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Lens Model Used
                  </label>
                  <input
                    type="text"
                    id="editLensUsed"
                    value={editLensUsed}
                    onChange={(e) => setEditLensUsed(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-855 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Edit Location Captured */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editLocationCaptured" className="font-extrabold text-slate-455 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Location Captured
                  </label>
                  <input
                    type="text"
                    id="editLocationCaptured"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Edit Date Captured */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="editDateCaptured" className="font-extrabold text-slate-455 dark:text-slate-500 uppercase text-[9px] tracking-wider">
                    Date Captured
                  </label>
                  <input
                    type="date"
                    id="editDateCaptured"
                    value={editDateCaptured}
                    onChange={(e) => setDateCaptured(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-855 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Edit Description */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="editPhotoDescription" className="font-extrabold text-slate-455 dark:text-slate-505 uppercase text-[9px] tracking-wider">
                    Photo Description *
                  </label>
                  <textarea
                    id="editPhotoDescription"
                    required
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-205 border-slate-805 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-505 resize-none leading-relaxed font-semibold text-slate-700 dark:text-slate-350 text-xs"
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
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold py-2 px-5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
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

      {/* FINAL SUBMISSION CONFIRMATION MODAL */}
      {showFinalSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col gap-2 items-center">
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-amber-500 rounded-2xl mb-2">
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-707 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Yes, Finalize Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

