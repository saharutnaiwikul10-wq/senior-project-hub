import type {
  AdminStats,
  AdvisorDashboard,
  Comment,
  CommentTarget,
  CountByLabel,
  CriterionScore,
  DeadlineEntry,
  Evaluation,
  Milestone,
  ProgressSummary,
  Project,
  ProjectFile,
  ScoreSummary,
  StudentDashboard,
  SubTask,
  UserProfileView,
} from "@/backend";
import { AppRole, MilestoneStatus, ProjectStatus } from "@/backend";

export type {
  AdminStats,
  AdvisorDashboard,
  Comment,
  CommentTarget,
  CountByLabel,
  CriterionScore,
  DeadlineEntry,
  Evaluation,
  Milestone,
  ProgressSummary,
  Project,
  ProjectFile,
  ScoreSummary,
  StudentDashboard,
  SubTask,
  UserProfileView,
};

export { AppRole, MilestoneStatus, ProjectStatus };

/** Thai display labels for the three application roles. */
export const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.student]: "นักศึกษา",
  [AppRole.advisor]: "อาจารย์ที่ปรึกษา",
  [AppRole.committee]: "กรรมการ",
  [AppRole.admin]: "ผู้ดูแลระบบ",
};

/** Latin gloss shown beneath the Thai role label. */
export const ROLE_LABELS_EN: Record<AppRole, string> = {
  [AppRole.student]: "Student",
  [AppRole.advisor]: "Advisor",
  [AppRole.committee]: "Committee",
  [AppRole.admin]: "Admin",
};

/** Thai display labels for project lifecycle status. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.draft]: "ฉบับร่าง",
  [ProjectStatus.pending]: "รออนุมัติ",
  [ProjectStatus.inProgress]: "กำลังดำเนินการ",
  [ProjectStatus.submitted]: "ส่งแล้ว",
  [ProjectStatus.passed]: "ผ่าน",
  [ProjectStatus.failed]: "ไม่ผ่าน",
};

export const PROJECT_STATUS_LABELS_EN: Record<ProjectStatus, string> = {
  [ProjectStatus.draft]: "Draft",
  [ProjectStatus.pending]: "Pending",
  [ProjectStatus.inProgress]: "In progress",
  [ProjectStatus.submitted]: "Submitted",
  [ProjectStatus.passed]: "Passed",
  [ProjectStatus.failed]: "Failed",
};

/** Thai display labels for milestone progress status. */
export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  [MilestoneStatus.notStarted]: "ยังไม่เริ่ม",
  [MilestoneStatus.inProgress]: "กำลังดำเนินการ",
  [MilestoneStatus.done]: "เสร็จสิ้น",
};

export const MILESTONE_STATUS_LABELS_EN: Record<MilestoneStatus, string> = {
  [MilestoneStatus.notStarted]: "Not started",
  [MilestoneStatus.inProgress]: "In progress",
  [MilestoneStatus.done]: "Done",
};

/** Semantic token name used by the status badge for each project status. */
export type StatusTone =
  | "draft"
  | "warning"
  | "progress"
  | "info"
  | "success"
  | "destructive";

export const PROJECT_STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  [ProjectStatus.draft]: "draft",
  [ProjectStatus.pending]: "warning",
  [ProjectStatus.inProgress]: "progress",
  [ProjectStatus.submitted]: "info",
  [ProjectStatus.passed]: "success",
  [ProjectStatus.failed]: "destructive",
};

export const MILESTONE_STATUS_TONE: Record<MilestoneStatus, StatusTone> = {
  [MilestoneStatus.notStarted]: "draft",
  [MilestoneStatus.inProgress]: "progress",
  [MilestoneStatus.done]: "success",
};

/** Converts a Motoko nanosecond timestamp into a JS Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** Formats a backend timestamp as a Thai short date, e.g. "15 ม.ค. 2567". */
export function formatThaiDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

/** Formats a backend timestamp as a Thai date-time string. */
export function formatThaiDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
  return `${formatThaiDate(timestamp)} · ${time}`;
}

/** Shortens a principal for display, e.g. "abcd1…wxyz". */
export function shortPrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 5)}…${principal.slice(-4)}`;
}
