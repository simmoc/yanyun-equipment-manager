import crypto from 'crypto';

export function generateChecksum(body: string, xsrfToken: string): string {
  return crypto.createHash('sha1').update(body + xsrfToken).digest('hex');
}
