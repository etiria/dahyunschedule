import { customAlphabet } from "nanoid";

const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(alphabet, 6);

export function createInviteCode(): string {
  return generateCode();
}
