export function getDomain(address: string): string | null {
  const trimmed = address.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

export function isInternxtDomain(address: string, activeDomains: { domain: string }[]): boolean {
  const domain = getDomain(address);
  if (!domain) return false;
  return activeDomains.some((d) => d.domain.trim().toLowerCase() === domain);
}

export function uniqueEmailAddresses(addresses: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const address of addresses) {
    const normalized = address.trim().toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

export function classifyRecipients(
  recipients: string[],
  activeDomains: { domain: string }[],
): { allInternxt: boolean; internxt: string[]; external: string[] } {
  const internxt: string[] = [];
  const external: string[] = [];
  for (const r of recipients) {
    if (isInternxtDomain(r, activeDomains)) internxt.push(r);
    else external.push(r);
  }
  return {
    allInternxt: recipients.length > 0 && external.length === 0,
    internxt,
    external,
  };
}
