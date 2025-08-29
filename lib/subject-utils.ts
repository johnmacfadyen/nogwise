/**
 * Clean up email subject lines by removing mailing list tags and prefixes
 */
export function cleanSubject(subject: string): string {
  if (!subject) return subject;
  
  return subject
    // Remove mailing list tags like [AusNOG], [NANOG], etc.
    .replace(/^\[[\w-]+\]\s*/gi, '')
    // Remove Re: Fwd: FW: prefixes (case insensitive)
    .replace(/^(Re:|Fwd:|FW:)\s*/gi, '')
    // Remove any remaining brackets at the start
    .replace(/^\[[^\]]*\]\s*/, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get the mailing list tag from a subject (if present)
 */
export function getMailingListTag(subject: string): string | null {
  const match = subject.match(/^\[([\w-]+)\]/);
  return match ? match[1] : null;
}