// ============================================================
//  Deadline Guard v3.0
//  server.js  |  Node.js + Express
//  NEW in v3: CSV Export endpoint
// ============================================================

const express = require("express");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "deadlines.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Load / Save ----------
function loadDeadlines() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch { return []; }
}

function saveDeadlines(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

let deadlines = loadDeadlines();

// ---------- Helpers ----------
function countTasksOnDate(date, excludeId = null) {
  return deadlines.filter(d => d.date === date && d.id !== excludeId && !d.done).length;
}

function findNextFreeDate(startDate) {
  let cur = new Date(startDate);
  for (let i = 1; i <= 30; i++) {
    cur.setDate(cur.getDate() + 1);
    const s = cur.toISOString().slice(0, 10);
    if (countTasksOnDate(s) < 2) return s;
  }
  return "No free date in next 30 days";
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- Routes ----------

// POST /add-deadline
app.post("/add-deadline", (req, res) => {
  const { subject, date, priority = "medium" } = req.body;
  if (!subject || !date)
    return res.status(400).json({ status: "error", message: "Subject and date required." });

  if (countTasksOnDate(date) >= 2) {
    return res.json({
      status: "overload",
      message: `⚠️ Overload! ${countTasksOnDate(date)} tasks already on ${date}.`,
      suggestion: findNextFreeDate(date),
    });
  }

  const item = { id: generateId(), subject, date, priority, done: false, createdAt: new Date().toISOString() };
  deadlines.push(item);
  saveDeadlines(deadlines);
  res.json({ status: "success", message: `✅ "${subject}" added on ${date}.`, deadline: item });
});

// GET /deadlines
app.get("/deadlines", (req, res) => {
  res.json([...deadlines].sort((a, b) => a.date > b.date ? 1 : -1));
});

// PATCH /toggle-done/:id
app.patch("/toggle-done/:id", (req, res) => {
  const item = deadlines.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ status: "error", message: "Not found." });
  item.done = !item.done;
  saveDeadlines(deadlines);
  res.json({ status: "success", done: item.done });
});

// PUT /edit-deadline/:id
app.put("/edit-deadline/:id", (req, res) => {
  const { subject, date, priority } = req.body;
  const item = deadlines.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ status: "error", message: "Not found." });

  if (countTasksOnDate(date, req.params.id) >= 2) {
    return res.json({
      status: "overload",
      message: `⚠️ Overload on ${date}!`,
      suggestion: findNextFreeDate(date),
    });
  }

  Object.assign(item, { subject: subject || item.subject, date: date || item.date, priority: priority || item.priority });
  saveDeadlines(deadlines);
  res.json({ status: "success", deadline: item });
});

// DELETE /delete-deadline/:id
app.delete("/delete-deadline/:id", (req, res) => {
  const idx = deadlines.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: "error", message: "Not found." });
  const removed = deadlines.splice(idx, 1)[0];
  saveDeadlines(deadlines);
  res.json({ status: "success", message: `🗑️ "${removed.subject}" removed.` });
});

// ✅ NEW: GET /export-csv  → Download all deadlines as CSV
app.get("/export-csv", (req, res) => {
  // Build CSV content
  const header = "Subject,Date,Priority,Status,Created At\n";
  const rows = deadlines
    .sort((a, b) => a.date > b.date ? 1 : -1)
    .map(d =>
      `"${d.subject}","${d.date}","${d.priority}","${d.done ? "Done" : "Pending"}","${d.createdAt}"`
    )
    .join("\n");

  const csv = header + rows;

  // Set headers so browser downloads the file
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=deadlines.csv");
  res.send(csv);
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log("============================================");
  console.log("  📅 Deadline Guard v3.0 running!");
  console.log(`  🌐 Open : http://localhost:${PORT}`);
  console.log(`  💾 Data : deadlines.json`);
  console.log(`  📤 CSV  : http://localhost:${PORT}/export-csv`);
  console.log("============================================");
});
