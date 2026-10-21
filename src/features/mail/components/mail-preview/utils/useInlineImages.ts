import { useEffect, useMemo, useState } from 'react';
import { NetworkService } from '@/services/network';
import type { EmailAttachment } from '../preview';
import { getInlineImageKey, resolveInlineImages } from './inline-images';

interface UseInlineImagesParams {
  mailId: string;
  html: string;
  inlineImages: EmailAttachment[];
  attachmentsSessionKey: Uint8Array | null;
  isAwaitingSessionKey: boolean;
}

type DownloadedImages = { source: EmailAttachment[]; urlsByCid: Map<string, string> };

const NO_URLS: ReadonlyMap<string, string> = new Map();

const downloadInlineImages = async (
  mailId: string,
  inlineImages: EmailAttachment[],
  attachmentsSessionKey: Uint8Array | null,
): Promise<[string, string][]> => {
  const results = await Promise.allSettled(
    inlineImages.map(async (image): Promise<[string, string]> => {
      const { blob } = await NetworkService.instance.download({
        ...image,
        mailId,
        attachmentsSessionKey: attachmentsSessionKey!,
      });
      return [getInlineImageKey(image), URL.createObjectURL(blob)];
    }),
  );
  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
};

export const useInlineImages = ({
  mailId,
  html,
  inlineImages,
  attachmentsSessionKey,
  isAwaitingSessionKey,
}: UseInlineImagesParams): string => {
  const [downloaded, setDownloaded] = useState<DownloadedImages | null>(null);

  useEffect(() => {
    if (inlineImages.length === 0 || isAwaitingSessionKey) return;

    let cancelled = false;
    let createdUrls: string[] = [];

    void downloadInlineImages(mailId, inlineImages, attachmentsSessionKey).then((entries) => {
      createdUrls = entries.map(([, url]) => url);
      if (cancelled) {
        createdUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setDownloaded({ source: inlineImages, urlsByCid: new Map(entries) });
    });

    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mailId, inlineImages, attachmentsSessionKey, isAwaitingSessionKey]);

  return useMemo(() => {
    const urlsByCid = downloaded?.source === inlineImages ? downloaded.urlsByCid : NO_URLS;
    return resolveInlineImages(html, urlsByCid);
  }, [html, inlineImages, downloaded]);
};
