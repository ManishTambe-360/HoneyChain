import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Render puts a proxy in front of the app

// Websites allowed to call this server. Set FRONTEND_URL on Render
// (comma-separated for several sites). Local development is always allowed.
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header means a non-browser request (health checks, curl)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      const err = new Error("Origin not allowed");
      err.status = 403;
      callback(err);
    },
  })
);

// Small in-memory limiter: at most UPLOAD_LIMIT uploads per IP per hour
const UPLOAD_LIMIT = Number(process.env.UPLOAD_LIMIT || 20);
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length) hits.set(ip, recent);
    else hits.delete(ip);
  }
}, WINDOW_MS).unref();

function rateLimit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= UPLOAD_LIMIT) {
    return res.status(429).json({ error: "Too many uploads. Please try again later." });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Only PDF, PNG, or JPEG files are allowed.");
    err.status = 400;
    cb(err);
  },
});

app.get("/", (req, res) => res.send("HoneyChain upload server is running."));
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/upload", rateLimit, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        maxBodyLength: Infinity,
      }
    );

    res.json({ ipfsHash: response.data.IpfsHash });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Upload to IPFS failed." });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large. The limit is 5 MB." : err.message;
    return res.status(400).json({ error: message });
  }
  res.status(err.status || 500).json({ error: err.message || "Server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));