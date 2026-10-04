import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { AppRole } from "@/backend";
import { AdminPage } from "@/pages/AdminPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { makeAdminStats, makeProfile } from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

/**
 * Admin console journeys: overall statistics render, and an admin can change a
 * user's role through `setUserRole`.
 */
describe("AdminPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("renders the overall statistics and user list", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.admin })),
        getAdminStats: vi.fn().mockResolvedValue(
          makeAdminStats({
            totalProjects: 12n,
            totalUsers: 30n,
            byStatus: [{ name: "draft", count: 5n }],
            byCategory: [{ name: "วิศวกรรมคอมพิวเตอร์", count: 7n }],
          }),
        ),
        listUserProfiles: vi.fn().mockResolvedValue([
          makeProfile({
            displayName: "สมชาย ใจดี",
            role: AppRole.student,
          }),
        ]),
      }),
    );

    renderPage(AdminPage, { path: "/admin" });

    expect(
      await screen.findByTestId("admin.kpi.total_projects"),
    ).toHaveTextContent("12");
    expect(screen.getByTestId("admin.kpi.total_users")).toHaveTextContent("30");
    expect(await screen.findByTestId("admin.user_row.1")).toBeInTheDocument();
    expect(screen.getByText("สมชาย ใจดี")).toBeInTheDocument();
  });

  it("changes a user's role through setUserRole", async () => {
    const setUserRole = vi.fn().mockResolvedValue(undefined);
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.admin })),
        getAdminStats: vi.fn().mockResolvedValue(makeAdminStats()),
        listUserProfiles: vi.fn().mockResolvedValue([
          makeProfile({
            displayName: "สมชาย ใจดี",
            role: AppRole.student,
          }),
        ]),
        setUserRole,
      }),
    );

    renderPage(AdminPage, { path: "/admin" });

    await userEvent.click(await screen.findByTestId("admin.role_select.1"));
    await userEvent.click(
      await screen.findByRole("option", { name: "อาจารย์ที่ปรึกษา" }),
    );

    await waitFor(() => expect(setUserRole).toHaveBeenCalledTimes(1));
    expect(setUserRole).toHaveBeenCalledWith(
      expect.any(String),
      AppRole.advisor,
    );
  });
});
