/// <reference types="vite/client" />

interface Window {
  grecaptcha: {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, { action: string }) => Promise<string>;
  };
  opera?: {
    version?: () => string;
  };
}

interface Navigator {
  brave?: { isBrave: () => Promise<boolean> };

  userAgentData?: {
    platform: string;
    mobile?: boolean;
    brands?: Array<{ brand: string; version: string }>;
  };
}
