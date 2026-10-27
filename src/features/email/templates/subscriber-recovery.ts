import { PASSWORD_REQUIREMENTS } from "@/features/auth/password-policy";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function usernameReminder(username: string) {
  return { subject: "Your Like TAC username", text: `Your Like TAC username is: ${username}\n\nIf you did not request this reminder, you can ignore this email.`, html: `<p>Your Like TAC username is <strong>${escapeHtml(username)}</strong>.</p><p>If you did not request this reminder, you can ignore this email.</p>` };
}

export function passwordResetInstructions(resetUrl: string, suggestedPassword: string) {
  const steps = ["Open the one-time reset link below.", "Enter the suggested password from this email or create your own.", "Enter the password again to confirm it matches.", "Submit the form before the link expires."];
  const requirements = [...PASSWORD_REQUIREMENTS.slice(0, 5), "Do not reuse any of your previous five passwords."];
  return {
    subject: "Reset your Like TAC password",
    text: `Reset link (expires in 30 minutes): ${resetUrl}\n\nSuggested strong password: ${suggestedPassword}\n\nSteps:\n${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\nRequirements:\n${requirements.map((item) => `- ${item}`).join("\n")}\n\nIf you did not request this reset, do not use the link.`,
    html: `<h1>Reset your Like TAC password</h1><p>This one-time link expires in 30 minutes: <a href="${escapeHtml(resetUrl)}">Reset my password</a></p><p><strong>Suggested strong password:</strong> <code>${escapeHtml(suggestedPassword)}</code></p><h2>Steps</h2><ol>${steps.map((step) => `<li>${step}</li>`).join("")}</ol><h2>Password requirements</h2><ul>${requirements.map((item) => `<li>${item}</li>`).join("")}</ul><p>If you did not request this reset, do not use the link.</p>`,
  };
}
