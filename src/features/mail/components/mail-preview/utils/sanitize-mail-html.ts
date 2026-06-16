import DOMPurify from 'dompurify';

const purify = DOMPurify();

purify.addHook('afterSanitizeAttributes', (node) => {
  const tag = node.tagName?.toLowerCase();

  if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'source') {
    const src = node.getAttribute('src') ?? '';
    if (src && !src.startsWith('data:') && !src.startsWith('cid:')) {
      node.removeAttribute('src');
    }
  }

  if (node.hasAttribute('background')) {
    const bg = node.getAttribute('background') ?? '';
    if (bg && !bg.startsWith('data:') && !bg.startsWith('cid:')) {
      node.removeAttribute('background');
    }
  }

  if (tag === 'a') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const sanitizeMailHtml = (html: string): string => purify.sanitize(html);
