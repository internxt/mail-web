export const PATHS = {
  inbox: '/inbox',
  trash: '/trash',
  demo: '/spam-demo'
} as const;

export type RoutePath = (typeof PATHS)[keyof typeof PATHS];
