import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type GuruMappingStatus = "PROPOSED" | "VERIFIED" | "REJECTED";
export type GuruMappingMethod =
  | "CHUNK_PAGE_RANGE"
  | "OBJECTIVE_NAME"
  | "MANUAL";

export interface MappingProposal {
  conceptId: string;
  method: GuruMappingMethod;
  score: number;
  rationale: string;
}

const STOP = new Set(
  "a an and are as at be by for from how in into is it its of on or that the this to was were what when which with why".split(
    " ",
  ),
);
/** Lower-cased content tokens; keeps letters, combining marks (Indic vowel signs) and digits of any script. */
export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}
export function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * Proposes and records links between a page lesson artifact and canonical concepts.
 * Proposals never affect mastery. Only an ADMIN-verified mapping is consumed by the
 * mastery bridge, and a VERIFIED or REJECTED decision is never overwritten by a proposal.
 */
@Injectable()
export class GuruConceptMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Deterministic, model-free proposals from existing extraction provenance. */
  async proposeFor(artifactId: string): Promise<MappingProposal[]> {
    const artifact = await this.prisma.guruLessonArtifact.findUnique({
      where: { id: artifactId },
    });
    if (!artifact) throw new NotFoundException("Lesson unavailable");
    const payload: any = artifact.payload;
    const objectives: string[] = Array.isArray(payload?.plan?.objectives)
      ? payload.plan.objectives.filter((o: any) => typeof o === "string")
      : [];
    const proposals = new Map<string, MappingProposal>();
    // 1) Concepts whose source chunks cover this exact physical page of the same material.
    const pageLinks = await this.prisma.conceptChunk.findMany({
      where: {
        chunk: {
          document: { materialId: artifact.bookId },
          pageStart: { lte: artifact.physicalPage },
          pageEnd: { gte: artifact.physicalPage },
        },
      },
      select: {
        conceptId: true,
        relevance: true,
        confidence: true,
        concept: { select: { canonicalName: true, status: true } },
      },
    });
    for (const link of pageLinks) {
      if (link.concept.status !== "ACTIVE") continue;
      const score = Math.min(
        1,
        Math.max(0.05, (link.relevance ?? 0.5) * (link.confidence ?? 0.5)),
      );
      const prior = proposals.get(link.conceptId);
      if (!prior || prior.score < score)
        proposals.set(link.conceptId, {
          conceptId: link.conceptId,
          method: "CHUNK_PAGE_RANGE",
          score: Number(score.toFixed(3)),
          rationale:
            "Extraction linked concept '" +
            link.concept.canonicalName +
            "' to a chunk covering physical page " +
            artifact.physicalPage +
            ".",
        });
    }
    // 2) Lesson objectives that name a concept already linked anywhere in the same material.
    if (objectives.length) {
      const materialLinks = await this.prisma.conceptChunk.findMany({
        where: { chunk: { document: { materialId: artifact.bookId } } },
        distinct: ["conceptId"],
        select: {
          conceptId: true,
          concept: {
            select: { canonicalName: true, status: true },
          },
        },
      });
      for (const link of materialLinks) {
        if (link.concept.status !== "ACTIVE") continue;
        const name = tokens(link.concept.canonicalName);
        let best = 0;
        let matched = "";
        for (const objective of objectives) {
          const score = jaccard(name, tokens(objective));
          if (score > best) {
            best = score;
            matched = objective;
          }
        }
        if (best < 0.34) continue;
        const prior = proposals.get(link.conceptId);
        if (!prior || prior.score < best)
          proposals.set(link.conceptId, {
            conceptId: link.conceptId,
            method: "OBJECTIVE_NAME",
            score: Number(best.toFixed(3)),
            rationale:
              "Objective '" +
              matched +
              "' names concept '" +
              link.concept.canonicalName +
              "'.",
          });
      }
    }
    const list = [...proposals.values()].sort((a, b) => b.score - a.score);
    for (const proposal of list) {
      const existing = await this.prisma.guruConceptMapping.findUnique({
        where: {
          artifactId_conceptId: { artifactId, conceptId: proposal.conceptId },
        },
      });
      // Human decisions are final until a curator changes them.
      if (existing && existing.status !== "PROPOSED") continue;
      await this.prisma.guruConceptMapping.upsert({
        where: {
          artifactId_conceptId: { artifactId, conceptId: proposal.conceptId },
        },
        create: { artifactId, ...proposal },
        update: {
          method: proposal.method,
          score: proposal.score,
          rationale: proposal.rationale,
        },
      });
    }
    return list;
  }

  async list(artifactId: string) {
    return this.prisma.guruConceptMapping.findMany({
      where: { artifactId },
      include: {
        concept: { select: { id: true, canonicalName: true, domain: true } },
      },
      orderBy: [{ status: "asc" }, { score: "desc" }],
    });
  }

  /** Explicit human decision. Only ADMIN curators may verify or reject. */
  async review(
    mappingId: string,
    status: GuruMappingStatus,
    user: { userId?: string; role?: string },
    rationale?: string,
  ) {
    if (user?.role !== "ADMIN")
      throw new ForbiddenException(
        "Only curators can verify concept mappings.",
      );
    if (!["VERIFIED", "REJECTED", "PROPOSED"].includes(status))
      throw new BadRequestException("Unknown mapping status");
    const mapping = await this.prisma.guruConceptMapping.findUnique({
      where: { id: mappingId },
    });
    if (!mapping) throw new NotFoundException("Mapping unavailable");
    return this.prisma.guruConceptMapping.update({
      where: { id: mappingId },
      data: {
        status,
        rationale: rationale?.trim()
          ? rationale.trim().slice(0, 2000)
          : mapping.rationale,
        reviewedBy: user.userId,
        reviewedAt: new Date(),
      },
    });
  }

  /** Manual curator link when extraction provenance is missing. */
  async addManual(
    artifactId: string,
    conceptId: string,
    user: { userId?: string; role?: string },
    rationale: string,
  ) {
    if (user?.role !== "ADMIN")
      throw new ForbiddenException("Only curators can add concept mappings.");
    const [artifact, concept] = await Promise.all([
      this.prisma.guruLessonArtifact.findUnique({ where: { id: artifactId } }),
      this.prisma.concept.findUnique({ where: { id: conceptId } }),
    ]);
    if (!artifact || !concept)
      throw new NotFoundException("Lesson or concept unavailable");
    const note = rationale?.trim().slice(0, 2000) || "Manual curator link";
    return this.prisma.guruConceptMapping.upsert({
      where: { artifactId_conceptId: { artifactId, conceptId } },
      create: {
        artifactId,
        conceptId,
        method: "MANUAL",
        score: 1,
        status: "VERIFIED",
        rationale: note,
        reviewedBy: user.userId,
        reviewedAt: new Date(),
      },
      update: {
        status: "VERIFIED",
        method: "MANUAL",
        score: 1,
        rationale: note,
        reviewedBy: user.userId,
        reviewedAt: new Date(),
      },
    });
  }

  /** Curator search over active canonical concepts for manual links. */
  async searchConcepts(query: unknown, limit = 20) {
    const text = typeof query === "string" ? query.trim().slice(0, 120) : "";
    if (text.length < 2) throw new BadRequestException("Enter at least 2 characters");
    return this.prisma.concept.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { canonicalName: { contains: text, mode: "insensitive" } },
          { normalizedName: { contains: text.toLowerCase() } },
        ],
      },
      select: { id: true, canonicalName: true, domain: true, gradeBand: true, definition: true },
      orderBy: { canonicalName: "asc" },
      take: Math.min(50, Math.max(1, limit)),
    });
  }

  async verifiedConceptIds(artifactId: string): Promise<string[]> {
    const rows = await this.prisma.guruConceptMapping.findMany({
      where: { artifactId, status: "VERIFIED" },
      select: { conceptId: true },
    });
    return rows.map((r) => r.conceptId);
  }
}
