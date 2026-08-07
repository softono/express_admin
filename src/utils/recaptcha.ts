
interface CaptchaRequest {
  body: Record<string, unknown>;
}

export async function recaptchaFails(
  req: CaptchaRequest,
  secretKey: string,
): Promise<boolean> {
  if (!secretKey) {
    return false;
  }

  const token =
    req.body["g-recaptcha-response"] ||
    req.body.recaptcha ||
    req.body.captcha ||
    req.body.recaptcha_token;

  if (!token) {
    return true;
  }

  const params = new URLSearchParams({
    secret: secretKey,
    response: String(token),
  });
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify?" + params.toString(),
    { method: "POST", signal: AbortSignal.timeout(5000) },
  );
  const data: any = await response.json().catch(() => null);

  return data?.success !== true;
}
