import { describe, test, expect } from 'vitest';
import { sanitizeMailHtml } from './sanitize-mail-html';

describe('Sanitizing mail HTML to keep the preview safe from external trackers', () => {
  describe('Allowed inline content', () => {
    test('When an image is embedded as a data URL, then it is kept so legitimate inline content still renders', () => {
      const html = '<img src="data:image/png;base64,AAAA">';

      const result = sanitizeMailHtml(html);

      expect(result).toContain('src="data:image/png;base64,AAAA"');
    });

    test('When an image references an attachment with a cid URL, then it is kept so embedded attachments still render', () => {
      const html = '<img src="cid:logo">';

      const result = sanitizeMailHtml(html);

      expect(result).toContain('src="cid:logo"');
    });

    test('When a srcset only uses data and cid URLs, then it is kept so high-density inline images still render', () => {
      const html = '<img srcset="data:image/png;base64,AAA 1x, cid:logo 2x">';

      const result = sanitizeMailHtml(html);

      expect(result).toContain('srcset="data:image/png;base64,AAA 1x, cid:logo 2x"');
    });

    test('When a video poster is an inline data URL, then it is kept so the preview thumbnail still renders', () => {
      const html = '<video poster="data:image/png;base64,AAA"></video>';

      const result = sanitizeMailHtml(html);

      expect(result).toContain('poster="data:image/png;base64,AAA"');
    });
  });

  describe('Blocked external content', () => {
    test('When an image points to an external src, then the src is stripped so the tracker never loads', () => {
      const html = '<img src="https://tracker.example.com/pixel.gif">';

      const result = sanitizeMailHtml(html);

      expect(result).not.toContain('tracker.example.com');
    });

    test('When an image srcset includes any external URL, then the whole srcset is stripped to avoid loading a tracker variant', () => {
      const html = '<img srcset="data:image/png;base64,AAA 1x, https://tracker.example.com/2x.png 2x">';

      const result = sanitizeMailHtml(html);

      expect(result).not.toContain('srcset=');
      expect(result).not.toContain('tracker.example.com');
    });

    test('When a video has an external poster image, then the poster is stripped so the tracker never loads', () => {
      const html = '<video poster="https://tracker.example.com/thumb.jpg"></video>';

      const result = sanitizeMailHtml(html);

      expect(result).not.toContain('poster=');
      expect(result).not.toContain('tracker.example.com');
    });
  });
});
