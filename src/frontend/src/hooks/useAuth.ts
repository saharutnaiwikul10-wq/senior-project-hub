import { createActor } from "@/backend";
import type { UserProfileView } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Resolves the caller's application role and profile.
 *
 * The backend derives the role from the authorization mixin; `getCallerUserRole`
 * returns the base access-control role, while the profile carries the app role.
 */
export function useCallerRole() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated } = useInternetIdentity();

  const query = useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: isFetching || query.isLoading,
  };
}

/** Returns the caller's own profile, or null when it has not been created yet. */
export function useCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated } = useInternetIdentity();

  const query = useQuery<UserProfileView | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: isFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

/** True when the caller holds the admin application role. */
export function useIsAdmin() {
  const { data: profile, isLoading } = useCallerProfile();
  return {
    isAdmin: profile?.role === "admin",
    isLoading,
  };
}

/**
 * True when the caller holds the platform authorization admin role.
 *
 * Admin-only backend endpoints gate on `AccessControl.isAdmin`, which checks
 * the platform role rather than the profile's application role. UI that drives
 * those endpoints must gate on this hook so it never renders for a caller whose
 * calls would trap.
 */
export function useIsPlatformAdmin() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ["callerIsPlatformAdmin"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isPlatformAdmin: query.data === true,
    isLoading: isFetching || query.isLoading,
  };
}

/** Sign-in / sign-out helpers that also clear cached application data. */
export function useAuthActions() {
  const { login, clear, isAuthenticated, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();

  const signIn = useCallback(() => {
    login();
  }, [login]);

  const signOut = useCallback(() => {
    clear();
    queryClient.clear();
  }, [clear, queryClient]);

  return {
    signIn,
    signOut,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
  };
}
