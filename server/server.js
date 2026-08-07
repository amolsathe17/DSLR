const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { connectDB } = require("./config/db");
const seedData = require("./config/seed");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const categoryRoutes = require("./routes/categories");
const submissionRoutes = require("./routes/submissions");
const paymentRoutes = require("./routes/payments");
const judgeRoutes = require("./routes/judges");
const adminRoutes = require("./routes/admin");
const reportRoutes = require("./routes/reports");
const contestTypeRoutes = require("./routes/contestTypes");

const app = express();

// Middleware
// Official Robust CORS Middleware Configuration
app.use(cors({
  origin: true, // Mirrors request origin back dynamically to support credentials
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  // Omit allowedHeaders so it dynamically mirrors whatever headers the browser requests in preflight
}));

// Capture raw request body for Razorpay webhook verification
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf, encoding) => {
    if (req.originalUrl && req.originalUrl.includes("/webhook")) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  }
}));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Create uploads folder if it doesn't exist
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Static files
app.use("/uploads", express.static(uploadsPath));

// Middleware to ensure DB is initialized before processing API requests
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error("DB init middleware error:", err.message);
    next();
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/contest-types", contestTypeRoutes);

// Favicon handler to prevent console 404 errors
app.get("/favicon.ico", (req, res) => {
  const distPath = path.join(__dirname, "..", "client", "dist", "favicon.ico");
  if (fs.existsSync(distPath)) {
    return res.sendFile(distPath);
  }
  const publicPath = path.join(__dirname, "..", "client", "public", "favicon.ico");
  if (fs.existsSync(publicPath)) {
    return res.sendFile(publicPath);
  }
  res.status(204).end();
});

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    isMockMode: require("./config/db").checkMockMode()
  });
});

// Serve Client production build if compiled
const clientBuildPath = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  
  // SPA Fallback: Serve index.html for all non-API GET requests
  app.get(/^(?!\/api\/).*$/, (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, "index.html"));
  });
} else {
  // Development Fallback Home Route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "DSLR Photography Contest API is running",
    });
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

let initPromise = null;
const initDB = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await connectDB();
        await seedData();
      } catch (err) {
        console.error("DB Initialization Error:", err.message);
      }
    })();
  }
  return initPromise;
};

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  initDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is currently in use. Make sure old server processes are stopped.`);
      } else {
        console.error("Server startup error:", err);
      }
    });
  });
}

module.exports = app;
