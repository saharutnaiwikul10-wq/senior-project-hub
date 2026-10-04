import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AdminStats {
    totalProjects: bigint;
    totalUsers: bigint;
    byStatus: Array<CountByLabel>;
    byCategory: Array<CountByLabel>;
}
export interface AdvisorDashboard {
    supervised: Array<Project>;
    evaluated: Array<Project>;
    toEvaluate: Array<Project>;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Comment {
    id: CommentId;
    body: string;
    createdAt: Timestamp;
    author: Principal;
    target: CommentTarget;
}
export type CommentId = bigint;
export interface CommentInput {
    body: string;
    target: CommentTarget;
}
export type CommentTarget = {
    __kind__: "milestone";
    milestone: MilestoneId;
} | {
    __kind__: "project";
    project: ProjectId;
};
export interface CountByLabel {
    name: string;
    count: bigint;
}
export interface CriterionScore {
    weight: bigint;
    maxScore: bigint;
    score: bigint;
    criterion: string;
}
export interface DeadlineEntry {
    status: MilestoneStatus;
    dueDate: Timestamp;
    projectTitle: string;
    milestoneId: MilestoneId;
    projectId: ProjectId;
    overdue: boolean;
    milestoneName: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Evaluation {
    id: EvaluationId;
    evaluator: Principal;
    createdAt: Timestamp;
    totalScore: bigint;
    comment: string;
    projectId: ProjectId;
    criteria: Array<CriterionScore>;
    averageScore: bigint;
}
export type EvaluationId = bigint;
export interface EvaluationInput {
    comment: string;
    projectId: ProjectId;
    criteria: Array<CriterionScore>;
}
export type FileId = bigint;
export interface FileInput {
    blob: ExternalBlob;
    name: string;
    mimeType: string;
    version: string;
    projectId: ProjectId;
    category: string;
}
export interface Milestone {
    id: MilestoneId;
    weight: bigint;
    status: MilestoneStatus;
    name: string;
    createdAt: Timestamp;
    dueDate: Timestamp;
    projectId: ProjectId;
}
export type MilestoneId = bigint;
export interface MilestoneInput {
    weight: bigint;
    name: string;
    dueDate: Timestamp;
    projectId: ProjectId;
}
export interface ProgressSummary {
    doneMilestones: bigint;
    percent: bigint;
    projectId: ProjectId;
    totalSubTasks: bigint;
    totalMilestones: bigint;
    doneSubTasks: bigint;
}
export interface Project {
    id: ProjectId;
    status: ProjectStatus;
    title: string;
    members: Array<ProjectMember>;
    owner: Principal;
    createdAt: Timestamp;
    academicYear: string;
    keywords: Array<string>;
    updatedAt: Timestamp;
    abstract: string;
    category: string;
    advisor: Principal;
}
export interface ProjectFile {
    id: FileId;
    blob: ExternalBlob;
    name: string;
    mimeType: string;
    version: string;
    projectId: ProjectId;
    category: string;
    uploadedAt: Timestamp;
    uploadedBy: Principal;
}
export interface ProjectFilter {
    status?: ProjectStatus;
    search?: string;
    academicYear?: string;
    category?: string;
}
export type ProjectId = bigint;
export interface ProjectInput {
    title: string;
    members: Array<ProjectMember>;
    academicYear: string;
    keywords: Array<string>;
    abstract: string;
    category: string;
    advisor: Principal;
}
export interface ProjectMember {
    principal: Principal;
    name: string;
    role: string;
}
export interface ProjectUpdate {
    title: string;
    members: Array<ProjectMember>;
    academicYear: string;
    keywords: Array<string>;
    abstract: string;
    category: string;
    advisor: Principal;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ScoreSummary {
    evaluationCount: bigint;
    averageTotal: bigint;
    projectId: ProjectId;
    averageScore: bigint;
}
export interface StudentDashboard {
    upcoming: Array<DeadlineEntry>;
    projects: Array<Project>;
    scores: Array<ScoreSummary>;
    progress: Array<ProgressSummary>;
}
export interface SubTask {
    id: SubTaskId;
    assignee: Principal;
    title: string;
    done: boolean;
    dueDate: Timestamp;
    milestoneId: MilestoneId;
}
export type SubTaskId = bigint;
export interface SubTaskInput {
    assignee: Principal;
    title: string;
    dueDate: Timestamp;
    milestoneId: MilestoneId;
}
export type Timestamp = bigint;
export interface UserProfileView {
    principal: Principal;
    displayName: string;
    createdAt: Timestamp;
    role: AppRole;
    email?: string;
    department: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AppRole {
    admin = "admin",
    committee = "committee",
    student = "student",
    advisor = "advisor"
}
export enum MilestoneStatus {
    notStarted = "notStarted",
    done = "done",
    inProgress = "inProgress"
}
export enum ProjectStatus {
    submitted = "submitted",
    pending = "pending",
    draft = "draft",
    inProgress = "inProgress",
    failed = "failed",
    passed = "passed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Adds a comment to a project or milestone. Advisor, committee, or admin.
     */
    addComment(input: CommentInput): Promise<Comment>;
    /**
     * / Registers an uploaded file's metadata against a project. The caller must
     * / own the project, be its advisor, or be an admin.
     */
    addProjectFile(input: FileInput): Promise<ProjectFile>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Creates a milestone under a project. Project owner, advisor, or admin.
     */
    createMilestone(input: MilestoneInput): Promise<Milestone>;
    /**
     * / Creates a new project owned by the caller (student).
     */
    createProject(input: ProjectInput): Promise<Project>;
    /**
     * / Adds a sub-task under a milestone.
     */
    createSubTask(input: SubTaskInput): Promise<SubTask>;
    /**
     * / Deletes a milestone and its sub-tasks.
     */
    deleteMilestone(milestoneId: MilestoneId): Promise<void>;
    /**
     * / Deletes a project. Owner or admin only.
     */
    deleteProject(projectId: ProjectId): Promise<void>;
    /**
     * / Deletes a file the caller uploaded. Uploader or admin only.
     */
    deleteProjectFile(fileId: FileId): Promise<void>;
    /**
     * / Deletes a sub-task.
     */
    deleteSubTask(subTaskId: SubTaskId): Promise<void>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Overall statistics for admins.
     */
    getAdminStats(): Promise<AdminStats>;
    /**
     * / Dashboard payload for the calling advisor / committee member.
     */
    getAdvisorDashboard(): Promise<AdvisorDashboard>;
    /**
     * / Returns the backend's public API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Returns the caller's own profile, or null if not yet created.
     */
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Returns a single project by id.
     */
    getProject(projectId: ProjectId): Promise<Project | null>;
    /**
     * / Computes the percentage progress of a project.
     */
    getProjectProgress(projectId: ProjectId): Promise<ProgressSummary>;
    /**
     * / Returns the aggregate score summary for a project.
     */
    getScoreSummary(projectId: ProjectId): Promise<ScoreSummary>;
    /**
     * / Dashboard payload for the calling student.
     */
    getStudentDashboard(): Promise<StudentDashboard>;
    /**
     * / Upcoming and overdue deadlines across the projects the caller owns or supervises.
     */
    getUpcomingDeadlines(): Promise<Array<DeadlineEntry>>;
    /**
     * / Returns another user's profile. Admins may read any profile; other
     * / callers may read only their own.
     */
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Lists evaluations of a project.
     */
    listEvaluations(projectId: ProjectId): Promise<Array<Evaluation>>;
    /**
     * / Lists comments for a milestone.
     */
    listMilestoneComments(milestoneId: MilestoneId): Promise<Array<Comment>>;
    /**
     * / Lists milestones of a project.
     */
    listMilestones(projectId: ProjectId): Promise<Array<Milestone>>;
    /**
     * / Lists projects owned by the caller.
     */
    listMyProjects(): Promise<Array<Project>>;
    /**
     * / Lists comments for a project.
     */
    listProjectComments(projectId: ProjectId): Promise<Array<Comment>>;
    /**
     * / Lists all files of a project.
     */
    listProjectFiles(projectId: ProjectId): Promise<Array<ProjectFile>>;
    /**
     * / Lists projects matching an optional filter.
     */
    listProjects(filter: ProjectFilter): Promise<Array<Project>>;
    /**
     * / Lists sub-tasks of a milestone.
     */
    listSubTasks(milestoneId: MilestoneId): Promise<Array<SubTask>>;
    /**
     * / Lists all user profiles. Admin only.
     */
    listUserProfiles(): Promise<Array<UserProfileView>>;
    /**
     * / Creates or updates the caller's own profile. The first caller to save a
     * / profile is registered with the authorization extension; the role defaults
     * / to #student and can later be changed by an admin.
     */
    saveCallerUserProfile(displayName: string, department: string): Promise<UserProfileView>;
    schema(): Promise<string>;
    /**
     * / Sets a milestone's progress status.
     */
    setMilestoneStatus(milestoneId: MilestoneId, status: MilestoneStatus): Promise<Milestone>;
    /**
     * / Changes a project's lifecycle status. Owner, advisor, or admin.
     */
    setProjectStatus(projectId: ProjectId, status: ProjectStatus): Promise<Project>;
    /**
     * / Toggles a sub-task's done flag.
     */
    setSubTaskDone(subTaskId: SubTaskId, done: boolean): Promise<SubTask>;
    /**
     * / Sets the application role of a user. Admin only.
     */
    setUserRole(user: Principal, role: AppRole): Promise<void>;
    /**
     * / Submits an evaluation for a project. Advisor, committee, or admin.
     */
    submitEvaluation(input: EvaluationInput): Promise<Evaluation>;
    /**
     * / Updates a milestone's name, due date, or weight.
     */
    updateMilestone(milestoneId: MilestoneId, name: string, dueDate: Timestamp, weight: bigint): Promise<Milestone>;
    /**
     * / Updates a project's editable details. Owner or admin only.
     */
    updateProject(projectId: ProjectId, input: ProjectUpdate): Promise<Project>;
}
