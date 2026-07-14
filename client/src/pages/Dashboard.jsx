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
  Lock,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import DragDropUpload from "../components/DragDropUpload";
import WatermarkPreview from "../components/WatermarkPreview";
import QRInvoice from "../components/QRInvoice";
import Certificate from "../components/Certificate";

export default function Dashboard() {
  const { apiFetch, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [categories, setCategories] = useState([]);

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

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showQRInvoice, setShowQRInvoice] = useState(null);

  // Certificate Modal State
  const [showCertificate, setShowCertificate] = useState(false);

  // Package & Declaration selection
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active event
      const eventData = await apiFetch("/api/events");
      let activeEvent = null;
      if (eventData.success && eventData.events.length > 0) {
        activeEvent =
          eventData.events.find((e) => e.status === "Active") ||
          eventData.events[0];
        setEvent(activeEvent);
        setSelectedPkgId(activeEvent.packages[0].id);
      }

      // 2. Fetch categories
      const categoryData = await apiFetch("/api/categories");
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
        }
      }
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      const API_URL = import.meta.env.VITE_API_URL;

      console.log("VITE_API_URL:", API_URL);

      if (!API_URL) {
        throw new Error(
          "VITE_API_URL is missing. Please configure the backend API URL.",
        );
      }

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
        name: "SumbaContest",
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
            }
          } catch (verifyErr) {
            setError(verifyErr.message);
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
          ondismiss: function () {
            setLoading(false);
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

  const handleFinalSubmit = async () => {
    if (
      !confirm(
        "FINAL SUBMISSION: This will lock all your photos and descriptions for grading. You cannot make changes afterwards. Proceed?",
      )
    )
      return;
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/submissions/final-submit", {
        method: "POST",
        body: JSON.stringify({ eventId: event._id }),
      });

      if (data.success) {
        setSubmission(data.submission);
        confetti({ particleCount: 100, spread: 80 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !submission && !event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
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
  const isPaid = !!submission?.paymentId;
  const isFinalized = !!submission?.isFinalSubmitted;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-200">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/20 p-4 rounded-2xl text-sm text-red-600 dark:text-red-400 mb-6">
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
            {/* Packages Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {event.packages.map((pkg) => (
                <label
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`glass-panel border-2 rounded-2xl p-6 flex flex-col gap-4 text-center cursor-pointer transition-all ${
                    selectedPkgId === pkg.id
                      ? "border-indigo-600 ring-2 ring-indigo-600/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="packageSelect"
                    checked={selectedPkgId === pkg.id}
                    onChange={() => setSelectedPkgId(pkg.id)}
                    className="sr-only"
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${selectedPkgId === pkg.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
                  >
                    {pkg.name}
                  </span>
                  <span className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
                    ₹{pkg.price}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Uploads: {pkg.maxPhotos} Photograph
                    {pkg.maxPhotos > 1 ? "s" : ""}
                  </span>
                </label>
              ))}
            </div>

            {/* DSLR eligibility declaration */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck
                  size={20}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <h3 className="font-display font-bold text-slate-900 dark:text-white">
                  DSLR Eligibility Declaration
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                In order to maintain a fair, high-caliber standard for
                photographic craftsmanship, we restrict uploads strictly to
                cameras with physical interchangeable lenses.
              </p>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 p-4 rounded-xl">
                <input
                  type="checkbox"
                  checked={acceptedDeclaration}
                  onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-indigo-950 dark:text-indigo-300 font-semibold leading-relaxed">
                  "I confirm that all submitted photographs are captured using a
                  DSLR or Mirrorless Camera. Mobile Photography is not allowed.
                  Any violation may result in immediate disqualification."
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base py-3 px-8 rounded-xl shadow-lg hover:shadow-xl self-center transition-all cursor-pointer"
            >
              Start Entry Submission
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: Submission Folder is Active */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Info, Upload, Payment controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Package Summary Box */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                Submission Directory
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Contest:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-45">
                    {event.title}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Package:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedPackage?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Payment Status:</span>
                  {isPaid ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle size={14} />
                      Paid (₹{selectedPackage?.price})
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Unpaid (₹{selectedPackage?.price})
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Upload Status:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {submission.photographs.length} of{" "}
                    {selectedPackage?.maxPhotos} photos uploaded
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                {/* 1. Payment Action */}
                {!isPaid && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                  >
                    <CreditCard size={16} />
                    Complete Online Payment
                  </button>
                )}

                {/* Show Receipt Button */}
                {isPaid && (
                  <button
                    onClick={() =>
                      setShowQRInvoice(
                        paymentSuccess || { _id: submission.paymentId },
                      )
                    }
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                  >
                    <Download size={14} />
                    Download Invoice Receipt
                  </button>
                )}

                {/* 2. Lock Final submission */}
                {!isFinalized &&
                  isPaid &&
                  submission.photographs.length > 0 && (
                    <button
                      onClick={handleFinalSubmit}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                    >
                      <Lock size={16} />
                      Finalize Entry Submission
                    </button>
                  )}

                {isFinalized && (
                  <div className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl text-xs font-bold">
                    <FileCheck size={16} />
                    Entry Finalized & Locked
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Display Box (Show only if event results are completed/published) */}
            {event.winnersPublished && isFinalized && (
              <div className="glass-panel border border-amber-500/30 bg-amber-500/5 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-display font-extrabold text-sm">
                  <Award size={18} />
                  Competition Results Out!
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The panel has published final scores. You can view your
                  grades, comments, and claim your digital credential.
                </p>
                <button
                  onClick={() => setShowCertificate(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award size={14} />
                  View & Download Certificate
                </button>
              </div>
            )}

            {/* DSLR Declaration Lock */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-2.5 bg-slate-50/50 dark:bg-slate-900/20">
              <ShieldCheck
                size={16}
                className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Eligibility accepted. Digital file signatures are locked. All
                uploads must match DSLR/Mirrorless EXIF properties.
              </p>
            </div>
          </div>

          {/* Right panel: Submissions Upload Wizard */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Upload form - display only if not finalized and package limit not met */}
            {!isFinalized &&
              submission.photographs.length < selectedPackage?.maxPhotos && (
                <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
                  <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                      Upload Photography Entry
                    </h3>
                    <p className="text-xs text-slate-500">
                      Provide details and select files. We will parse EXIF
                      metadata to auto-fill camera specifications.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Photograph Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Whispers of the Wild"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-semibold"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Camera Brand
                      </label>
                      <input
                        type="text"
                        value={cameraBrand}
                        onChange={(e) => setCameraBrand(e.target.value)}
                        placeholder="e.g. Canon"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Camera Model
                      </label>
                      <input
                        type="text"
                        value={cameraModel}
                        onChange={(e) => setCameraModel(e.target.value)}
                        placeholder="e.g. EOS R5"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Lens Model
                      </label>
                      <input
                        type="text"
                        value={lensUsed}
                        onChange={(e) => setLensUsed(e.target.value)}
                        placeholder="e.g. RF 70-200mm f/2.8L"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        Date Captured
                      </label>
                      <input
                        type="date"
                        value={dateCaptured}
                        onChange={(e) => setDateCaptured(e.target.value)}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Capture Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Corbett National Park, Uttarakhand"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Optional Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Share the storytelling element or context behind the shot..."
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-600 h-20"
                      />
                    </div>
                  </div>

                  {/* Drag & Drop uploader */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Select Files
                    </label>
                    <DragDropUpload
                      onUpload={async (photo, raw) => {
                        // Trigger EXIF analyze on the photo first
                        await handleFileAnalyze(photo);
                        // Execute upload route
                        await handleUploadPhoto(photo, raw);
                      }}
                      isUploading={uploading}
                    />
                  </div>
                </div>
              )}

            {/* List of uploaded photographs */}
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers size={18} className="text-indigo-600" />
                Uploaded Photographs ({submission.photographs.length})
              </h3>

              {submission.photographs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <ImageIcon size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">
                    No photos uploaded in this entry folder yet.
                  </p>
                  <p className="text-xs max-w-xs text-slate-500">
                    Use the entry form above to upload photographs corresponding
                    to your selected package tier.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submission.photographs.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm"
                    >
                      {/* Watermark Preview component */}
                      <WatermarkPreview
                        src={photo.fileUrl}
                        className="aspect-video w-full"
                      />

                      <div className="p-4 flex flex-col gap-3 grow justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                              {photo.title}
                            </h4>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
                              {photo.category}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {photo.description || "No description provided."}
                          </p>

                          {/* Metadata grid */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                            <div>
                              <span className="text-slate-400">Camera:</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {photo.cameraBrand} {photo.cameraModel}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Lens:</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {photo.lensUsed || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Location:</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {photo.location || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Date:</span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {photo.dateCaptured
                                  ? new Date(
                                      photo.dateCaptured,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
                              Review Status
                            </span>

                            {photo.status === "Pending" && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                                Pending Audit
                              </span>
                            )}
                            {photo.status === "Approved" && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border border-emerald-200/50">
                                <CheckCircle size={10} />
                                Approved
                              </span>
                            )}
                            {photo.status === "Rejected" && (
                              <div className="mt-0.5">
                                <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-red-200/50">
                                  Rejected
                                </span>
                                <p className="text-[9px] text-red-500 mt-1 leading-snug">
                                  Reason:{" "}
                                  {photo.rejectReason || "Guidelines violation"}
                                </p>
                              </div>
                            )}

                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mt-2">
                              DSLR Verification
                            </span>
                            {photo.dslrValidationStatus === "VERIFIED" ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border border-emerald-200/50">
                                Verified DSLR
                              </span>
                            ) : photo.dslrValidationStatus === "REJECTED" ? (
                              <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border border-red-200/50">
                                Rejected Mobile
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 border border-amber-200/50">
                                Manual Review EXIF
                              </span>
                            )}
                          </div>

                          {!isFinalized && (
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Grading remarks if winner/judging completed */}
                        {event.winnersPublished && photo.scores?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              Judge Feedback:
                            </span>
                            <p className="italic text-slate-500 dark:text-slate-400 mt-0.5">
                              "{photo.scores[0]?.remarks || "No remarks left."}"
                            </p>
                            <span className="block font-bold text-slate-800 dark:text-slate-200 mt-1 text-right">
                              Grade: {photo.scores[0]?.averageScore}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPI/CREDIT CARD MOCK PAYMENT GATEWAY DRAWER */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-850">
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

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">
                  Payment Option
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                        : "border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    UPI / QR Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Card")}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === "Card"
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                        : "border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                </div>
              </div>

              {paymentMethod === "Card" && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex flex-col gap-1 text-[11px]">
                    <label className="font-semibold text-slate-400">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-400">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        placeholder="12/29"
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-400">
                        CVV
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-[11px] animate-in slide-in-from-bottom-2 duration-200">
                  <label className="font-semibold text-slate-400">
                    UPI Address ID
                  </label>
                  <input
                    type="text"
                    placeholder="username@okaxis"
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer text-xs text-center"
              >
                Cancel Checkout
              </button>
              <button
                type="button"
                onClick={handlePayment}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs text-center"
              >
                Pay ₹{selectedPackage?.price}.00
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
    </div>
  );
}
