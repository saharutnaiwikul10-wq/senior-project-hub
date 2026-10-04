import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@caffeineai/core-infrastructure",
  () => import("@/test/coreInfrastructureMock"),
);

import { AppRole } from "@/backend";
import { SettingsPage } from "@/pages/SettingsPage";
import {
  resetMockCoreInfrastructure,
  setMockActor,
} from "@/test/coreInfrastructureMock";
import { makeProfile } from "@/test/fixtures";
import { createMockActor, renderPage } from "@/test/harness";

/**
 * Account settings journeys: the caller sees their verified email and role, and
 * can save an edited display name/department through `saveCallerUserProfile`.
 */
describe("SettingsPage", () => {
  beforeEach(() => {
    resetMockCoreInfrastructure();
  });

  it("shows the caller's verified email and role", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi.fn().mockResolvedValue(
          makeProfile({
            role: AppRole.advisor,
            email: "advisor@example.ac.th",
          }),
        ),
      }),
    );

    renderPage(SettingsPage, { path: "/settings" });

    expect(
      await screen.findByText("advisor@example.ac.th"),
    ).toBeInTheDocument();
    expect(screen.getByText("อาจารย์ที่ปรึกษา")).toBeInTheDocument();
  });

  it("falls back to a placeholder when no email is verified", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ email: undefined })),
      }),
    );

    renderPage(SettingsPage, { path: "/settings" });

    expect(await screen.findByText("ยังไม่ยืนยันอีเมล")).toBeInTheDocument();
  });

  it("saves an edited display name through the backend", async () => {
    const saveCallerUserProfile = vi.fn().mockResolvedValue(undefined);
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ displayName: "สมชาย ใจดี" })),
        saveCallerUserProfile,
      }),
    );

    renderPage(SettingsPage, { path: "/settings" });

    const nameInput = await screen.findByTestId("settings.display_name_input");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "สมหญิง ตั้งใจ");
    await userEvent.click(screen.getByTestId("settings.save_button"));

    await waitFor(() =>
      expect(saveCallerUserProfile).toHaveBeenCalledWith(
        "สมหญิง ตั้งใจ",
        "วิศวกรรมคอมพิวเตอร์",
      ),
    );
    expect(
      await screen.findByTestId("settings.save.success_state"),
    ).toBeInTheDocument();
  });

  it("disables saving until the profile is actually changed", async () => {
    setMockActor(
      createMockActor({
        getCallerUserProfile: vi
          .fn()
          .mockResolvedValue(makeProfile({ displayName: "สมชาย ใจดี" })),
      }),
    );

    renderPage(SettingsPage, { path: "/settings" });

    const saveButton = await screen.findByTestId("settings.save_button");
    expect(saveButton).toBeDisabled();
  });
});
