import type { backendInterface } from "@/backend";
import type { InternetIdentityContext } from "@caffeineai/core-infrastructure";
import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RouteComponent,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * A typed stand-in for the generated backend actor.
 *
 * Every method is a `vi.fn()` that resolves to a benign default, so a test only
 * has to stub the calls its journey actually exercises. The type is the app's
 * own `backendInterface`, which keeps the mock honest: a method the app calls
 * but the mock omits is a compile error, not a runtime surprise.
 */
export type MockActor = backendInterface & {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

const PRINCIPAL = Principal.fromText("aaaaa-aa");

/** Builds a mock actor whose methods all resolve to a safe default. */
export function createMockActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
): MockActor {
  const actor = {
    getCallerUserRole: vi.fn().mockResolvedValue("user"),
    getCallerUserProfile: vi.fn().mockResolvedValue(null),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
    listProjects: vi.fn().mockResolvedValue([]),
    listMyProjects: vi.fn().mockResolvedValue([]),
    getProject: vi.fn().mockResolvedValue(null),
    getProjectProgress: vi.fn().mockResolvedValue({
      projectId: 0n,
      percent: 0n,
      totalMilestones: 0n,
      doneMilestones: 0n,
      totalSubTasks: 0n,
      doneSubTasks: 0n,
    }),
    listMilestones: vi.fn().mockResolvedValue([]),
    listSubTasks: vi.fn().mockResolvedValue([]),
    listProjectFiles: vi.fn().mockResolvedValue([]),
    listEvaluations: vi.fn().mockResolvedValue([]),
    listProjectComments: vi.fn().mockResolvedValue([]),
    listMilestoneComments: vi.fn().mockResolvedValue([]),
    getScoreSummary: vi.fn().mockResolvedValue({
      projectId: 0n,
      evaluationCount: 0n,
      averageTotal: 0n,
      averageScore: 0n,
    }),
    getStudentDashboard: vi.fn().mockResolvedValue({
      projects: [],
      progress: [],
      upcoming: [],
      scores: [],
    }),
    getAdvisorDashboard: vi.fn().mockResolvedValue({
      supervised: [],
      toEvaluate: [],
      evaluated: [],
    }),
    getAdminStats: vi.fn().mockResolvedValue({
      totalProjects: 0n,
      totalUsers: 0n,
      byStatus: [],
      byCategory: [],
    }),
    getUpcomingDeadlines: vi.fn().mockResolvedValue([]),
    listUserProfiles: vi.fn().mockResolvedValue([]),
    getUserProfile: vi.fn().mockResolvedValue(null),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    setProjectStatus: vi.fn(),
    createMilestone: vi.fn(),
    updateMilestone: vi.fn(),
    deleteMilestone: vi.fn(),
    setMilestoneStatus: vi.fn(),
    createSubTask: vi.fn(),
    setSubTaskDone: vi.fn(),
    deleteSubTask: vi.fn(),
    addProjectFile: vi.fn(),
    deleteProjectFile: vi.fn(),
    submitEvaluation: vi.fn(),
    addComment: vi.fn(),
    saveCallerUserProfile: vi.fn(),
    setUserRole: vi.fn(),
    assignCallerUserRole: vi.fn(),
    ...overrides,
  } as unknown as MockActor;
  return actor;
}

/** A minimal authenticated Internet Identity context for tests. */
export function createMockIdentityContext(
  overrides: Partial<InternetIdentityContext> = {},
): InternetIdentityContext {
  const identity = {
    getPrincipal: () => PRINCIPAL,
  } as unknown as Identity;
  return {
    identity,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    isSessionExpired: false,
    isAuthenticated: true,
    ...overrides,
  };
}

/** A fresh QueryClient with retries disabled so failures surface immediately. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Renders a component inside the providers the app itself uses. The actor and
 * identity are supplied by the module mock in each test file, so this only
 * wires the query client.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

interface RenderPageOptions {
  /** Route path the page is mounted at, e.g. `/projects/$id`. */
  path: string;
  /** Initial URL, e.g. `/projects/1`. Defaults to the path with params filled. */
  initialEntry?: string;
  queryClient?: QueryClient;
}

/**
 * Renders a single page component inside a real TanStack Router so its
 * `useParams`, `useNavigate`, and `Link` calls resolve exactly as they do in
 * the application. Only the page under test is mounted; the app shell is not.
 */
export function renderPage(
  Page: RouteComponent,
  {
    path,
    initialEntry,
    queryClient = createTestQueryClient(),
  }: RenderPageOptions,
) {
  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: Page,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry ?? path] }),
  });

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

export { PRINCIPAL };
