import { PageEvidenceService } from "./page-evidence.service";
import { PageEvidenceController } from "./page-evidence.controller";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LearningLibraryAuthGuard } from "../learning-library-auth.guard";
describe("page evidence boundary", () => {
  const service = new PageEvidenceService({} as any, {} as any, {} as any);
  it.each(["0", "-1", "1x", "1.5", "10001"])(
    "rejects invalid physical page %s",
    async (page) => {
      await expect(service.builtin("evs-class-5", page)).rejects.toThrow(
        "Invalid physical page",
      );
    },
  );
  it("rejects traversal and unregistered public books", async () => {
    await expect(service.builtin("../private", "1")).rejects.toThrow(
      "Unknown textbook",
    );
  });
  it("keeps private material access behind authentication and ownership", () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        PageEvidenceController.prototype.material,
      ),
    ).toEqual([JwtAuthGuard, LearningLibraryAuthGuard]);
  });
});
