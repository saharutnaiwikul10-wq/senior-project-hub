import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { ProjectStatus } from "@/backend";
import { ProjectFormPage } from "@/pages/ProjectFormPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { ADVISOR, makeProject } from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

const ADVISOR_TEXT = ADVISOR.toText();

/**
 * Project create/edit journeys: required-field validation, saving a draft
 * through `createProject`, and re-seeding the form from an existing project.
 */
describe("ProjectFormPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("blocks saving a draft when required fields are empty", async () => {
    const createProject = vi.fn();
    setMockActor(createMockActor({ createProject }));

    renderPage(ProjectFormPage, { path: "/projects/new" });

    await userEvent.click(
      await screen.findByTestId("project_form.save_draft_button"),
    );

    expect(
      await screen.findByText("กรุณากรอกชื่อเรื่องโครงการ"),
    ).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("rejects an invalid advisor principal", async () => {
    const createProject = vi.fn();
    setMockActor(createMockActor({ createProject }));

    renderPage(ProjectFormPage, { path: "/projects/new" });

    await userEvent.type(
      await screen.findByTestId("project_form.title_input"),
      "ระบบทดสอบ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.abstract_textarea"),
      "บทคัดย่อของโครงการทดสอบที่มีความยาวเพียงพอ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.keywords_input"),
      "ทดสอบ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.advisor_input"),
      "not-a-principal",
    );

    await userEvent.click(screen.getByTestId("project_form.save_draft_button"));

    expect(
      await screen.findByText("รหัส Principal ของอาจารย์ที่ปรึกษาไม่ถูกต้อง"),
    ).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("creates a project as a draft with the entered values", async () => {
    const createProject = vi
      .fn()
      .mockResolvedValue(makeProject({ id: 7n, title: "ระบบทดสอบ" }));
    setMockActor(createMockActor({ createProject }));

    renderPage(ProjectFormPage, { path: "/projects/new" });

    await userEvent.type(
      await screen.findByTestId("project_form.title_input"),
      "ระบบทดสอบ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.abstract_textarea"),
      "บทคัดย่อของโครงการทดสอบที่มีความยาวเพียงพอ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.keywords_input"),
      "ทดสอบ, ระบบ",
    );
    await userEvent.type(
      screen.getByTestId("project_form.advisor_input"),
      ADVISOR_TEXT,
    );

    await userEvent.click(screen.getByTestId("project_form.category_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "วิศวกรรมคอมพิวเตอร์" }),
    );

    await userEvent.click(screen.getByTestId("project_form.save_draft_button"));

    await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1));
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "ระบบทดสอบ",
        keywords: ["ทดสอบ", "ระบบ"],
        advisor: expect.objectContaining({ toText: expect.any(Function) }),
      }),
    );
  });

  it("pre-fills the form from an existing project in edit mode", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(
          makeProject({
            id: 5n,
            title: "โครงการเดิม",
            abstract: "บทคัดย่อเดิมของโครงการที่มีอยู่แล้ว",
            keywords: ["เดิม"],
            status: ProjectStatus.draft,
          }),
        ),
      }),
    );

    renderPage(ProjectFormPage, {
      path: "/projects/$id/edit",
      initialEntry: "/projects/5/edit",
    });

    expect(await screen.findByDisplayValue("โครงการเดิม")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("บทคัดย่อเดิมของโครงการที่มีอยู่แล้ว"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("เดิม")).toBeInTheDocument();
  });
});
