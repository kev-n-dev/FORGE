import { ReputationLevel } from "@forge/types";

/**
 * Human-readable level names.
 * Kept in config so they can be changed without touching business logic.
 *
 * IMPORTANT: These are platform milestone names, NOT official trade qualifications.
 * This must be communicated clearly in the UI.
 */
export const LEVEL_NAMES: Record<ReputationLevel, string> = {
  [ReputationLevel.New]: "New",
  [ReputationLevel.Established]: "Established",
  [ReputationLevel.Trusted]: "Trusted",
  [ReputationLevel.Proven]: "Proven",
  [ReputationLevel.Master]: "Master",
  [ReputationLevel.Legacy]: "Legacy",
};

/**
 * UI descriptions shown alongside each level.
 * Must never imply FORGE guarantees quality.
 */
export const LEVEL_DESCRIPTIONS: Record<ReputationLevel, string> = {
  [ReputationLevel.New]: "Recently joined FORGE.",
  [ReputationLevel.Established]:
    "Has completed verified jobs and received their first reviews on FORGE.",
  [ReputationLevel.Trusted]:
    "Has a consistent track record of completed work and positive customer feedback on FORGE.",
  [ReputationLevel.Proven]:
    "Has accumulated significant verified work history and strong customer satisfaction on FORGE.",
  [ReputationLevel.Master]:
    "Has a long and consistent history of verified work with excellent customer ratings on FORGE.",
  [ReputationLevel.Legacy]:
    "One of FORGE's longest-tenured professionals with an extensive verified track record.",
};

/**
 * Disclaimer shown near every level badge.
 * Must always be displayed to prevent misrepresentation.
 */
export const LEVEL_DISCLAIMER =
  "Platform levels reflect a professional's activity history on FORGE. " +
  "They are not official trade qualifications or endorsements by FORGE.";

export const TRUST_CARD_DISCLAIMER =
  "This information reflects the professional's activity on FORGE. " +
  "FORGE does not guarantee the quality of work or conduct of any professional.";

/**
 * Review edit window in hours.
 * After this window, the review locks and can only be removed by an admin.
 */
export const REVIEW_EDIT_WINDOW_HOURS = 48;

/**
 * Minimum review body length to prevent single-word reviews.
 */
export const REVIEW_MIN_LENGTH = 10;
