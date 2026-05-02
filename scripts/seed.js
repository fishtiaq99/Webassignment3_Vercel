const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("fs")
  .readFileSync(".env.local", "utf8")
  .split("\n")
  .forEach((line) => {
    const [key, ...val] = line.split("=");
    if (key && val.length) process.env[key.trim()] = val.join("=").trim();
  });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true },
});

const leadSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    propertyInterest: String,
    budget: Number,
    budgetFormatted: String,
    status: { type: String, default: "New" },
    priority: String,
    score: Number,
    notes: String,
    source: String,
    location: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastActivityAt: { type: Date, default: Date.now },
    followUpDate: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

function getScoring(budget) {
  if (budget > 20000000) return { priority: "High", score: 100 };
  if (budget >= 10000000) return { priority: "Medium", score: 60 };
  return { priority: "Low", score: 20 };
}

function formatBudget(budget) {
  if (budget >= 1000000000) return `${(budget / 1000000000).toFixed(1)}B PKR`;
  if (budget >= 1000000) return `${(budget / 1000000).toFixed(1)}M PKR`;
  return `${budget.toLocaleString()} PKR`;
}

// Helpers for dates
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");

  // Only clear leads, keep existing users
  await Lead.deleteMany({});
  console.log("✓ Cleared old leads");

  // Fetch existing agents to assign leads to them
  const agents = await User.find({ role: "agent", isActive: true });
  const agent1 = agents[0];
  const agent2 = agents[1] || agents[0];

  console.log(`✓ Using agents: ${agent1?.name}, ${agent2?.name}`);

  const leadsData = [
    {
      name: "Ahmed Khan",
      email: "ahmed@gmail.com",
      phone: "03331234567",
      propertyInterest: "House",
      budget: 25000000,
      notes: "Interested in 5 marla house in DHA Phase 5",
      source: "Facebook Ads",
      location: "DHA Phase 5, Lahore",
      assignedTo: agent1?._id,
      status: "Contacted",
      followUpDate: daysAgo(2),           // OVERDUE - 2 days ago
      lastActivityAt: daysAgo(3),
    },
    {
      name: "Usman Ali",
      email: "usman@gmail.com",
      phone: "03451234567",
      propertyInterest: "Plot",
      budget: 15000000,
      notes: "Looking for investment plot in Bahria Town",
      source: "Walk-in",
      location: "Bahria Town, Rawalpindi",
      assignedTo: agent2?._id,
      status: "In Progress",
      followUpDate: daysFromNow(1),       // UPCOMING - tomorrow
      lastActivityAt: daysAgo(1),
    },
    {
      name: "Fatima Noor",
      email: "fatima@gmail.com",
      phone: "03111234567",
      propertyInterest: "Apartment",
      budget: 8000000,
      notes: "Budget is limited, needs 2 bed apartment",
      source: "Website",
      location: "Gulberg, Lahore",
      assignedTo: agent1?._id,
      status: "New",
      followUpDate: daysFromNow(2),       // UPCOMING - in 2 days
      lastActivityAt: daysAgo(2),
    },
    {
      name: "Bilal Ahmed",
      email: "bilal@gmail.com",
      phone: "03211234567",
      propertyInterest: "Commercial",
      budget: 30000000,
      notes: "Urgent deal, has cash ready",
      source: "Referral",
      location: "Blue Area, Islamabad",
      assignedTo: agent2?._id,
      status: "Contacted",
      followUpDate: daysAgo(5),           // OVERDUE - 5 days ago
      lastActivityAt: daysAgo(6),
    },
    {
      name: "Zara Sheikh",
      email: "zara@gmail.com",
      phone: "03001112233",
      propertyInterest: "Villa",
      budget: 50000000,
      notes: "Looking for luxury villa",
      source: "Phone",
      location: "F-7, Islamabad",
      assignedTo: agent1?._id,
      status: "New",
      followUpDate: null,                 // STALE - no follow-up set, no activity
      lastActivityAt: daysAgo(10),
    },
    {
      name: "Hassan Raza",
      email: "hassan@gmail.com",
      phone: "03009998877",
      propertyInterest: "House",
      budget: 12000000,
      notes: "First time buyer",
      source: "Facebook Ads",
      location: "Johar Town, Lahore",
      assignedTo: null,                   // Unassigned
      status: "New",
      followUpDate: null,
      lastActivityAt: daysAgo(8),         // STALE
    },
    {
      name: "Sana Mirza",
      email: "sana@gmail.com",
      phone: "03151234567",
      propertyInterest: "Apartment",
      budget: 22000000,
      notes: "Wants 3 bed in Gulberg",
      source: "Website",
      location: "Gulberg III, Lahore",
      assignedTo: agent2?._id,
      status: "In Progress",
      followUpDate: daysFromNow(3),       // UPCOMING - in 3 days (edge of window)
      lastActivityAt: daysAgo(1),
    },
    {
      name: "Kamran Malik",
      email: "kamran@gmail.com",
      phone: "03001239876",
      propertyInterest: "Plot",
      budget: 35000000,
      notes: "Cash buyer, serious investor",
      source: "Referral",
      location: "Bahria Phase 8, Rawalpindi",
      assignedTo: agent1?._id,
      status: "Closed",
      followUpDate: null,
      lastActivityAt: daysAgo(1),
    },
  ];

  const leads = leadsData.map((lead) => {
    const { priority, score } = getScoring(lead.budget);
    return {
      ...lead,
      priority,
      score,
      budgetFormatted: formatBudget(lead.budget),
    };
  });

  await Lead.insertMany(leads);
  console.log("✓ Leads created with follow-up dates");

  console.log("\n=== FOLLOW-UP SUMMARY ===");
  console.log("Overdue  → Ahmed Khan (2 days ago), Bilal Ahmed (5 days ago)");
  console.log("Upcoming → Usman Ali (tomorrow), Fatima Noor (2 days), Sana Mirza (3 days)");
  console.log("Stale    → Zara Sheikh (10 days inactive), Hassan Raza (8 days inactive)");

  console.log("\n=== LOGIN DETAILS ===");
  console.log("Admin  → admin@test.com / 123456");
  console.log(`Agent1 → ${agent1?.email} / 123456`);
  console.log(`Agent2 → ${agent2?.email} / 123456`);

  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});