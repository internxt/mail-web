/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface Window {
  grecaptcha: {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, options?: { action: string }) => Promise<string>;
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
