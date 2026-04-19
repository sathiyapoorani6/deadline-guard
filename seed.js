// seed.js - Run this to add sample data
const http = require("http");

const samples = [
  { subject: "Math Assignment",     date: "2026-04-21", priority: "high" },
  { subject: "Physics Lab Report",  date: "2026-04-21", priority: "high" },
  { subject: "Chemistry Exam",      date: "2026-04-21", priority: "medium" },
  { subject: "English Essay",       date: "2026-04-23", priority: "medium" },
  { subject: "History Project",     date: "2026-04-23", priority: "low" },
  { subject: "Computer Science HW", date: "2026-04-25", priority: "high" },
  { subject: "Biology Practical",   date: "2026-04-27", priority: "medium" },
  { subject: "Tamil Assignment",    date: "2026-04-28", priority: "low" },
];

async function seed() {
  for (const item of samples) {
    const res = await fetch("http://localhost:3000/add-deadline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    console.log(`[${data.status}] ${item.subject} → ${data.message}`);
  }
  console.log("\n✅ Seed done! Open http://localhost:3000");
}

seed();