import DOMPurify from 'dompurify';

const purify = DOMPurify();

const isAllowedUrl = (url: string): boolean => url.startsWith('data:') || url.startsWith('cid:');

// srcset values may legitimately contain commas inside data: URIs, which makes a naive
// split unreliable. Instead, look for any protocol that would trigger a network request.
const UNSAFE_SCHEME_IN_SRCSET = /(?:^|[\s,])(?:https?|file|ftp|blob):/i;

const hasUnsafeSrcset = (value: string): boolean => UNSAFE_SCHEME_IN_SRCSET.test(value);

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

// DOMPurify rejects data: URIs in srcset and poster by default. We mark them URI-safe
// so values reach the hook above, which validates the schemes ourselves.
const SANITIZE_CONFIG = { ADD_URI_SAFE_ATTR: ['srcset', 'poster'] };

export const sanitizeMailHtml = (html: string): string => purify.sanitize(html, SANITIZE_CONFIG);
