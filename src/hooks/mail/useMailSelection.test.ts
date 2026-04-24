import { renderHook, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { useMailSelection } from './useMailSelection';
import { getMockedMails } from '@/test-utils/fixtures';

describe('Mail Selection - custom hook', () => {
  test('When initialized, then no emails are selected', () => {
    const { emails } = getMockedMails(3);
    const { result } = renderHook(() => useMailSelection(emails));

    expect(result.current.selectedEmails).toStrictEqual([]);
  });

  test('When there are no emails, then nothing is returned', () => {
    const { result } = renderHook(() => useMailSelection(undefined));

    expect(result.current.selectedEmails).toStrictEqual([]);
  });

  test('When all emails are selected, then the ID of all the emails provided are returned', () => {
    const { emails } = getMockedMails(3);
    const { result } = renderHook(() => useMailSelection(emails));

    act(() => result.current.selectAll());

    expect(result.current.selectedEmails).toStrictEqual(emails.map((e) => e.id));
  });

  test('When unselecting previously selected emails, then no emails are selected', () => {
    const { emails } = getMockedMails(3);
    const { result } = renderHook(() => useMailSelection(emails));

    act(() => result.current.selectAll());
    act(() => result.current.selectNone());

    expect(result.current.selectedEmails).toStrictEqual([]);
  });

  test('When only read messages are selected, then only read emails are returned', () => {
    const { emails } = getMockedMails(4);
    emails[0].isRead = true;
    emails[1].isRead = false;
    emails[2].isRead = true;
    emails[3].isRead = false;

    const { result } = renderHook(() => useMailSelection(emails));
    act(() => result.current.selectRead());

    expect(result.current.selectedEmails).toStrictEqual([emails[0].id, emails[2].id]);
  });

  test('When selectUnread is called, then only unread emails are selected', () => {
    const { emails } = getMockedMails(4);
    emails[0].isRead = true;
    emails[1].isRead = false;
    emails[2].isRead = true;
    emails[3].isRead = false;

    const { result } = renderHook(() => useMailSelection(emails));
    act(() => result.current.selectUnread());

    expect(result.current.selectedEmails).toStrictEqual([emails[1].id, emails[3].id]);
  });

  test('When toggleSelectAll is called and none are selected, then all are selected', () => {
    const { emails } = getMockedMails(3);
    const { result } = renderHook(() => useMailSelection(emails));

    act(() => result.current.toggleSelectAll());

    expect(result.current.selectedEmails).toStrictEqual(emails.map((e) => e.id));
  });

  test('When toggleSelectAll is called and all are selected, then none are selected', () => {
    const { emails } = getMockedMails(3);
    const { result } = renderHook(() => useMailSelection(emails));

    act(() => result.current.selectAll());
    act(() => result.current.toggleSelectAll());

    expect(result.current.selectedEmails).toStrictEqual([]);
  });

  test('When toggleSelectAll is called and some are selected, then all are selected', () => {
    const { emails } = getMockedMails(3);
    emails[0].isRead = true;
    emails[1].isRead = false;
    emails[2].isRead = false;
    const { result } = renderHook(() => useMailSelection(emails));

    act(() => result.current.selectRead());
    act(() => result.current.toggleSelectAll());

    expect(result.current.selectedEmails).toStrictEqual(emails.map((e) => e.id));
  });
});
