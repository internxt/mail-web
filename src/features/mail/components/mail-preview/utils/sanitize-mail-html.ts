import DOMPurify from 'dompurify';

const purify = DOMPurify();

const isAllowedUrl = (url: string): boolean => url.startsWith('data:') || url.startsWith('cid:');

const hasUnsafeSrcset = (value: string): boolean =>
  value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter((url) => url.length > 0)
    .some((url) => !isAllowedUrl(url));

purify.addHook('afterSanitizeAttributes', (node) => {
  const tag = node.tagName?.toLowerCase();

  if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'source') {
    const src = node.getAttribute('src') ?? '';
    if (src && !isAllowedUrl(src)) {
      node.removeAttribute('src');
    }
  }

  if (tag === 'img' || tag === 'source') {
    const srcset = node.getAttribute('srcset') ?? '';
    if (srcset && hasUnsafeSrcset(srcset)) {
      node.removeAttribute('srcset');
    }
  }

  if (tag === 'video') {
    const poster = node.getAttribute('poster') ?? '';
    if (poster && !isAllowedUrl(poster)) {
      node.removeAttribute('poster');
    }
  }

  if (node.hasAttribute('background')) {
    const bg = node.getAttribute('background') ?? '';
    if (bg && !isAllowedUrl(bg)) {
      node.removeAttribute('background');
    }
  }

  if (tag === 'a') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const sanitizeMailHtml = (html: string): string => purify.sanitize(html);
