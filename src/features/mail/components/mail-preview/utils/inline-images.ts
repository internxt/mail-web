import type { EmailAttachment } from '../preview';

const CID_SCHEME = /^cid:/i;
const HIDDEN_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const decodeCid = (cid: string): string => {
  try {
    return decodeURIComponent(cid);
  } catch {
    return cid;
  }
};

const normalizeCid = (value: string): string =>
  decodeCid(value.trim().replace(CID_SCHEME, '')).replace(/^<|>$/g, '').toLowerCase();

const parseHtml = (html: string): DocumentFragment => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

const getCidImages = (fragment: DocumentFragment): { img: HTMLImageElement; cid: string }[] =>
  Array.from(fragment.querySelectorAll('img'))
    .map((img) => ({ img, src: img.getAttribute('src') ?? '' }))
    .filter(({ src }) => CID_SCHEME.test(src))
    .map(({ img, src }) => ({ img, cid: normalizeCid(src) }));

export const splitInlineImages = (
  html: string,
  attachments: EmailAttachment[] = [],
): { inlineImages: EmailAttachment[]; files: EmailAttachment[] } => {
  const referencedCids = new Set(getCidImages(parseHtml(html)).map(({ cid }) => cid));
  const isReferenced = (attachment: EmailAttachment) =>
    !!attachment.cid && referencedCids.has(normalizeCid(attachment.cid));

  return {
    inlineImages: attachments.filter(isReferenced),
    files: attachments.filter((attachment) => !isReferenced(attachment)),
  };
};

export const getInlineImageKey = (attachment: EmailAttachment): string => normalizeCid(attachment.cid ?? '');

export const resolveInlineImages = (html: string, urlsByCid: ReadonlyMap<string, string>): string => {
  const fragment = parseHtml(html);
  const cidImages = getCidImages(fragment);
  if (cidImages.length === 0) return html;
  for (const { img, cid } of cidImages) {
    img.setAttribute('src', urlsByCid.get(cid) ?? HIDDEN_IMAGE_SRC);
  }
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
};
