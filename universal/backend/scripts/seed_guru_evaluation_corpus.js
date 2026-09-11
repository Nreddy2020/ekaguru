#!/usr/bin/env node
/**
 * Builds (or reuses) the v1 Guru evaluation corpus manifest and imports it.
 *
 * The manifest lists real built-in textbook pages that exist as scans under
 * universal/frontend/public/textbooks. Each page is evaluated at all five depths.
 * Cases are inserted with skipDuplicates, so rerunning is safe and never
 * touches existing reviews or lessons.
 *
 *   node scripts/seed_guru_evaluation_corpus.js            # write manifest if missing, import
 *   node scripts/seed_guru_evaluation_corpus.js --dry-run  # only report what would be imported
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

const DEPTHS = ["basis", "developing", "proficient", "advanced", "deep"];
const BOOKS = {
  "evs-class-5": { subject: "Environmental Studies", gradeBand: "PRIMARY" },
  "maths-class-5": { subject: "Mathematics", gradeBand: "PRIMARY" },
  "science-class-6": { subject: "Science", gradeBand: "MIDDLE_SCHOOL" },
  "social-class-5": { subject: "Social Studies", gradeBand: "PRIMARY" },
};
const PAGES_PER_BOOK = 8;
const manifestPath = path.resolve(__dirname, "..", "..", "..", "docs", "evaluation", "guru-evaluation-corpus.v1.json");
const scanRoot = process.env.TEXTBOOK_SCAN_DIR || path.resolve(__dirname, "..", "..", "frontend", "public", "textbooks");

function availablePages(bookId) {
  const dir = path.join(scanRoot, bookId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => /^page-(\d+)\.png$/.exec(f))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

function buildManifest() {
  const cases = [];
  for (const [bookId, meta] of Object.entries(BOOKS)) {
    const pages = availablePages(bookId).filter((p) => p > 4); // skip front matter
    if (!pages.length) continue;
    // Evenly spaced sample across the book so the corpus covers early, middle and late chapters.
    const chosen = new Set();
    for (let i = 0; i < PAGES_PER_BOOK; i++) {
      const index = Math.floor(((i + 0.5) / PAGES_PER_BOOK) * pages.length);
      chosen.add(pages[Math.min(pages.length - 1, index)]);
    }
    // Pages with verified evidence from earlier milestones are always included.
    if (bookId === "evs-class-5") for (const p of [44, 45, 46, 47, 73]) if (pages.includes(p)) chosen.add(p);
    for (const physicalPage of [...chosen].sort((a, b) => a - b))
      for (const depth of DEPTHS)
        cases.push({ bookId, physicalPage, subject: meta.subject, gradeBand: meta.gradeBand, language: "en", depth });
  }
  return { version: 1, generatedAt: new Date().toISOString(), rubricVersion: 1, cases };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let manifest;
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    console.log("Using existing manifest", manifestPath, "with", manifest.cases.length, "cases");
  } else {
    manifest = buildManifest();
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log("Wrote manifest", manifestPath, "with", manifest.cases.length, "cases");
  }
  if (dryRun) return;
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const result = await prisma.guruEvaluationCase.createMany({
      data: manifest.cases.map((c) => ({ ...c, createdBy: "corpus-seed-v1" })),
      skipDuplicates: true,
    });
    console.log("Imported", result.count, "new cases;", manifest.cases.length - result.count, "already present");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
