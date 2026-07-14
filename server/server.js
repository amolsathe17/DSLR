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

const app = express();

// Middleware
// Secure CORS configuration matching allowed Vercel frontend URL & localhost
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Policy Violation: Origin "${origin}" not allowed.`));
    }
  },
  credentials: true
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    isMockMode: require("./config/db").checkMockMode()
  });
});

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DSLR Photography Contest API is running",
  });
});

// Production Build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "client", "dist", "index.html"));
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
