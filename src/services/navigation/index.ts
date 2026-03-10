import type { RoutePath } from '@/routes/paths';
import type { NavigateFunction, RouterNavigateOptions } from 'react-router-dom';
import { NavigationNotInitializedError } from './navigation.errors';

export class NavigationService {
  static readonly instance = new NavigationService();
  private navigation?: NavigateFunction;

  private getNavigation(to: RoutePath, options?: RouterNavigateOptions) {
    if (!this.navigation) {
      throw new NavigationNotInitializedError();
    }
    return this.navigation(to, options);
  }

  /**
   * Initializes the NavigationService with the provided navigate function.
   * @param {NavigateFunction} navigate - The navigate function to use for navigation - comes from react-router-dom.
   */
  init(navigate: NavigateFunction) {
    this.navigation = navigate;
  }

  getPathname() {
    return globalThis.location.pathname;
  }

  /**
   * Navigate to a given route path.
   *
   * @param to - the route path to navigate to
   * @param state - the state to pass to the new location
   * @param replace - whether to replace the current URL in the browser's history stack
   */

  navigate(to: RoutePath, options?: RouterNavigateOptions) {
    this.getNavigation(to, options);
  }

  /**
   * Replace the current URL in the browser's history stack with a new one.
   *
   * @param to - the route path to navigate to
   */

  replace(to: RoutePath, options?: Omit<RouterNavigateOptions, 'replace'>) {
    this.getNavigation(to, { replace: true, ...options });
  }
}
