import type { EmailAttachment } from '../preview';

const CID_SCHEME = /^cid:/i;

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
  for (const { img, cid } of getCidImages(fragment)) {
    const url = urlsByCid.get(cid);
    if (url) img.setAttribute('src', url);
  }
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
};
