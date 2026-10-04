import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { AppRole } from "@/backend";
import { DashboardPage } from "@/pages/DashboardPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import {
  makeDeadline,
  makeProfile,
  makeProgress,
  makeProject,
  makeScoreSummary,
} from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

/**
 * Role-aware dashboard journeys: a student sees their own projects, progress,
 * upcoming deadlines and scores; an advisor sees supervised and to-evaluate
 * projects.
 */
describe("DashboardPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("shows a student their projects, progress and scores", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.student })),
        getStudentDashboard: vi.fn().mockResolvedValue({
          projects: [makeProject({ id: 1n, title: "โครงการของฉัน" })],
          progress: [makeProgress({ projectId: 1n, percent: 60n })],
          upcoming: [],
          scores: [
            makeScoreSummary({
              projectId: 1n,
              evaluationCount: 2n,
              averageScore: 8n,
            }),
          ],
        }),
        getUpcomingDeadlines: vi
          .fn()
          .mockResolvedValue([makeDeadline({ milestoneName: "ส่งบทที่ 3" })]),
      }),
    );

    renderPage(DashboardPage, { path: "/" });

    expect(
      await screen.findByRole("heading", { name: "โครงการของฉัน" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.project_link.0")).toHaveTextContent(
      "โครงการของฉัน",
    );
    // The average-progress KPI renders the rounded percentage.
    expect(screen.getByTestId("dashboard.kpi.avg_progress")).toHaveTextContent(
      "60%",
    );
    expect(screen.getByText("ส่งบทที่ 3")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.score_card.0")).toBeInTheDocument();
  });

  it("shows an advisor the projects they supervise and must evaluate", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.advisor })),
        getAdvisorDashboard: vi.fn().mockResolvedValue({
          supervised: [makeProject({ id: 1n, title: "โครงการที่ดูแล" })],
          toEvaluate: [makeProject({ id: 2n, title: "โครงการที่ต้องประเมิน" })],
          evaluated: [],
        }),
        getUpcomingDeadlines: vi.fn().mockResolvedValue([]),
      }),
    );

    renderPage(DashboardPage, { path: "/" });

    expect(
      await screen.findByRole("heading", { name: "รอการประเมิน" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "โครงการที่ดูแล" }),
    ).toBeInTheDocument();
    // Each section renders its own grid, so both project links carry index 0.
    const links = screen.getAllByTestId("dashboard.project_link.0");
    const titles = links.map((link) => link.textContent);
    expect(titles).toContain("โครงการที่ต้องประเมิน");
    expect(titles).toContain("โครงการที่ดูแล");
  });

  it("shows an admin the overall statistics", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.admin })),
        getAdminStats: vi.fn().mockResolvedValue({
          totalProjects: 12n,
          totalUsers: 30n,
          byStatus: [{ name: "draft", count: 5n }],
          byCategory: [{ name: "วิศวกรรมคอมพิวเตอร์", count: 7n }],
        }),
        getUpcomingDeadlines: vi.fn().mockResolvedValue([]),
      }),
    );

    renderPage(DashboardPage, { path: "/" });

    expect(
      await screen.findByTestId("dashboard.kpi.total_projects"),
    ).toHaveTextContent("12");
    expect(screen.getByTestId("dashboard.kpi.total_users")).toHaveTextContent(
      "30",
    );
  });
});
