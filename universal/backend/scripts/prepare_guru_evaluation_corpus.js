#!/usr/bin/env node
/**
 * Live corpus preparation: generates Guru lessons for evaluation cases using the
 * real provider, exactly as learners would receive them, and records what happened.
 *
 * Requires GEMINI_API_KEY (or OPENAI_API_KEY with GURU_PROVIDER=openai) and GURU_MODEL
 * in universal/backend/.env. Never paste keys into chat or commits.
 *
 *   node scripts/prepare_guru_evaluation_corpus.js --models        # list vision/JSON-capable Gemini models, no lesson calls
 *   node scripts/prepare_guru_evaluation_corpus.js --first         # one live lesson: evs-class-5 page 46, basis (3 model calls)
 *   node scripts/prepare_guru_evaluation_corpus.js --limit 25      # next 25 unprepared cases, in manifest order
 *   node scripts/prepare_guru_evaluation_corpus.js --all           # every unprepared case (185 cases = up to 555 calls)
 *   node scripts/prepare_guru_evaluation_corpus.js --book evs-class-5 --page 46 --limit 5   # one page at every depth
 *
 * Results (latency, success, failure reason per case) are appended to
 * docs/evaluation/prepare-results.jsonl so evidence survives across runs.
 */
require("dotenv").config({ quiet: true });
require("ts-node/register");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const resultsPath = path.resolve(__dirname, "..", "..", "..", "docs", "evaluation", "prepare-results.jsonl");

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in universal/backend/.env");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=" + encodeURIComponent(key));
  const data = await response.json();
  if (data.error) throw new Error("Gemini API: " + data.error.message);
  const usable = (data.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"));
  for (const m of usable) console.log(m.name.replace("models/", ""), "|", m.displayName, "| out", m.outputTokenLimit);
  console.log("\nSet GURU_MODEL to one of the above (a vision-capable, JSON-capable model with >= 12000 output tokens).");
}

async function main() {
  if (flag("--models")) return listModels();
  const { GuruModelService } = require("../src/learning-library/page-teaching/guru-model.service");
  const { GuruPlannerService } = require("../src/learning-library/page-teaching/guru-planner.service");
  const { PageEvidenceService } = require("../src/learning-library/page-teaching/page-evidence.service");
  const { OcrDocumentVisionService } = require("../src/learning-library/extraction/ocr-document-vision.service");
  const { BUILTIN_BOOKS } = require("../src/learning-library/page-teaching/evaluation/guru-evaluation.service");
  const prisma = new PrismaClient();
  const model = new GuruModelService();
  if (!model.configured) {
    console.error("Provider is not configured. Set GEMINI_API_KEY and GURU_MODEL (run with --models to choose one).");
    process.exitCode = 1;
    return;
  }
  console.log("Provider:", model.identity);
  const evidence = new PageEvidenceService(new OcrDocumentVisionService(), prisma, { getFileStream: async () => { throw new Error("uploaded materials need the running server"); } });
  const planner = new GuruPlannerService(model, prisma);
  let where = { artifactId: null };
  if (flag("--first")) where = { bookId: "evs-class-5", physicalPage: 46, depth: "basis", language: "en" };
  if (option("--book")) where.bookId = option("--book");
  if (option("--depth")) where.depth = option("--depth");
  if (option("--page")) where.physicalPage = Number(option("--page"));
  const limit = flag("--first") ? 1 : flag("--all") ? 10000 : Number(option("--limit") || 1);
  const cases = (await prisma.guruEvaluationCase.findMany({ where, orderBy: [{ bookId: "asc" }, { physicalPage: "asc" }, { depth: "asc" }] })).slice(0, limit);
  if (!cases.length) {
    console.log("No matching unprepared cases. Seed the corpus first: node scripts/seed_guru_evaluation_corpus.js");
    await prisma.$disconnect();
    return;
  }
  console.log("Preparing", cases.length, "case(s); each new lesson makes 3 model calls (vision, plan, review).");
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  let ok = 0;
  for (const c of cases) {
    const started = Date.now();
    const record = { at: new Date().toISOString(), caseId: c.id, bookId: c.bookId, physicalPage: c.physicalPage, depth: c.depth, language: c.language, model: model.identity };
    try {
      if (!BUILTIN_BOOKS.includes(c.bookId)) throw new Error("Uploaded materials must be prepared through the running server API");
      const source = await evidence.builtin(c.bookId, String(c.physicalPage));
      const payload = await planner.build(source, { depth: c.depth, language: c.language }, async () => {});
      await prisma.guruEvaluationCase.update({ where: { id: c.id }, data: { artifactId: payload.plan.id, sourceHash: source.sourceHash } });
      Object.assign(record, { ok: true, artifactId: payload.plan.id, actions: payload.plan.actions.length, objectives: payload.plan.objectives.length, blocks: payload.page.blocks.length, ms: Date.now() - started });
      ok++;
      console.log("OK  ", c.bookId, "p" + c.physicalPage, c.depth, record.actions + " actions", record.ms + "ms");
    } catch (error) {
      Object.assign(record, { ok: false, error: String(error && error.message ? error.message : error).slice(0, 300), ms: Date.now() - started });
      console.log("FAIL", c.bookId, "p" + c.physicalPage, c.depth, "-", record.error);
      if (/daily provider quota/i.test(record.error)) {
        fs.appendFileSync(resultsPath, JSON.stringify(record) + "\n");
        console.log("\nStopping: the provider's daily quota for " + model.identity + " is exhausted. Remaining cases were not attempted. Enable billing on the Google AI Studio project or wait for the daily reset, then rerun.");
        break;
      }
    }
    fs.appendFileSync(resultsPath, JSON.stringify(record) + "\n");
  }
  console.log("\nPrepared", ok, "of", cases.length, "cases. Results appended to", resultsPath);
  console.log("Next: score them at /admin/guru-evaluation or export packets via GET /api/v2/guru/evaluation/cases/:id/packet.md");
  await prisma.$disconnect();
}
main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
