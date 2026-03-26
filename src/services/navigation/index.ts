import { getRouteConfig, getViewByPath, type AppView } from '@/routes/paths';
import type { NavigateFunction, RouterNavigateOptions } from 'react-router-dom';
import { NavigationNotInitializedError } from '@/errors';

export class NavigationService {
  static readonly instance = new NavigationService();
  private navigation?: NavigateFunction;

  private getNavigation(appView: AppView, params?: Record<string, string>, options?: RouterNavigateOptions) {
    if (!this.navigation) {
      throw new NavigationNotInitializedError();
    }

    let to = getRouteConfig(appView).path;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        to = to.replace(`:${key}`, value);
      });
    }

    return this.navigation(to, options);
  }

  /**
   * Initializes the service with the provided navigate function.
   * @param {NavigateFunction} navigate - The navigate function to use for navigation - comes from react-router-dom.
   */
  init(navigate: NavigateFunction) {
    this.navigation = navigate;
  }

  getView() {
    const { pathname } = globalThis.location;
    const path = getViewByPath(pathname);

    return path;
  }

  /**
   * Navigate to a given route path.
   *
   * @param to - the route path to navigate to
   * @param state - the state to pass to the new location
   * @param replace - whether to replace the current URL in the browser's history stack
   */

  navigate({ id, params, options }: { id: AppView; params?: Record<string, string>; options?: RouterNavigateOptions }) {
    this.getNavigation(id, params, options);
  }

  /**
   * Replace the current URL in the browser's history stack with a new one.
   *
   * @param to - the route path to navigate to
   */

  replace({
    id,
    params,
    options,
  }: {
    id: AppView;
    params?: Record<string, string>;
    options?: Omit<RouterNavigateOptions, 'replace'>;
  }) {
    this.getNavigation(id, params, { replace: true, ...options });
  }
}
