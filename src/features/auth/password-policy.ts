import { randomInt } from "node:crypto";

export const PASSWORD_REQUIREMENTS = [
  "Use at least 8 characters.",
  "Add a lowercase letter.",
  "Add an uppercase letter.",
  "Add a number.",
  "Add one of these special characters: ! @ * #.",
  "Only letters, numbers, and ! @ * # are allowed.",
] as const;

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push(PASSWORD_REQUIREMENTS[0]);
  if (!/[a-z]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[1]);
  if (!/[A-Z]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[2]);
  if (!/[0-9]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[3]);
  if (!/[!@*#]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[4]);
  if (!/^[A-Za-z0-9!@*#]+$/.test(password)) errors.push(PASSWORD_REQUIREMENTS[5]);
  return errors;
}

function pick(characters: string) {
  return characters[randomInt(characters.length)];
}

export function generateSuggestedPassword(length = 16): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const special = "!@*#";
  const all = lower + upper + numbers + special;
  const characters = [pick(lower), pick(upper), pick(numbers), pick(special)];
  while (characters.length < Math.max(8, length)) characters.push(pick(all));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [characters[index], characters[target]] = [characters[target], characters[index]];
  }
  return characters.join("");
}
