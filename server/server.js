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
app.use(cors());
app.use(express.json({ limit: "10mb" }));
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
