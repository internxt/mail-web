export const PATHS = {
  welcome: '/welcome',
  inbox: '/inbox',
  trash: '/trash',
} as const;

export type RoutePath = (typeof PATHS)[keyof typeof PATHS]
