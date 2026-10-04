import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

// The upload path constructs a real `ExternalBlob`, which would reach the
// platform object-storage service. A local stub keeps the journey offline while
// preserving the fluent `fromBytes(...).withUploadProgress(...)` shape the page
// relies on.
vi.mock("@caffeineai/object-storage", () => {
  class ExternalBlob {
    static fromBytes() {
      return new ExternalBlob();
    }
    withUploadProgress() {
      return this;
    }
    getBytes() {
      return Promise.resolve(new Uint8Array([1, 2, 3]));
    }
  }
  return { ExternalBlob };
});

import { FilesPage } from "@/pages/FilesPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { makeProject, makeProjectFile } from "@/test/fixtures";
import { PRINCIPAL, createMockActor, renderPage } from "@/test/harness";

const PATH = "/projects/$id/files";
const ENTRY = "/projects/1/files";

/**
 * Project file journeys: the list renders with a download action, the owner can
 * delete their own file, and an upload is forwarded to `addProjectFile`.
 */
describe("FilesPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("renders each file with a download action", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listProjectFiles: vi
          .fn()
          .mockResolvedValue([
            makeProjectFile({ id: 1n, name: "proposal.pdf", version: "1.0" }),
            makeProjectFile({ id: 2n, name: "slides.pptx", version: "2.0" }),
          ]),
      }),
    );

    renderPage(FilesPage, { path: PATH, initialEntry: ENTRY });

    expect(await screen.findByText("proposal.pdf")).toBeInTheDocument();
    expect(screen.getByText("slides.pptx")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ดาวน์โหลด/ })).toHaveLength(2);
  });

  it("shows the empty state when the project has no files", async () => {
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listProjectFiles: vi.fn().mockResolvedValue([]),
      }),
    );

    renderPage(FilesPage, { path: PATH, initialEntry: ENTRY });

    expect(await screen.findByText("ยังไม่มีไฟล์ในโครงการนี้")).toBeInTheDocument();
  });

  it("deletes a file the caller uploaded", async () => {
    const deleteProjectFile = vi.fn().mockResolvedValue(undefined);
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        // The mocked caller principal is `PRINCIPAL`; only the uploader (or an
        // admin) is offered the delete action.
        listProjectFiles: vi
          .fn()
          .mockResolvedValue([
            makeProjectFile({ id: 42n, uploadedBy: PRINCIPAL }),
          ]),
        deleteProjectFile,
      }),
    );

    renderPage(FilesPage, { path: PATH, initialEntry: ENTRY });

    await userEvent.click(await screen.findByTestId("files.delete_button.1"));

    await waitFor(() => expect(deleteProjectFile).toHaveBeenCalledWith(42n));
  });

  it("uploads a selected file through addProjectFile", async () => {
    const addProjectFile = vi
      .fn()
      .mockResolvedValue(makeProjectFile({ id: 9n }));
    setMockActor(
      createMockActor({
        getProject: vi.fn().mockResolvedValue(makeProject({ id: 1n })),
        listProjectFiles: vi.fn().mockResolvedValue([]),
        addProjectFile,
      }),
    );

    renderPage(FilesPage, { path: PATH, initialEntry: ENTRY });

    const file = new File(["hello"], "report.pdf", {
      type: "application/pdf",
    });
    // jsdom's File does not always implement `arrayBuffer`; the upload path
    // reads the bytes through it.
    if (typeof file.arrayBuffer !== "function") {
      Object.defineProperty(file, "arrayBuffer", {
        value: () =>
          Promise.resolve(new Uint8Array([104, 101, 108, 108, 111]).buffer),
      });
    }
    fireEvent.change(await screen.findByTestId("files.upload_input"), {
      target: { files: [file] },
    });

    await userEvent.click(
      await screen.findByTestId("files.upload_submit_button"),
    );

    await waitFor(() => expect(addProjectFile).toHaveBeenCalledTimes(1));
    expect(addProjectFile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1n,
        name: "report.pdf",
        mimeType: "application/pdf",
        category: "เอกสาร",
      }),
    );
  });
});
