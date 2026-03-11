export const AppView = {
  welcome: '/welcome',
  inbox: '/inbox',
  trash: '/trash',
  demo: '/spam-demo',
} as const;

export type RoutePath = (typeof AppView)[keyof typeof AppView];
