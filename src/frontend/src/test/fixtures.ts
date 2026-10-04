import type {
  AdminStats,
  Comment,
  DeadlineEntry,
  Evaluation,
  Milestone,
  ProgressSummary,
  Project,
  ProjectFile,
  ScoreSummary,
  SubTask,
  UserProfileView,
} from "@/backend";
import { AppRole, MilestoneStatus, ProjectStatus } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";

/** A stable principal used across fixtures. */
export const ADVISOR = Principal.fromText("aaaaa-aa");
export const OWNER = Principal.fromText("2vxsx-fae");
export const MEMBER = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");

/** One nanosecond timestamp per day, anchored to a fixed instant. */
export const DAY_NS = 86_400_000_000_000n;
export const BASE_NS = 1_700_000_000_000_000_000n;

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1n,
    status: ProjectStatus.draft,
    title: "ระบบวิเคราะห์ข้อมูลเพื่อพยากรณ์ผลการเรียน",
    members: [{ principal: MEMBER, name: "นายสมชาย ใจดี", role: "สมาชิกหลัก" }],
    owner: OWNER,
    createdAt: BASE_NS,
    academicYear: "2567",
    keywords: ["ข้อมูลขนาดใหญ่", "การเรียนรู้ของเครื่อง"],
    updatedAt: BASE_NS,
    abstract: "โครงการนี้พัฒนาระบบวิเคราะห์ข้อมูลเพื่อพยากรณ์ผลการเรียนของนักศึกษา",
    category: "วิศวกรรมคอมพิวเตอร์",
    advisor: ADVISOR,
    ...overrides,
  };
}

export function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 10n,
    weight: 20n,
    status: MilestoneStatus.notStarted,
    name: "โครงร่างบทที่ 1–3",
    createdAt: BASE_NS,
    dueDate: BASE_NS + 7n * DAY_NS,
    projectId: 1n,
    ...overrides,
  };
}

export function makeSubTask(overrides: Partial<SubTask> = {}): SubTask {
  return {
    id: 100n,
    assignee: MEMBER,
    title: "รวบรวมเอกสารอ้างอิง",
    done: false,
    dueDate: BASE_NS + 3n * DAY_NS,
    milestoneId: 10n,
    ...overrides,
  };
}

export function makeProgress(
  overrides: Partial<ProgressSummary> = {},
): ProgressSummary {
  return {
    projectId: 1n,
    percent: 0n,
    totalMilestones: 0n,
    doneMilestones: 0n,
    totalSubTasks: 0n,
    doneSubTasks: 0n,
    ...overrides,
  };
}

export function makeEvaluation(
  overrides: Partial<Evaluation> = {},
): Evaluation {
  return {
    id: 1n,
    evaluator: ADVISOR,
    createdAt: BASE_NS,
    totalScore: 85n,
    comment: "ผลงานดีมาก",
    projectId: 1n,
    criteria: [
      { criterion: "creativity", weight: 30n, maxScore: 10n, score: 9n },
      { criterion: "methodology", weight: 40n, maxScore: 10n, score: 8n },
      { criterion: "presentation", weight: 30n, maxScore: 10n, score: 8n },
    ],
    averageScore: 8n,
    ...overrides,
  };
}

export function makeScoreSummary(
  overrides: Partial<ScoreSummary> = {},
): ScoreSummary {
  return {
    projectId: 1n,
    evaluationCount: 0n,
    averageTotal: 0n,
    averageScore: 0n,
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1n,
    body: "ควรเพิ่มการทดสอบ",
    createdAt: BASE_NS,
    author: ADVISOR,
    target: { __kind__: "project", project: 1n },
    ...overrides,
  };
}

export function makeDeadline(
  overrides: Partial<DeadlineEntry> = {},
): DeadlineEntry {
  return {
    status: MilestoneStatus.inProgress,
    dueDate: BASE_NS + 2n * DAY_NS,
    projectTitle: "ระบบวิเคราะห์ข้อมูล",
    milestoneId: 10n,
    projectId: 1n,
    overdue: false,
    milestoneName: "โครงร่างบทที่ 1–3",
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<UserProfileView> = {},
): UserProfileView {
  return {
    principal: OWNER,
    displayName: "สมชาย ใจดี",
    createdAt: BASE_NS,
    role: AppRole.student,
    email: "somchai@example.ac.th",
    department: "วิศวกรรมคอมพิวเตอร์",
    ...overrides,
  };
}

export function makeAdminStats(
  overrides: Partial<AdminStats> = {},
): AdminStats {
  return {
    totalProjects: 0n,
    totalUsers: 0n,
    byStatus: [],
    byCategory: [],
    ...overrides,
  };
}

export function makeProjectFile(
  overrides: Partial<ProjectFile> = {},
): ProjectFile {
  return {
    id: 1n,
    blob: {} as ProjectFile["blob"],
    name: "proposal.pdf",
    mimeType: "application/pdf",
    version: "1.0",
    projectId: 1n,
    category: "เอกสาร",
    uploadedAt: BASE_NS,
    uploadedBy: OWNER,
    ...overrides,
  };
}
