export const PATHS = {
  inbox: '/inbox',
  trash: '/trash',
} as const;

export type RoutePath = (typeof PATHS)[keyof typeof PATHS]
