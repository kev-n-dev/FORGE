import { z } from "zod";
import { zId, zRating, zSafeText, zTurnstileToken } from "./common";

export const CreateReviewSchema = z
  .object({
    jobId: zId.optional(),
    productId: zId.optional(),
    orderId: zId.optional(),
    rating: zRating,
    body: zSafeText(10, 2000),
    wouldHireAgain: z.boolean().optional(),
    turnstileToken: zTurnstileToken,
  })
  .refine(
    (data) => data.jobId !== undefined || data.productId !== undefined || data.orderId !== undefined,
    { message: "Review must be associated with a job, product, or order" }
  );

export const UpdateReviewSchema = z.object({
  body: zSafeText(10, 2000),
  wouldHireAgain: z.boolean().optional(),
});

export const CreateReviewResponseSchema = z.object({
  body: zSafeText(10, 1500),
});

export const UpdateReviewResponseSchema = z.object({
  body: zSafeText(10, 1500),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type CreateReviewResponseInput = z.infer<typeof CreateReviewResponseSchema>;
