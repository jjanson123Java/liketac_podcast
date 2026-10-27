export type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Transactional email is not configured");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, ...message }) });
  if (!response.ok) throw new Error("Transactional email could not be sent");
}
