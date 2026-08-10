const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
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

// Universal CORS & Preflight OPTIONS Middleware to support Vercel, Railway, and cross-origin clients
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma'
  );

  // Instantly resolve browser OPTIONS preflight requests before any DB or route processing
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
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

// API Routes (Dual mounted under /api and root to support all Vercel/serverless environments)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/events", eventRoutes);
app.use("/events", eventRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/categories", categoryRoutes);

app.use("/api/submissions", submissionRoutes);
app.use("/submissions", submissionRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentRoutes);

app.use("/api/judges", judgeRoutes);
app.use("/judges", judgeRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/reports", reportRoutes);
app.use("/reports", reportRoutes);

app.use("/api/contest-types", contestTypeRoutes);
app.use("/contest-types", contestTypeRoutes);

// Image proxy route to eliminate cross-origin third-party Tracking Prevention browser warnings permanently
app.get("/api/image-proxy", (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send("Missing image url");
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).send("Invalid protocol");
    }

    const clientModule = parsedUrl.protocol === "https:" ? https : http;

    const proxyReq = clientModule.get(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    }, (proxyRes) => {
      // Follow HTTP 301/302 redirects if Cloudinary redirects
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return res.redirect(proxyRes.headers.location);
      }

      // If upstream image server returns 404 (missing/deleted Cloudinary image), redirect to fallback image
      if (proxyRes.statusCode === 404) {
        return res.redirect('/wild.jpg');
      }

      res.status(proxyRes.statusCode || 200);
      if (proxyRes.headers["content-type"]) {
        res.setHeader("Content-Type", proxyRes.headers["content-type"]);
      } else {
        res.setHeader("Content-Type", "image/jpeg");
      }
      
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");

      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("Image proxy request error:", err.message);
      if (!res.headersSent) {
        res.status(500).send("Failed to fetch image");
      }
    });

    proxyReq.setTimeout(12000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).send("Image proxy request timeout");
      }
    });
  } catch (err) {
    console.error("Invalid proxy URL:", err.message);
    if (!res.headersSent) {
      res.status(400).send("Invalid image URL");
    }
  }
});

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
