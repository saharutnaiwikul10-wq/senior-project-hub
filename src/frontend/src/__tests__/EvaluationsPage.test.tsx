import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { AppRole } from "@/backend";
import { EvaluationsPage } from "@/pages/EvaluationsPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import {
  makeComment,
  makeEvaluation,
  makeProfile,
  makeProject,
  makeScoreSummary,
} from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

const PATH = "/projects/$id/evaluations";
const ENTRY = "/projects/1/evaluations";

function baseActor(overrides: Record<string, unknown> = {}) {
  return createMockActor({
    getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
    listEvaluations: vi.fn().mockResolvedValue([]),
    getScoreSummary: vi.fn().mockResolvedValue(makeScoreSummary()),
    listProjectComments: vi.fn().mockResolvedValue([]),
    ...overrides,
  });
}

/**
 * Evaluation journeys: role-gated scoring form, weighted total preview,
 * submission, and project comments.
 */
describe("EvaluationsPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("shows the scoring form to an advisor and previews the weighted total", async () => {
    setMockActor(
      baseActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.advisor })),
      }),
    );

    renderPage(EvaluationsPage, { path: PATH, initialEntry: ENTRY });

    expect(
      await screen.findByTestId("evaluations.form_card"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("evaluations.score_input.creativity"), {
      target: { value: "10" },
    });
    fireEvent.change(
      screen.getByTestId("evaluations.score_input.methodology"),
      {
        target: { value: "10" },
      },
    );
    fireEvent.change(
      screen.getByTestId("evaluations.score_input.presentation"),
      { target: { value: "10" } },
    );

    // 10*30% + 10*40% + 10*30% = 10.0
    expect(screen.getByTestId("evaluations.preview_total")).toHaveTextContent(
      "10.0",
    );
  });

  it("submits an evaluation with the entered criteria", async () => {
    const submitEvaluation = vi.fn().mockResolvedValue(makeEvaluation());
    setMockActor(
      baseActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.advisor })),
        submitEvaluation,
      }),
    );

    renderPage(EvaluationsPage, { path: PATH, initialEntry: ENTRY });

    await screen.findByTestId("evaluations.form_card");
    fireEvent.change(screen.getByTestId("evaluations.score_input.creativity"), {
      target: { value: "9" },
    });
    fireEvent.change(
      screen.getByTestId("evaluations.score_input.methodology"),
      {
        target: { value: "8" },
      },
    );
    fireEvent.change(
      screen.getByTestId("evaluations.score_input.presentation"),
      { target: { value: "7" } },
    );
    fireEvent.change(screen.getByTestId("evaluations.comment_textarea"), {
      target: { value: "ผลงานดีมาก" },
    });
    fireEvent.submit(
      screen.getByTestId("evaluations.submit_button").closest("form")!,
    );

    await waitFor(() => expect(submitEvaluation).toHaveBeenCalledTimes(1));
    expect(submitEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1n,
        comment: "ผลงานดีมาก",
        criteria: expect.arrayContaining([
          expect.objectContaining({ criterion: "creativity", score: 9n }),
          expect.objectContaining({ criterion: "methodology", score: 8n }),
          expect.objectContaining({ criterion: "presentation", score: 7n }),
        ]),
      }),
    );
    expect(
      await screen.findByTestId("evaluations.success_state"),
    ).toBeInTheDocument();
  });

  it("shows a read-only notice to a student", async () => {
    setMockActor(
      baseActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.student })),
      }),
    );

    renderPage(EvaluationsPage, { path: PATH, initialEntry: ENTRY });

    expect(
      await screen.findByTestId("evaluations.readonly_notice"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("evaluations.form_card"),
    ).not.toBeInTheDocument();
  });

  it("renders the score summary and existing evaluations", async () => {
    setMockActor(
      baseActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.committee })),
        getScoreSummary: vi.fn().mockResolvedValue(
          makeScoreSummary({
            evaluationCount: 2n,
            averageTotal: 85n,
            averageScore: 8n,
          }),
        ),
        listEvaluations: vi
          .fn()
          .mockResolvedValue([makeEvaluation({ id: 1n })]),
      }),
    );

    renderPage(EvaluationsPage, { path: PATH, initialEntry: ENTRY });

    await waitFor(() =>
      expect(screen.getByTestId("evaluations.summary_count")).toHaveTextContent(
        "2",
      ),
    );
    expect(
      screen.getByTestId("evaluations.summary_average_total"),
    ).toHaveTextContent("85");
    expect(await screen.findByTestId("evaluation.item.1")).toBeInTheDocument();
  });

  it("adds a project comment", async () => {
    const addComment = vi.fn().mockResolvedValue(makeComment());
    setMockActor(
      baseActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ role: AppRole.advisor })),
        addComment,
      }),
    );

    renderPage(EvaluationsPage, { path: PATH, initialEntry: ENTRY });

    await userEvent.type(
      await screen.findByTestId("evaluations.comment_input"),
      "ควรเพิ่มการทดสอบ",
    );
    fireEvent.submit(
      screen.getByTestId("evaluations.comment_submit_button").closest("form")!,
    );

    await waitFor(() => expect(addComment).toHaveBeenCalledTimes(1));
    expect(addComment).toHaveBeenCalledWith({
      body: "ควรเพิ่มการทดสอบ",
      target: { __kind__: "project", project: 1n },
    });
  });
});
