import type { InternetIdentityContext } from "@caffeineai/core-infrastructure";
import { vi } from "vitest";
import {
  type MockActor,
  createMockActor,
  createMockIdentityContext,
} from "./harness";

/**
 * Shared module mock for `@caffeineai/core-infrastructure`.
 *
 * Test files opt in with:
 *
 *   vi.mock("@caffeineai/core-infrastructure", () =>
 *     import("@/test/coreInfrastructureMock"),
 *   );
 *
 * and then configure the actor/identity through the setters below before
 * rendering. Keeping the mock in one module means every page test exercises the
 * same seam the application actually uses (`useActor` / `useInternetIdentity`),
 * rather than each file inventing its own.
 */

let currentActor: MockActor = createMockActor();
let currentIdentity: InternetIdentityContext = createMockIdentityContext();

/** Replaces the actor returned by `useActor` for subsequent renders. */
export function setMockActor(actor: MockActor): void {
  currentActor = actor;
}

/** Replaces the Internet Identity context returned by `useInternetIdentity`. */
export function setMockIdentity(context: InternetIdentityContext): void {
  currentIdentity = context;
}

/** Restores the default actor and authenticated identity between tests. */
export function resetMockCoreInfrastructure(): void {
  currentActor = createMockActor();
  currentIdentity = createMockIdentityContext();
}

export function useActor(): { actor: MockActor; isFetching: boolean } {
  return { actor: currentActor, isFetching: false };
}

export function useInternetIdentity(): InternetIdentityContext {
  return currentIdentity;
}

// The provider is only referenced by `main.tsx`, which tests do not render, but
// exporting a stub keeps the module shape compatible if a test ever needs it.
export function InternetIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return children;
}

export const createActorWithConfig = vi.fn();
export const loadConfig = vi.fn();
export const loadMockBackendFromModules = vi.fn();
