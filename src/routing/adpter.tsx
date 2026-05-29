'use client';

/*
 * =================================================================
 * Host Navigation Adapter - React Router DOM
 * =================================================================
 * Bridges react router hooks into the babylon toolkit's
 * UnifiedNavigation context. Replace this file (or pick a different
 * adapter) when porting to TanStack Router, Next.js, etc.
 * =================================================================
 */

import { createElement, ReactNode, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavigationProvider, UnifiedNavigateFunction, LocationState, NavigationState, NAV_STATE_STORE_KEY } from "../babylon/system/platform";
import GameManager from "../babylon/globals";

export function ReactRouterNavAdapter({ children }: { children: ReactNode }) {
  const rrNavigate = useNavigate();
  const rrLocation = useLocation();

  const navigate: UnifiedNavigateFunction = useCallback(
    (path, state) => {
      // Bridge: persist state to sessionStorage so it survives iframe reloads.
      // This is intentionally NOT in the URL — users cannot craft a shareable link
      // with a spoofed gameMode/sceneUrl. sessionStorage is origin-scoped and
      // session-scoped; modifying it only affects the user's own browser tab.
      if (state) {
        // Strip reload flag from stored state so it doesn't re-trigger on restore.
        const { reloadPage, ...storedState } = state;
        try { sessionStorage.setItem(NAV_STATE_STORE_KEY, JSON.stringify(storedState)); } catch { /* ignore */ }
        // Force a full DOM reload to release all resources from the previous page
        // and give the new scene a fresh slate.
        if (reloadPage === undefined || reloadPage === true) {
          window.location.href = path;
          return;
        }
      }
      rrNavigate(path, { state });
    },
    [rrNavigate]
  );

  // Note: Register the navigation hook globally so GameManager.NavigateTo works on
  // every page, even before the Babylon runtime has initialized. ReactRouterNavAdapter
  // wraps the whole app (inside BrowserRouter) and already owns the navigate function.
  useEffect(() => {
    GameManager.SetReactNavigationHook(navigate);
    return () => GameManager.DeleteReactNavigationHook();
  }, [navigate]);

  const location: LocationState = useMemo(
    () => ({
      pathname: rrLocation.pathname,
      search: rrLocation.search,
      state: rrLocation.state as NavigationState | undefined,
    }),
    [rrLocation]
  );

  const value = useMemo(() => ({ navigate, location }), [navigate, location]);

  return createElement(NavigationProvider, { value }, children);
}