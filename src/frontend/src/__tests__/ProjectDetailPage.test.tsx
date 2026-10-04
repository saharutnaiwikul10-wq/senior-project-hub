import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { ProjectStatus } from "@/backend";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { makeProgress, makeProject } from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

const PATH = "/projects/$id";
const ENTRY = "/projects/1";

/**
 * Project detail journey: the dossier renders the project's metadata, members,
 * progress, and links into the milestone/file/evaluation sections.
 */
describe("ProjectDetailPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("renders the project dossier with progress and section links", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(
          makeProject({
            id: 1n,
            title: "ระบบพยากรณ์ผลการเรียน",
            status: ProjectStatus.submitted,
            keywords: ["การเรียนรู้ของเครื่อง"],
          }),
        ),
        getProjectProgress: vi.fn().mockResolvedValue(
          makeProgress({
            percent: 75n,
            totalMilestones: 4n,
            doneMilestones: 3n,
            totalSubTasks: 8n,
            doneSubTasks: 6n,
          }),
        ),
      }),
    );

    renderPage(ProjectDetailPage, { path: PATH, initialEntry: ENTRY });

    expect(
      await screen.findByRole("heading", { name: "ระบบพยากรณ์ผลการเรียน" }),
    ).toBeInTheDocument();
    expect(screen.getByText("การเรียนรู้ของเครื่อง")).toBeInTheDocument();
    expect(await screen.findByText("75%")).toBeInTheDocument();
    expect(
      screen.getByTestId("project_detail.section_link.milestones"),
    ).toHaveAttribute("href", "/projects/1/milestones");
    expect(
      screen.getByTestId("project_detail.section_link.files"),
    ).toHaveAttribute("href", "/projects/1/files");
    expect(
      screen.getByTestId("project_detail.section_link.evaluations"),
    ).toHaveAttribute("href", "/projects/1/evaluations");
  });

  it("shows a not-found state when the project does not exist", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(null),
      }),
    );

    renderPage(ProjectDetailPage, { path: PATH, initialEntry: ENTRY });

    expect(await screen.findByText("ไม่พบข้อมูลโครงการ")).toBeInTheDocument();
  });
});
