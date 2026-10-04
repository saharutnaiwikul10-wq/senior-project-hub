import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import App from "@/App";
import {
  resetMockCoreInfrastructure,
  setMockActor,
  setMockIdentity,
} from "@/test/coreInfrastructureMock";
import {
  createMockActor,
  createMockIdentityContext,
  createTestQueryClient,
} from "@/test/harness";

/** Renders the real router inside the query provider `main.tsx` supplies. */
function renderApp() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <App />
    </QueryClientProvider>,
  );
}

/**
 * Auth gate and role-based route protection.
 *
 * These journeys render the real router and the real `RootLayout`, so they
 * cover the acceptance criteria that the app loads without a blank screen, that
 * an unauthenticated visitor sees the Internet Identity sign-in, and that the
 * admin route is denied to a non-admin caller.
 */
describe("App auth gate", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
    window.history.pushState({}, "", "/");
  });

  it("shows the Internet Identity sign-in screen when unauthenticated", async () => {
    setMockIdentity(createMockIdentityContext({ isAuthenticated: false }));
    renderApp();

    expect(
      await screen.findByRole("button", {
        name: /เข้าสู่ระบบด้วย Internet Identity/,
      }),
    ).toBeInTheDocument();
    // The shell must not render for an anonymous visitor.
    expect(screen.queryByText("แดชบอร์ด")).not.toBeInTheDocument();
  });

  it("renders the authenticated shell instead of a blank screen", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi.fn().mockResolvedValue({
          principal: { toText: () => "aaaaa-aa" },
          displayName: "สมชาย ใจดี",
          department: "วิศวกรรมคอมพิวเตอร์",
          role: "student",
          email: "somchai@example.ac.th",
          createdAt: 0n,
        }),
        getStudentDashboard: vi.fn().mockResolvedValue({
          projects: [],
          progress: [],
          upcoming: [],
          scores: [],
        }),
      }),
    );
    renderApp();

    // The dashboard heading proves the shell mounted rather than a white screen.
    expect(
      await screen.findByRole("heading", { name: "แดชบอร์ด" }),
    ).toBeInTheDocument();
  });

  it("denies the admin route to a non-admin caller", async () => {
    window.history.pushState({}, "", "/admin");
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi.fn().mockResolvedValue({
          principal: { toText: () => "aaaaa-aa" },
          displayName: "สมชาย ใจดี",
          department: "วิศวกรรมคอมพิวเตอร์",
          role: "student",
          email: "somchai@example.ac.th",
          createdAt: 0n,
        }),
        isCallerAdmin: vi.fn().mockResolvedValue(false),
      }),
    );
    renderApp();

    expect(await screen.findByText("ไม่มีสิทธิ์เข้าถึง")).toBeInTheDocument();
    expect(screen.queryByText("จัดการระบบ")).not.toBeInTheDocument();
  });

  it("allows the admin route for a platform admin", async () => {
    window.history.pushState({}, "", "/admin");
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi.fn().mockResolvedValue({
          principal: { toText: () => "aaaaa-aa" },
          displayName: "ผู้ดูแลระบบ",
          department: "สำนักงาน",
          role: "admin",
          email: "admin@example.ac.th",
          createdAt: 0n,
        }),
        isCallerAdmin: vi.fn().mockResolvedValue(true),
        getAdminStats: vi.fn().mockResolvedValue({
          totalProjects: 3n,
          totalUsers: 5n,
          byStatus: [{ name: "draft", count: 3n }],
          byCategory: [{ name: "วิศวกรรมคอมพิวเตอร์", count: 3n }],
        }),
        listUserProfiles: vi.fn().mockResolvedValue([]),
      }),
    );
    renderApp();

    expect(
      await screen.findByRole("heading", { name: "จัดการระบบ" }),
    ).toBeInTheDocument();
  });

  it("invokes Internet Identity login from the sign-in button", async () => {
    const login = vi.fn();
    setMockIdentity(
      createMockIdentityContext({ isAuthenticated: false, login }),
    );
    renderApp();

    const button = await screen.findByRole("button", {
      name: /เข้าสู่ระบบด้วย Internet Identity/,
    });
    await userEvent.click(button);

    await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
  });
});
