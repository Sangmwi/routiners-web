import { TAB_ROUTES } from '@sauhi/shared-contracts';

// ============================================================================
// Route Configuration
// ============================================================================

/** Routes that should hide the bottom tab (exact or prefix match) */
export const ROUTES_WITHOUT_TAB = [
  '/login',
  '/signup',
  '/onboarding',
  '/app-init',
  '/routine/',
  '/community/write',
  '/community/search-users',
  '/profile/edit',
  '/profile/big3',
  '/profile/inbody',
  '/profile/fitness',
  '/profile/dietary',
  '/profile/user/',
  '/settings',
] as const;

// ============================================================================
// Utilities
// ============================================================================

export type TabRoute = (typeof TAB_ROUTES)[number];

export const isTabRoute = (path: string): path is TabRoute =>
  TAB_ROUTES.includes(path as TabRoute);

/** Whether the current route should show the bottom tab */
export const shouldShowBottomTab = (pathname: string): boolean => {
  return !ROUTES_WITHOUT_TAB.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
};
