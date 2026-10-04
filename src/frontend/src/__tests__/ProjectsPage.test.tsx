import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { ProjectStatus } from "@/backend";
import { ProjectsPage } from "@/pages/ProjectsPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { makeProject } from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

/**
 * Project registry journeys: the card grid renders clickable cards, and the
 * search/status filters are forwarded to the backend as a `ProjectFilter`.
 */
describe("ProjectsPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("renders a clickable card for each project", async () => {
    setMockActor(
      createMockActor({
        listProjects: vi
          .fn()
          .mockResolvedValue([
            makeProject({ id: 1n, title: "โครงการหนึ่ง" }),
            makeProject({ id: 2n, title: "โครงการสอง" }),
          ]),
      }),
    );

    renderPage(ProjectsPage, { path: "/projects" });

    expect(
      await screen.findByRole("heading", { name: "โครงการหนึ่ง" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "โครงการสอง" }),
    ).toBeInTheDocument();

    const openLinks = screen.getAllByRole("link", { name: /ดูรายละเอียด/ });
    expect(openLinks).toHaveLength(2);
    expect(openLinks[0]).toHaveAttribute("href", "/projects/1");
  });

  it("shows the empty state when no projects exist", async () => {
    setMockActor(
      createMockActor({ listProjects: vi.fn().mockResolvedValue([]) }),
    );

    renderPage(ProjectsPage, { path: "/projects" });

    expect(await screen.findByText("ยังไม่มีโครงการ")).toBeInTheDocument();
  });

  it("forwards the search term to the backend filter", async () => {
    const listProjects = vi.fn().mockResolvedValue([]);
    setMockActor(createMockActor({ listProjects }));

    renderPage(ProjectsPage, { path: "/projects" });

    await userEvent.type(await screen.findByLabelText("ค้นหาโครงการ"), "พยากรณ์");

    await waitFor(() =>
      expect(listProjects).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "พยากรณ์" }),
      ),
    );
  });

  it("forwards the selected status to the backend filter", async () => {
    const listProjects = vi.fn().mockResolvedValue([]);
    setMockActor(createMockActor({ listProjects }));

    renderPage(ProjectsPage, { path: "/projects" });

    await userEvent.click(await screen.findByLabelText("สถานะ"));
    await userEvent.click(await screen.findByRole("option", { name: "ส่งแล้ว" }));

    await waitFor(() =>
      expect(listProjects).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ProjectStatus.submitted }),
      ),
    );
  });

  it("clears active filters back to an unfiltered query", async () => {
    const listProjects = vi.fn().mockResolvedValue([]);
    setMockActor(createMockActor({ listProjects }));

    renderPage(ProjectsPage, { path: "/projects" });

    await userEvent.type(await screen.findByLabelText("ค้นหาโครงการ"), "พยากรณ์");
    await waitFor(() =>
      expect(listProjects).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "พยากรณ์" }),
      ),
    );

    await userEvent.click(
      await screen.findByTestId("projects.clear_filters_button"),
    );

    await waitFor(() => expect(listProjects).toHaveBeenLastCalledWith({}));
  });

  it("renders the project count for the current result set", async () => {
    setMockActor(
      createMockActor({
        listProjects: vi
          .fn()
          .mockResolvedValue([
            makeProject({ id: 1n }),
            makeProject({ id: 2n }),
          ]),
      }),
    );

    renderPage(ProjectsPage, { path: "/projects" });

    await waitFor(() =>
      expect(screen.getByText("2", { selector: "span" })).toBeInTheDocument(),
    );
  });
});
