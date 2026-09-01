import isValidEmail from '@internxt/lib/dist/auth/isValidEmail';

export interface ParsedRecipients {
  emails: string[];
  invalid: string[];
}

const ENTRY_SEPARATORS = /[,;\n\r\t]/;

/** Splits a list on commas, semicolons and line breaks, ignoring separators inside quotes or angle brackets. */
const splitEntries = (value: string): string[] => {
  const entries: string[] = [];
  let current = '';
  let insideQuotes = false;
  let insideAngles = false;

  for (const char of value) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === '<' && !insideQuotes) insideAngles = true;
    else if (char === '>' && !insideQuotes) insideAngles = false;

    if (ENTRY_SEPARATORS.test(char) && !insideQuotes && !insideAngles) {
      entries.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  entries.push(current);

  return entries;
};

/** Reads the address out of entries like `John Doe <john@doe.com>`, or the entry itself when it is a bare address. */
const extractEmail = (entry: string): string | null => {
  const angled = entry.match(/<([^<>]*)>/);
  const candidate = (angled ? angled[1] : entry)
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  return isValidEmail(candidate) ? candidate : null;
};

/** Addresses can also be separated by spaces, but only split on them when no part looks like a display name. */
const splitSpacedAddresses = (entry: string): string[] => {
  const parts = entry.trim().split(/\s+/);

  return parts.length > 1 && parts.every((part) => extractEmail(part)) ? parts : [entry];
};

/**
 * Parses a pasted or typed recipient list into unique addresses, keeping whatever could not be
 * read as an address so it can be shown back to the user.
 */
export const parseRecipients = (value: string): ParsedRecipients => {
  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const entry of splitEntries(value).flatMap(splitSpacedAddresses)) {
    const trimmedEntry = entry.trim();
    if (!trimmedEntry) continue;

    const email = extractEmail(trimmedEntry);
    if (!email) {
      invalid.push(trimmedEntry);
      continue;
    }

    const key = email.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    emails.push(email);
  }

  return { emails, invalid };
};
