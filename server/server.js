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
// Custom Bulletproof CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Respond immediately to preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    await seedData();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
