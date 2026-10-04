// PocketIC backend lane: drives the real canister wasm through its public
// Candid interface. The runner (`run-backend-lane.mjs`) supplies POCKET_IC_URL
// and BACKEND_WASM and only reaches this file when a live replica is hosting.
//
// Coverage is deliberately the backend's own contract, not the frontend's:
// project create/read/update round-trips, caller isolation, milestone and
// sub-task progress, and the anonymous-caller rejection. The frontend suite
// mocks this actor, so these are the only tests that observe the real Motoko.

import { readFileSync } from "node:fs";
import { PocketIc, createIdentity, type Actor } from "@dfinity/pic";
import { AnonymousIdentity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  idlFactory,
  type _SERVICE,
  type ProjectInput,
  type ProjectFilter,
} from "../../src/frontend/src/declarations/backend.did.js";

const POCKET_IC_URL = process.env.POCKET_IC_URL;
const BACKEND_WASM = process.env.BACKEND_WASM;

if (POCKET_IC_URL === undefined || BACKEND_WASM === undefined) {
  throw new Error(
    "backend lane requires POCKET_IC_URL and BACKEND_WASM; run it through test/pocketic/run-backend-lane.mjs",
  );
}

/** The empty filter the frontend sends for an unfiltered project list. */
const NO_FILTER: ProjectFilter = {
  status: [],
  search: [],
  academicYear: [],
  category: [],
};

function projectInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    title: "ระบบวิเคราะห์ข้อมูลเพื่อพยากรณ์ผลการเรียน",
    abstract: "โครงการนี้พัฒนาระบบวิเคราะห์ข้อมูล",
    keywords: ["ข้อมูลขนาดใหญ่", "การเรียนรู้ของเครื่อง"],
    category: "วิศวกรรมคอมพิวเตอร์",
    advisor: Principal.fromText("aaaaa-aa"),
    members: [],
    academicYear: "2567",
    ...overrides,
  };
}

describe("backend canister", () => {
  let pic: PocketIc;
  let actor: Actor<_SERVICE>;
  let canisterId: Principal;

  // The first non-anonymous caller to register becomes the platform admin.
  const admin = createIdentity("backend-lane-admin-seed");
  const student = createIdentity("backend-lane-student-seed");
  const otherStudent = createIdentity("backend-lane-other-student-seed");

  beforeAll(async () => {
    pic = await PocketIc.create(POCKET_IC_URL, {
      processingTimeoutMs: 30_000,
    });
    const wasm = readFileSync(BACKEND_WASM);
    const fixture = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm,
    });
    actor = fixture.actor;
    canisterId = fixture.canisterId;

    // Register the admin first so the authorization extension has an admin,
    // then the two students. Registration is what makes `isCallerAdmin` and
    // the role-gated paths answerable at all.
    actor.setIdentity(admin);
    await actor._initialize_access_control();
    actor.setIdentity(student);
    await actor._initialize_access_control();
    actor.setIdentity(otherStudent);
    await actor._initialize_access_control();
  }, 60_000);

  afterAll(async () => {
    await pic?.tearDown();
  });

  it("starts with no projects and no project for an unknown id", async () => {
    actor.setIdentity(student);
    await expect(actor.listProjects(NO_FILTER)).resolves.toEqual([]);
    await expect(actor.getProject(999n)).resolves.toEqual([]);
    await expect(actor.listMyProjects()).resolves.toEqual([]);
  });

  it("creates a draft project and reads it back for its owner", async () => {
    actor.setIdentity(student);
    const created = await actor.createProject(projectInput());

    expect(created.id).toBe(0n);
    expect(created.status).toEqual({ draft: null });
    expect(created.title).toBe("ระบบวิเคราะห์ข้อมูลเพื่อพยากรณ์ผลการเรียน");
    expect(created.owner).toEqual(student.getPrincipal());

    const fetched = await actor.getProject(created.id);
    expect(fetched).toHaveLength(1);
    expect(fetched[0]?.title).toBe(created.title);

    const mine = await actor.listMyProjects();
    expect(mine.map((p) => p.id)).toContain(created.id);
  });

  it("keeps one student's projects out of another student's list", async () => {
    actor.setIdentity(student);
    const created = await actor.createProject(
      projectInput({ title: "โครงการของนักศึกษาคนแรก" }),
    );

    actor.setIdentity(otherStudent);
    const otherMine = await actor.listMyProjects();
    expect(otherMine.map((p) => p.id)).not.toContain(created.id);

    // The unfiltered list is public, so the project is visible there.
    const all = await actor.listProjects(NO_FILTER);
    expect(all.map((p) => p.id)).toContain(created.id);
  });

  it("updates a project's details and moves it to submitted", async () => {
    actor.setIdentity(student);
    const created = await actor.createProject(projectInput());

    const updated = await actor.updateProject(created.id, {
      title: "ชื่อเรื่องที่แก้ไขแล้ว",
      abstract: "บทคัดย่อฉบับแก้ไข",
      keywords: ["แก้ไข"],
      category: "วิศวกรรมซอฟต์แวร์",
      advisor: Principal.fromText("aaaaa-aa"),
      members: [],
      academicYear: "2568",
    });
    expect(updated.title).toBe("ชื่อเรื่องที่แก้ไขแล้ว");
    expect(updated.academicYear).toBe("2568");

    const submitted = await actor.setProjectStatus(created.id, {
      submitted: null,
    });
    expect(submitted.status).toEqual({ submitted: null });
  });

  it("filters projects by status", async () => {
    actor.setIdentity(student);
    const created = await actor.createProject(
      projectInput({ title: "โครงการที่ส่งแล้ว" }),
    );
    await actor.setProjectStatus(created.id, { submitted: null });

    const submitted = await actor.listProjects({
      ...NO_FILTER,
      status: [{ submitted: null }],
    });
    expect(submitted.map((p) => p.id)).toContain(created.id);
    expect(submitted.every((p) => "submitted" in p.status)).toBe(true);
  });

  it("tracks milestone and sub-task progress as work completes", async () => {
    actor.setIdentity(student);
    const project = await actor.createProject(
      projectInput({ title: "โครงการติดตามความคืบหน้า" }),
    );

    const milestone = await actor.createMilestone({
      projectId: project.id,
      name: "โครงร่างบทที่ 1–3",
      dueDate: 1_700_000_000_000_000_000n,
      weight: 50n,
    });
    expect(milestone.status).toEqual({ notStarted: null });

    const subTask = await actor.createSubTask({
      milestoneId: milestone.id,
      title: "รวบรวมเอกสารอ้างอิง",
      assignee: student.getPrincipal(),
      dueDate: 1_700_000_000_000_000_000n,
    });
    expect(subTask.done).toBe(false);

    const before = await actor.getProjectProgress(project.id);
    expect(before.totalMilestones).toBe(1n);
    expect(before.totalSubTasks).toBe(1n);
    expect(before.doneSubTasks).toBe(0n);

    await actor.setSubTaskDone(subTask.id, true);
    await actor.setMilestoneStatus(milestone.id, { done: null });

    const after = await actor.getProjectProgress(project.id);
    expect(after.doneSubTasks).toBe(1n);
    expect(after.doneMilestones).toBe(1n);
    expect(after.percent).toBe(100n);

    const listed = await actor.listMilestones(project.id);
    expect(listed.map((m) => m.id)).toContain(milestone.id);
  });

  it("rejects an anonymous caller creating a project", async () => {
    actor.setIdentity(new AnonymousIdentity());
    await expect(actor.createProject(projectInput())).rejects.toThrow();
  });

  it("reports the caller's platform admin status", async () => {
    actor.setIdentity(admin);
    await expect(actor.isCallerAdmin()).resolves.toBe(true);

    actor.setIdentity(student);
    await expect(actor.isCallerAdmin()).resolves.toBe(false);
  });

  it("exposes the canister id it was installed at", () => {
    expect(canisterId).toBeDefined();
  });
});
