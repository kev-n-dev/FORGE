import { describe, it, expect } from "vitest";
import { CreateReviewSchema } from "../review";

describe("CreateReviewSchema", () => {
  const base = {
    jobId: "00000000-0000-0000-0000-000000000001",
    rating: 5 as const,
    body: "Excellent work, highly recommend.",
    wouldHireAgain: true,
    turnstileToken: "token",
  };

  it("accepts valid review", () => {
    expect(CreateReviewSchema.safeParse(base).success).toBe(true);
  });

  it("rejects review with no association", () => {
    const { jobId: _jobId, ...noAssoc } = base;
    expect(CreateReviewSchema.safeParse(noAssoc).success).toBe(false);
  });

  it("rejects rating of 0", () => {
    expect(CreateReviewSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
  });

  it("rejects rating of 6", () => {
    expect(CreateReviewSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });

  it("rejects body that is too short", () => {
    expect(CreateReviewSchema.safeParse({ ...base, body: "ok" }).success).toBe(false);
  });
});
