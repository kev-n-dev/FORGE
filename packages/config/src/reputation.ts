import { ReputationLevel } from "@guild/types";

/**
 * Human-readable level names — The Guild progression.
 * These mirror the historical guild system: Apprentice → Journeyman → Craftsman → Master → Grand Master → Guild Elder.
 *
 * IMPORTANT: These are platform milestone names, NOT official trade qualifications.
 */
export const LEVEL_NAMES: Record<ReputationLevel, string> = {
  [ReputationLevel.New]: "Apprentice",
  [ReputationLevel.Established]: "Journeyman",
  [ReputationLevel.Trusted]: "Craftsman",
  [ReputationLevel.Proven]: "Master",
  [ReputationLevel.Master]: "Grand Master",
  [ReputationLevel.Legacy]: "Guild Elder",
};

/**
 * UI descriptions shown alongside each level.
 * Must never imply The Guild guarantees quality.
 */
export const LEVEL_DESCRIPTIONS: Record<ReputationLevel, string> = {
  [ReputationLevel.New]: "Recently joined The Guild.",
  [ReputationLevel.Established]:
    "Has completed verified jobs and received their first reviews on The Guild.",
  [ReputationLevel.Trusted]:
    "Has a consistent track record of completed work and positive customer feedback on The Guild.",
  [ReputationLevel.Proven]:
    "Has accumulated significant verified work history and strong customer satisfaction on The Guild.",
  [ReputationLevel.Master]:
    "Has a long and consistent history of verified work with excellent customer ratings on The Guild.",
  [ReputationLevel.Legacy]:
    "One of The Guild's longest-tenured professionals with an extensive verified track record.",
};

/**
 * Disclaimer shown near every level badge.
 * Must always be displayed to prevent misrepresentation.
 */
export const LEVEL_DISCLAIMER =
  "Guild levels reflect a professional's activity history on The Guild. " +
  "They are not official trade qualifications or endorsements by The Guild.";

export const TRUST_CARD_DISCLAIMER =
  "This information reflects the professional's activity on The Guild. " +
  "The Guild does not guarantee the quality of work or conduct of any professional.";

export const REVIEW_EDIT_WINDOW_HOURS = 48;
export const REVIEW_MIN_LENGTH = 10;
