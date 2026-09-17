/**
 * Cloudflare Turnstile server-side verification.
 * Called on all user-facing forms to prevent automated abuse.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
  hostname: string | null;
  action: string | null;
}

/**
 * Verify a Turnstile challenge token server-side.
 *
 * @param token - The token from the frontend `cf-turnstile-response` field.
 * @param secret - The Turnstile secret key from environment variables.
 * @param remoteIp - Optional: the visitor's IP (improves validation).
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
  } catch {
    return { success: false, errorCodes: ["fetch-error"], hostname: null, action: null };
  }

  if (!response.ok) {
    return {
      success: false,
      errorCodes: [`http-${response.status}`],
      hostname: null,
      action: null,
    };
  }

  interface TurnstileResponse {
    success: boolean;
    "error-codes"?: string[];
    hostname?: string;
    action?: string;
  }

  const data = (await response.json()) as TurnstileResponse;

  return {
    success: data.success === true,
    errorCodes: data["error-codes"] ?? [],
    hostname: data.hostname ?? null,
    action: data.action ?? null,
  };
}
