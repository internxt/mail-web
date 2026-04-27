import { matchPath } from 'react-router-dom';

export const isCurrentPath = (pattern: string, pathname: string) => !!matchPath(pattern, pathname);
