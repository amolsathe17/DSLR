import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Calendar,
  Award,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles,
  MapPin,
  Star,
  Palette,
  PenLine,
  Scissors,
  Trophy,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  Image,
  ChevronDown,
  BarChart2,
  BookOpen,
  Layers,
  Clock,
  Lock,
  TrendingUp,
  Gift,
  Target,
  Flame,
  AlertCircle,
  FileText,
  Info,
  List,
  BadgeCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Event type helpers ────────────────────────────────────────────────────────

const EVENT_ICONS = {
  Photography: Camera,
  Painting: Palette,
  Drawing: PenLine,
  "Paper Craft": Scissors,
  default: Image,
};

const EVENT_COLORS = {
  Photography: {
    bg: "bg-indigo-50 border-indigo-200/60",
    badge: "bg-indigo-100 text-indigo-700",
    icon: "text-indigo-600",
    btn: "bg-indigo-600 hover:bg-indigo-700",
    glow: "from-indigo-400/20",
    countdown: "text-indigo-600",
    header: "from-indigo-600 to-violet-700",
    accent: "indigo",
  },
  Painting: {
    bg: "bg-rose-50 border-rose-200/60",
    badge: "bg-rose-100 text-rose-700",
    icon: "text-rose-500",
    btn: "bg-rose-500 hover:bg-rose-600",
    glow: "from-rose-400/20",
    countdown: "text-rose-500",
    header: "from-rose-500 to-pink-600",
    accent: "rose",
  },
  Drawing: {
    bg: "bg-amber-50 border-amber-200/60",
    badge: "bg-amber-100 text-amber-700",
    icon: "text-amber-500",
    btn: "bg-amber-500 hover:bg-amber-600",
    glow: "from-amber-400/20",
    countdown: "text-amber-500",
    header: "from-amber-500 to-orange-600",
    accent: "amber",
  },
  "Paper Craft": {
    bg: "bg-emerald-50 border-emerald-200/60",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "text-emerald-600",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    glow: "from-emerald-400/20",
    countdown: "text-emerald-600",
    header: "from-emerald-600 to-teal-700",
    accent: "emerald",
  },
  default: {
    bg: "bg-slate-50 border-slate-200/60",
    badge: "bg-slate-100 text-slate-600",
    icon: "text-slate-500",
    btn: "bg-slate-700 hover:bg-slate-800",
    glow: "from-slate-400/20",
    countdown: "text-slate-700",
    header: "from-slate-600 to-slate-800",
    accent: "slate",
  },
};

function getColors(type) {
  return EVENT_COLORS[type] || EVENT_COLORS.default;
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = +new Date(deadline) - +new Date();
      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return timeLeft;
}

function CountdownUnit({ value, label, colorClass }) {
  return (
    <div className="flex flex-col items-center bg-white border border-slate-200 px-3 py-2 rounded-xl min-w-14 shadow-sm">
      <span
        className={`font-display font-black text-xl tabular-nums leading-none ${colorClass}`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 text-slate-400">
        {label}
      </span>
    </div>
  );
}

function PrizeRow({ prize, idx, faded }) {
  const medals = ["🥇", "🥈", "🥉"];
  const base = faded
    ? "bg-slate-50 border-slate-100 text-slate-400"
    : idx === 0
      ? "bg-amber-50 border-amber-200/70 text-amber-800"
      : idx === 1
        ? "bg-slate-50 border-slate-200 text-slate-600"
        : "bg-orange-50 border-orange-100 text-orange-700";

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold ${base}`}
    >
      <span className="text-base shrink-0">{medals[idx] || "🏅"}</span>
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold text-[10px] uppercase tracking-wider ${faded ? "opacity-60" : "opacity-70"}`}
        >
          {prize.rank}
        </p>
        <p className="font-black text-sm truncate">{prize.reward}</p>
        {prize.description && (
          <p
            className={`text-[10px] truncate mt-0.5 ${faded ? "opacity-40" : "opacity-60"}`}
          >
            {prize.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Active Event Detail Card ─────────────────────────────────────────────────

function ActiveEventDetailCard({ event, onEnroll }) {
  const colors = getColors(event.eventType);
  const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.default;
  const countdown = useCountdown(event.deadline);
  const [expanded, setExpanded] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);

  return (
    <div
      className={`group relative flex flex-col rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border-2 ${colors.bg}`}
    >
      <div
        className={`absolute inset-0 bg-linear-to-br ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      {/* Coloured header — uniform height */}
      <div
        className={`relative bg-linear-to-br ${colors.header} px-6 pt-6 pb-5 text-white flex flex-col justify-between min-h-[180px]`}
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20">
              <Icon size={24} className="text-white" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2.5 py-1 rounded-full bg-emerald-400 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live · Active
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider">
                {event.eventType}
              </span>
            </div>
          </div>
          <h3 className="font-display font-black text-2xl leading-tight">
            {event.title}
          </h3>
        </div>

        {event.theme ? (
          <p className="text-white/75 text-xs mt-1.5 italic leading-relaxed">
            "{themeExpanded ? event.theme : (event.theme.length > 70 ? event.theme.slice(0, 70) + "..." : event.theme)}"
            {event.theme.length > 70 && (
              <button
                type="button"
                onClick={() => setThemeExpanded(!themeExpanded)}
                className="ml-1 text-white underline font-bold hover:text-white/80 cursor-pointer text-xs"
              >
                {themeExpanded ? "less" : "more"}
              </button>
            )}
          </p>
        ) : (
          <div />
        )}
      </div>

      {/* Description — fixed height so countdown aligns across cards */}
      {event.description && (
        <div className="relative px-6 pt-4 min-h-20">
          <p className="text-sm text-slate-500 leading-relaxed">
            {expanded
              ? event.description
              : event.description.slice(0, 120) +
                (event.description.length > 120 ? "..." : "")}
            {event.description.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-1 text-indigo-500 font-bold text-xs cursor-pointer hover:underline"
              >
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
        </div>
      )}
      {!event.description && <div className="min-h-20" />}

      {/* Countdown — always at this fixed position */}
      <div className="relative mx-5 mt-4">
        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-lg">
          {countdown.expired ? (
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Submissions Closed
            </p>
          ) : (
            <>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center mb-2.5">
                ⏱ Time Remaining to Submit
              </p>
              <div className="flex items-center justify-center gap-2">
                <CountdownUnit
                  value={countdown.days}
                  label="Days"
                  colorClass={colors.countdown}
                />
                <span className="text-slate-300 font-black text-lg">:</span>
                <CountdownUnit
                  value={countdown.hours}
                  label="Hrs"
                  colorClass={colors.countdown}
                />
                <span className="text-slate-300 font-black text-lg">:</span>
                <CountdownUnit
                  value={countdown.minutes}
                  label="Min"
                  colorClass={colors.countdown}
                />
                <span className="text-slate-300 font-black text-lg">:</span>
                <CountdownUnit
                  value={countdown.seconds}
                  label="Sec"
                  colorClass={colors.countdown}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prizes */}
      {event.prizes?.length > 0 && (
        <div className="relative px-6 pt-5 flex flex-col gap-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Trophy size={10} /> Prize Structure
          </p>
          {event.prizes.slice(0, 3).map((p, i) => (
            <PrizeRow key={i} prize={p} idx={i} faded={false} />
          ))}
        </div>
      )}

      {/* Packages */}
      {event.packages?.length > 0 && (
        <div className="relative px-6 pt-4 flex flex-col gap-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Star size={10} /> Entry Packages
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {event.packages.map((pkg, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${i === 0 ? "border-indigo-200 bg-indigo-50/60" : "border-slate-100 bg-slate-50"}`}
              >
                <div>
                  <p className="font-bold text-slate-800">{pkg.name}</p>
                  {pkg.description && (
                    <p className="text-[10px] text-slate-400">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <span
                  className={`font-black text-sm ${i === 0 ? "text-indigo-600" : "text-slate-700"}`}
                >
                  ₹{pkg.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="relative px-6 pt-4 pb-4 flex flex-col gap-2 text-[11px] text-slate-500 grow">
        <div className="flex items-center gap-2">
          <Calendar size={12} className="shrink-0 text-slate-400" />
          <span>
            Submission Deadline:{" "}
            <strong className="text-slate-700">
              {new Date(event.deadline).toLocaleDateString(undefined, {
                dateStyle: "long",
              })}
            </strong>
          </span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
        {event.exhibitionFromDate && (
          <div className="flex items-center gap-2">
            <Calendar size={12} className="shrink-0 text-slate-400" />
            <span>
              Exhibition:{" "}
              <strong className="text-slate-700">
                {new Date(event.exhibitionFromDate).toLocaleDateString(
                  undefined,
                  { dateStyle: "medium" },
                )}
              </strong>
              {event.exhibitionToDate &&
                ` – ${new Date(event.exhibitionToDate).toLocaleDateString(undefined, { dateStyle: "medium" })}`}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative px-6 pb-6 pt-2">
        <button
          onClick={() => onEnroll(event)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${colors.btn}`}
        >
          Enroll in This Event <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Upcoming Event Card ───────────────────────────────────────────────────────

function UpcomingEventCard({ event, onEnroll }) {
  const colors = getColors(event.eventType);
  const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.default;
  const [themeExpanded, setThemeExpanded] = useState(false);

  return (
    <div
      className={`group relative flex flex-col rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border ${colors.bg}`}
    >
      <div
        className={`absolute inset-0 bg-linear-to-br ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div
        className={`relative bg-linear-to-br ${colors.header} px-5 pt-5 pb-8 text-white flex flex-col justify-between min-h-[165px]`}
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/20">
              <Icon size={20} className="text-white" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-400 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Clock size={8} /> Upcoming
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider">
                {event.eventType}
              </span>
            </div>
          </div>
          <h3 className="font-display font-black text-lg leading-tight line-clamp-2">
            {event.title}
          </h3>
        </div>

        {event.theme ? (
          <p className="text-white/75 text-[11px] mt-1 italic leading-relaxed">
            "{themeExpanded ? event.theme : (event.theme.length > 70 ? event.theme.slice(0, 70) + "..." : event.theme)}"
            {event.theme.length > 70 && (
              <button
                type="button"
                onClick={() => setThemeExpanded(!themeExpanded)}
                className="ml-1 text-white underline font-bold hover:text-white/80 cursor-pointer text-xs"
              >
                {themeExpanded ? "less" : "more"}
              </button>
            )}
          </p>
        ) : (
          <div />
        )}
      </div>

      <div className="relative mx-4 -mt-4 z-10">
        <div className="bg-white border border-blue-100 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
          <Clock size={13} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
              Registration Opens Soon
            </p>
            {event.deadline && (
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Event Deadline:{" "}
                {new Date(event.deadline).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {event.description && (
        <p className="relative px-5 pt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
          {event.description}
        </p>
      )}

      {event.prizes?.length > 0 && (
        <div className="relative px-5 pt-4 flex flex-col gap-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
            Prizes (Preview)
          </p>
          {event.prizes.slice(0, 2).map((p, i) => (
            <PrizeRow key={i} prize={p} idx={i} faded={false} />
          ))}
        </div>
      )}

      <div className="relative px-5 pt-4 pb-3 flex flex-col gap-1.5 text-[10px] text-slate-500 grow">
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
        {event.packages?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={11} className="shrink-0 text-slate-400" />
            <span>
              From{" "}
              <strong className="text-slate-700">
                ₹{Math.min(...event.packages.map((p) => p.price))}
              </strong>{" "}
              · {event.packages.length} package
              {event.packages.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="relative px-5 pb-5 pt-1">
        <button
          onClick={() => onEnroll(event)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 border-blue-300 text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
        >
          Register to Get Notified <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Closed Event Card ──────────────────────────────────────────────────────────

function ClosedEventCard({ event }) {
  const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.default;
  const [themeExpanded, setThemeExpanded] = useState(false);

  return (
    <div className="group relative flex flex-col rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute inset-0 bg-slate-50/40 pointer-events-none rounded-3xl" />
      <div className="relative bg-linear-to-br from-slate-500 to-slate-700 px-5 pt-5 pb-8 text-white flex flex-col justify-between min-h-[165px]">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/20">
              <Icon size={20} className="text-white/80" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded-full bg-slate-400 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Lock size={8} /> Closed
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white/70 text-[9px] font-bold uppercase tracking-wider">
                {event.eventType}
              </span>
            </div>
          </div>
          <h3 className="font-display font-black text-lg leading-tight line-clamp-2 text-white/90">
            {event.title}
          </h3>
        </div>

        {event.theme ? (
          <p className="text-white/70 text-[11px] mt-1 italic leading-relaxed">
            "{themeExpanded ? event.theme : (event.theme.length > 70 ? event.theme.slice(0, 70) + "..." : event.theme)}"
            {event.theme.length > 70 && (
              <button
                type="button"
                onClick={() => setThemeExpanded(!themeExpanded)}
                className="ml-1 text-white underline font-bold hover:text-white/80 cursor-pointer text-xs"
              >
                {themeExpanded ? "less" : "more"}
              </button>
            )}
          </p>
        ) : (
          <div />
        )}
      </div>

      <div className="relative mx-4 -mt-4 z-10">
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
          <Lock size={13} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Submissions Closed
            </p>
            {event.deadline && (
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Closed:{" "}
                {new Date(event.deadline).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {event.description && (
        <p className="relative px-5 pt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
          {event.description}
        </p>
      )}

      {event.prizes?.length > 0 && (
        <div className="relative px-5 pt-4 flex flex-col gap-1.5">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">
            Prize Structure
          </p>
          {event.prizes.slice(0, 3).map((p, i) => (
            <PrizeRow key={i} prize={p} idx={i} faded={true} />
          ))}
        </div>
      )}

      <div className="relative px-5 pt-4 pb-4 flex flex-col gap-1.5 text-[10px] text-slate-400 grow">
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0 text-slate-300" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
        {event.winnersPublished && (
          <div className="flex items-center gap-1.5">
            <Trophy size={11} className="shrink-0 text-amber-400" />
            <span className="text-amber-600 font-bold">
              Winners have been announced!
            </span>
          </div>
        )}
      </div>

      <div className="relative px-5 pb-5 pt-1">
        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 select-none">
          <Lock size={12} /> Registration Closed
        </div>
      </div>
    </div>
  );
}

// ── Rules & Regulations ────────────────────────────────────────────────────────

const RULES = [
  {
    icon: BadgeCheck,
    color: "text-indigo-600 bg-indigo-50",
    title: "Eligibility",
    items: [
      "Participants must be registered on the platform with valid credentials.",
      "Each participant may submit entries per the package chosen.",
      "Entries must be the original work of the participant.",
      "Participants must not have submitted the same work to another active competition simultaneously.",
    ],
  },
  {
    icon: Camera,
    color: "text-emerald-600 bg-emerald-50",
    title: "Submission Requirements",
    items: [
      "All submissions must be uploaded digitally through the participant portal before the stated deadline.",
      "Accepted file formats: JPEG, JPG, PNG (high resolution, minimum 2MB).",
      "Each photo must include a title, category, camera/equipment used, and date captured.",
      "Submissions must not contain watermarks, logos, or photographer signatures.",
      "Entries must not have been digitally manipulated beyond standard photo editing (brightness, contrast, cropping).",
    ],
  },
  {
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50",
    title: "Content Restrictions",
    items: [
      "No offensive, violent, or obscene content will be accepted.",
      "Photographs featuring individuals require written consent from the subject.",
      "Plagiarism or copying from other artists is strictly prohibited and will result in immediate disqualification.",
      "AI-generated or AI-assisted images are not permitted.",
    ],
  },
  {
    icon: Trophy,
    color: "text-rose-600 bg-rose-50",
    title: "Judging & Awards",
    items: [
      "All entries are judged by an independent expert jury panel.",
      "Judging criteria: Creativity (25%), Composition (25%), Technical Quality (25%), Storytelling & Impact (25%).",
      "The jury's decision is final and binding.",
      "Winners will be announced on the platform and notified via email.",
      "Prizes will be disbursed within 30 days of winner announcement.",
    ],
  },
  {
    icon: XCircle,
    color: "text-red-600 bg-red-50",
    title: "Disqualification",
    items: [
      "Late submissions will not be accepted under any circumstances.",
      "Providing false information during registration will lead to permanent disqualification.",
      "Any attempt to influence judges or manipulate results will result in immediate removal.",
      "Violations of the content policy will result in account suspension.",
    ],
  },
  {
    icon: FileText,
    color: "text-slate-600 bg-slate-100",
    title: "Intellectual Property & Rights",
    items: [
      "Participants retain full copyright to their submitted works.",
      "By entering, participants grant the organizers a non-exclusive license to display, publish, and promote submitted works on official platforms.",
      "Credit will always be given to the original creator when works are published.",
    ],
  },
];

const GUIDELINES = [
  {
    step: "01",
    icon: Users,
    title: "Create Your Account",
    desc: "Register on the platform with your name, email, and a secure password. Verify your email to activate your participant account.",
  },
  {
    step: "02",
    icon: Target,
    title: "Browse & Select an Event",
    desc: "Visit this Event Info page to view all active competitions. Choose the event that matches your art form and interests.",
  },
  {
    step: "03",
    icon: Star,
    title: "Choose a Package & Pay",
    desc: "Select an entry package that suits your budget. Pay securely via UPI or other available payment methods to confirm your enrollment.",
  },
  {
    step: "04",
    icon: Image,
    title: "Upload Your Entries",
    desc: "Log in to your Participant Dashboard, go to My Entries, and upload your photographs or artwork. Fill in all required metadata fields accurately.",
  },
  {
    step: "05",
    icon: CheckCircle2,
    title: "Final Submission",
    desc: "Review all your entries before the deadline, then click 'Final Submit'. Entries cannot be modified after final submission.",
  },
  {
    step: "06",
    icon: Trophy,
    title: "Wait for Results",
    desc: "After the deadline, judges will evaluate all entries. Results will be published on the platform and winners notified via email.",
  },
];

// ── Main EventInfo Page ────────────────────────────────────────────────────────

export default function EventInfo() {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();

  const [allEvents, setAllEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [closedEvents, setClosedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllActive, setShowAllActive] = useState(false);

  const activeRef = useRef(null);
  const rulesRef = useRef(null);
  const guidelinesRef = useRef(null);

  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiFetch("/api/events");
        if (data.success && data.events?.length > 0) {
          const all = data.events;
          const active = all.filter((e) => e.status === "Active");
          const upcoming = all.filter((e) => e.status === "Draft");
          const closed = all.filter((e) =>
            ["Closed", "Completed", "Archived"].includes(e.status),
          );
          setAllEvents(all);
          setActiveEvents(active);
          setUpcomingEvents(upcoming);
          setClosedEvents(closed);
        }
      } catch (err) {
        console.error("EventInfo: failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleEnroll = (event) => {
    navigate("/register", { state: { eventId: event._id, event } });
  };

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const displayedActive = showAllActive
    ? activeEvents
    : activeEvents.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Loading Events...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      {/* ══════════════════════════ PAGE HEADER with event-bg.jpg ══════════════ */}
      <section className="text-white py-10 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/event-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-10 bg-slate-900/75" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #818cf8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-5">
          <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight tracking-tight">
            Events &amp; Competition
            <br />
            <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Information Centre
            </span>
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            Explore all active contests, upcoming events, rules &amp;
            regulations, and submission guidelines — everything you need to
            participate and compete.
          </p>

          {/* Quick Nav */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {[
              {
                label: "Rules & Regulations",
                ref: rulesRef,
                icon: FileText,
                color: "bg-indigo-500 hover:bg-indigo-400",
              },
              {
                label: "How to Participate",
                ref: guidelinesRef,
                icon: BookOpen,
                color: "bg-violet-500 hover:bg-violet-400",
              },
            ].map(({ label, ref, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => scrollTo(ref)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all ${color}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ EVENTS TABS SECTION ════════════════════════════ */}
      <section
        ref={activeRef}
        className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* 3 Tabs Header */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "active"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flame
                size={16}
                className={
                  activeTab === "active"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                }
              />
              <span>Active Events</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === "active"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {activeEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "upcoming"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock
                size={16}
                className={
                  activeTab === "upcoming"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400"
                }
              />
              <span>Upcoming Events</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === "upcoming"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {upcomingEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "past"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Lock
                size={16}
                className={
                  activeTab === "past"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-400"
                }
              />
              <span>Past Events</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === "past"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {closedEvents.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Active Events */}
        {activeTab === "active" && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
                  Active Events
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Select any active event below to enroll and start your artistic journey.
                </p>
              </div>
              {activeEvents.length > 6 && (
                <button
                  onClick={() => setShowAllActive(!showAllActive)}
                  className="shrink-0 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-all cursor-pointer"
                >
                  {showAllActive ? "Show Less" : `View All ${activeEvents.length}`}
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${showAllActive ? "rotate-90" : ""}`}
                  />
                </button>
              )}
            </div>

            {activeEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <AlertCircle size={28} className="text-slate-300" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-700">
                  No Active Events Right Now
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Check upcoming events tab or register to get notified when new competitions open.
                </p>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
                >
                  Register to Get Notified
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {displayedActive.map((event) => (
                  <ActiveEventDetailCard
                    key={event._id}
                    event={event}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upcoming Events */}
        {activeTab === "upcoming" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
                Upcoming Events
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-lg">
                These events are opening soon. Select an event to register and be first in line.
              </p>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Clock size={28} className="text-slate-300" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-700">
                  No Upcoming Events Right Now
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  New events are announced regularly. Stay tuned!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <UpcomingEventCard
                    key={event._id}
                    event={event}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Past Events */}
        {activeTab === "past" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-tight">
                Past Events
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-lg">
                These competitions have concluded. Winners were announced and certificates issued.
              </p>
            </div>

            {closedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Lock size={28} className="text-slate-300" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-700">
                  No Past Events
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  No past completed competitions to display.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {closedEvents.map((event) => (
                  <ClosedEventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════ RULES & REGULATIONS ══════════════════════ */}
      <section
        ref={rulesRef}
        className="py-16 bg-slate-200 border-y border-slate-100 mt-10 "
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <FileText size={11} /> Official Rules
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              Rules & Regulations
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              All participants must read, understand, and agree to the following
              rules before submitting entries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RULES.map(({ icon: Icon, color, title, items }) => (
              <div
                key={title}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color.split(" ")[1]}`}
                  >
                    <Icon size={18} className={color.split(" ")[0]} />
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    {title}
                  </h3>
                </div>
                <ul className="flex flex-col gap-2">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Important Notice:</strong> These rules apply to all events
              hosted on this platform unless otherwise specified in the
              individual event details. Organizers reserve the right to update
              rules with reasonable notice. By submitting your entry, you
              confirm you have read and agree to all terms.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ GUIDELINES / HOW TO ══════════════════════ */}
      <section ref={guidelinesRef} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200/60 text-violet-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <BookOpen size={11} /> Step-by-Step Guide
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl bg-linear-to-r from-cyan-300 to-blue-900 bg-clip-text text-transparent">
              How to Participate
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Follow these six simple steps to register, submit your work, and
              compete for prizes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUIDELINES.map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                className="relative flex flex-col gap-4 bg-linear-to-r from-cyan-300 to-blue-300 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                    <Icon
                      size={18}
                      className="text-indigo-600 group-hover:text-white transition-colors"
                    />
                  </div>
                  <span className="font-display font-black text-3xl text-slate-500 group-hover:text-indigo-100 transition-colors">
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-black leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 bg-slate-200 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-1">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              Ready to Showcase Your Talent?
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Ready to compete? Create your account and start participating
              today.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="bg-indigo-600 hover:bg-red-700 text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/login"
                    className="bg-indigo-600 hover:bg-red-700 text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-8 rounded-2xl cursor-pointer transition-all shadow-md"
                >
                  Go to My Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
