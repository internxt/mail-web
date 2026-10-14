import { describe, expect, test } from 'vitest';
import { htmlToText } from '.';

describe('htmlToText', () => {
  test('When the content has markup, then it should return only the visible text', () => {
    expect(htmlToText('<p>Hello <b>world</b></p><div>Bye</div>')).toBe('Hello worldBye');
  });

  test('When the content has line breaks and repeated spaces, then it should collapse them into single spaces', () => {
    expect(htmlToText('  Hello\n\n   there\tfriend  ')).toBe('Hello there friend');
  });

  test('When the content has event handlers, then it should not execute them', () => {
    const run = () => htmlToText('<img src="x" onerror="window.__ran = true"><p>Safe</p>');

    expect(run()).toBe('Safe');
    expect((window as unknown as { __ran?: boolean }).__ran).toBeUndefined();
  });

  test('When the content is empty, then it should return an empty text', () => {
    expect(htmlToText('')).toBe('');
  });
});
