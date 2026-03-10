export const AppView = {
  welcome: '/welcome',
  inbox: '/inbox',
  trash: '/trash',
} as const;

export type RoutePath = (typeof AppView)[keyof typeof AppView];
