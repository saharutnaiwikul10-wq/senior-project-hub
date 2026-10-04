import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { MilestoneStatus } from "@/backend";
import { MilestonesPage } from "@/pages/MilestonesPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import {
  makeMilestone,
  makeProgress,
  makeProject,
  makeSubTask,
} from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

/** jsdom's date input ignores `userEvent.type`; set the value directly. */
function setDateInput(testId: string, value: string) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

/**
 * Milestone/sub-task journeys: the progress strip reflects backend progress,
 * a milestone can be created through the dialog, and sub-tasks can be added
 * and toggled done.
 */
describe("MilestonesPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("renders milestones with the overall progress percentage", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listMilestones: vi
          .fn()
          .mockResolvedValue([
            makeMilestone({ id: 10n, name: "โครงร่างบทที่ 1–3" }),
          ]),
        getProjectProgress: vi
          .fn()
          .mockResolvedValue(
            makeProgress({ percent: 40n, totalSubTasks: 5n, doneSubTasks: 2n }),
          ),
      }),
    );

    renderPage(MilestonesPage, {
      path: "/projects/$id/milestones",
      initialEntry: "/projects/1/milestones",
    });

    expect(await screen.findByTestId("milestone.item.1")).toBeInTheDocument();
    expect(screen.getAllByText("โครงร่างบทที่ 1–3").length).toBeGreaterThan(0);
    expect(screen.getByText("40%")).toBeInTheDocument();
    // The "งานย่อยที่เสร็จ" KPI renders "2" and "/5" as separate nodes.
    expect(
      screen.getByText((_, element) => element?.textContent === "2/5"),
    ).toBeInTheDocument();
  });

  it("creates a milestone through the dialog", async () => {
    const createMilestone = vi
      .fn()
      .mockResolvedValue(makeMilestone({ id: 11n }));
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listMilestones: vi.fn().mockResolvedValue([]),
        getProjectProgress: vi.fn().mockResolvedValue(makeProgress()),
        createMilestone,
      }),
    );

    renderPage(MilestonesPage, {
      path: "/projects/$id/milestones",
      initialEntry: "/projects/1/milestones",
    });

    await userEvent.click(
      await screen.findByTestId("milestone.open_modal_button"),
    );
    const nameInput = await screen.findByTestId("milestone.name_input");
    fireEvent.change(nameInput, { target: { value: "สอบป้องกันโครงงาน" } });
    setDateInput("milestone.due_input", "2026-05-01");
    fireEvent.change(screen.getByTestId("milestone.weight_input"), {
      target: { value: "30" },
    });
    fireEvent.submit(
      screen.getByTestId("milestone.submit_button").closest("form")!,
    );

    await waitFor(() => expect(createMilestone).toHaveBeenCalledTimes(1));
    expect(createMilestone).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1n,
        name: "สอบป้องกันโครงงาน",
        weight: 30n,
      }),
    );
  });

  it("adds a sub-task under a milestone", async () => {
    const createSubTask = vi.fn().mockResolvedValue(makeSubTask({ id: 101n }));
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listMilestones: vi.fn().mockResolvedValue([makeMilestone({ id: 10n })]),
        getProjectProgress: vi.fn().mockResolvedValue(makeProgress()),
        listSubTasks: vi.fn().mockResolvedValue([]),
        createSubTask,
      }),
    );

    renderPage(MilestonesPage, {
      path: "/projects/$id/milestones",
      initialEntry: "/projects/1/milestones",
    });

    await userEvent.click(
      await screen.findByTestId("milestone.expand_button.1"),
    );
    await userEvent.type(
      await screen.findByTestId("subtask.title_input"),
      "รวบรวมเอกสารอ้างอิง",
    );
    await userEvent.type(
      screen.getByTestId("subtask.assignee_input"),
      "2vxsx-fae",
    );
    setDateInput("subtask.due_input", "2026-04-01");
    await userEvent.click(screen.getByTestId("subtask.add_button"));

    await waitFor(() => expect(createSubTask).toHaveBeenCalledTimes(1));
    expect(createSubTask).toHaveBeenCalledWith(
      expect.objectContaining({
        milestoneId: 10n,
        title: "รวบรวมเอกสารอ้างอิง",
      }),
    );
  });

  it("toggles a sub-task done through the checkbox", async () => {
    const setSubTaskDone = vi.fn().mockResolvedValue(undefined);
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listMilestones: vi.fn().mockResolvedValue([makeMilestone({ id: 10n })]),
        getProjectProgress: vi.fn().mockResolvedValue(makeProgress()),
        listSubTasks: vi
          .fn()
          .mockResolvedValue([
            makeSubTask({ id: 100n, title: "รวบรวมเอกสารอ้างอิง", done: false }),
          ]),
        setSubTaskDone,
      }),
    );

    renderPage(MilestonesPage, {
      path: "/projects/$id/milestones",
      initialEntry: "/projects/1/milestones",
    });

    await userEvent.click(
      await screen.findByTestId("milestone.expand_button.1"),
    );
    const row = await screen.findByTestId("subtask.item");
    await userEvent.click(within(row).getByTestId("subtask.checkbox"));

    await waitFor(() => expect(setSubTaskDone).toHaveBeenCalledTimes(1));
    expect(setSubTaskDone).toHaveBeenCalledWith(100n, true);
  });

  it("changes a milestone status through the status select", async () => {
    const setMilestoneStatus = vi.fn().mockResolvedValue(undefined);
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listMilestones: vi
          .fn()
          .mockResolvedValue([
            makeMilestone({ id: 10n, status: MilestoneStatus.notStarted }),
          ]),
        getProjectProgress: vi.fn().mockResolvedValue(makeProgress()),
        listSubTasks: vi.fn().mockResolvedValue([]),
        setMilestoneStatus,
      }),
    );

    renderPage(MilestonesPage, {
      path: "/projects/$id/milestones",
      initialEntry: "/projects/1/milestones",
    });

    await userEvent.click(
      await screen.findByTestId("milestone.status_select.1"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "กำลังดำเนินการ" }),
    );

    await waitFor(() => expect(setMilestoneStatus).toHaveBeenCalledTimes(1));
    expect(setMilestoneStatus).toHaveBeenCalledWith(
      10n,
      MilestoneStatus.inProgress,
    );
  });
});
