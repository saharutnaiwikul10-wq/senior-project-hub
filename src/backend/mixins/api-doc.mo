/// Static Markdown documentation for the public backend API.
///
/// This mixin declares exactly one method, `getApiDoc`, and reads no actor
/// state — the document is a compile-time literal. It is included from
/// `main.mo` via `include ApiDocMixin();`.
mixin () {
  /// Returns the backend's public API documentation as Markdown.
  public query func getApiDoc() : async Text {
    "# Senior Project Management Backend — API Documentation\n\n" #
    "## Purpose\n\n" #
    "This canister backs a university senior-project (ปี 4) management application.\n" #
    "It stores user profiles, senior projects, milestones and sub-tasks, uploaded\n" #
    "project files, evaluations, and comments, and exposes dashboards for students,\n" #
    "advisors/committee members, and administrators.\n\n" #
    "All state is persisted with enhanced orthogonal persistence. Identifiers are\n" #
    "monotonic `Nat` counters assigned by the canister; timestamps are `Int`\n" #
    "nanoseconds since the Unix epoch (`Time.now()`).\n\n" #
    "## Authentication and identity\n\n" #
    "- The frontend authenticates with Internet Identity. The app pins an Internet\n" #
    "  Identity **derivation origin**, published at `/.well-known/ii-derivation-origin`\n" #
    "  when available. An agent that already holds the user's Internet Identity\n" #
    "  authorization derives the correct per-app principal against that origin, for\n" #
    "  example `icp identity link web <name> --app <host>`. Such a delegation acts\n" #
    "  with the user's full authority in this app until it expires.\n" #
    "- A caller is identified by its principal. Anonymous callers are rejected by\n" #
    "  every mutating endpoint that requires a signed-in user.\n" #
    "- **Registration prerequisite.** The authorization extension is initialized\n" #
    "  lazily: the first caller to invoke `saveCallerUserProfile` becomes the\n" #
    "  registered user and receives the platform role `#user`; the profile's\n" #
    "  application role defaults to `#student`. A caller that has never signed in\n" #
    "  through the app's own frontend is **unregistered**, even if it belongs to the\n" #
    "  app's owner, and a principal derived against a different origin is a different\n" #
    "  principal than the one the frontend registered. Unregistered callers can still\n" #
    "  read public queries, but admin-guarded endpoints trap with\n" #
    "  `Unauthorized: only admins can ...` because `isAdmin` returns false for them.\n" #
    "- Admin status is granted through the authorization extension\n" #
    "  (`assignRole`), not through any endpoint in this canister.\n\n" #
    "## Authorization model\n\n" #
    "Two layers apply:\n\n" #
    "1. **Platform roles** (`#admin` / `#user` / `#guest`) from the authorization\n" #
    "   extension. `isAdmin` gates the admin-only endpoints.\n" #
    "2. **Application roles** (`#student` / `#advisor` / `#committee` / `#admin`)\n" #
    "   stored on each profile. They gate evaluation and commenting.\n\n" #
    "Per-endpoint rules:\n\n" #
    "| Endpoint | Who may call |\n" #
    "|---|---|\n" #
    "| `getCallerUserProfile` | any caller (returns own profile or null) |\n" #
    "| `saveCallerUserProfile` | any signed-in (non-anonymous) caller |\n" #
    "| `getUserProfile` | the profile owner, or an admin |\n" #
    "| `setUserRole` | admin only |\n" #
    "| `listUserProfiles` | admin only |\n" #
    "| `createProject` | any signed-in caller (becomes owner) |\n" #
    "| `updateProject` / `deleteProject` | project owner or admin |\n" #
    "| `setProjectStatus` | project owner, project advisor, or admin |\n" #
    "| `getProject` / `listProjects` / `listMyProjects` | any caller |\n" #
    "| `createMilestone` / `updateMilestone` / `setMilestoneStatus` / `deleteMilestone` | project owner, project advisor, or admin |\n" #
    "| `createSubTask` / `setSubTaskDone` / `deleteSubTask` | project owner, project advisor, or admin |\n" #
    "| `listMilestones` / `listSubTasks` / `getProjectProgress` | any caller |\n" #
    "| `addProjectFile` | project owner, project advisor, or admin |\n" #
    "| `deleteProjectFile` | file uploader or admin |\n" #
    "| `listProjectFiles` | any caller |\n" #
    "| `submitEvaluation` / `addComment` | advisor, committee, or admin (application role) |\n" #
    "| `listEvaluations` / `getScoreSummary` / `listProjectComments` / `listMilestoneComments` | any caller |\n" #
    "| `getStudentDashboard` / `getAdvisorDashboard` / `getUpcomingDeadlines` | any caller (scoped to caller) |\n" #
    "| `getAdminStats` | admin only |\n" #
    "| `schema` / `execute` (OQL) | per-entity, see below |\n\n" #
    "## OQL data access\n\n" #
    "The canister exposes its persisted collections through the Object Query Layer.\n" #
    "`schema()` returns a JSON schema document; `execute(qJson)` runs a JSON query\n" #
    "and returns typed rows. Both are `query` calls and honour per-entity\n" #
    "authorization against the live caller:\n\n" #
    "- `profile` — scoped to the caller's own principal; the platform controller\n" #
    "  (Data Intelligence agent) reads all rows.\n" #
    "- `project` — scoped to projects the caller owns; the controller reads all rows.\n" #
    "- `milestone`, `subTask`, `file`, `evaluation`, `comment` — controller-only.\n\n" #
    "Edges: `milestone.projectId` → `project`, `subTask.milestoneId` → `milestone`,\n" #
    "`file.projectId` → `project`, `evaluation.projectId` → `project`. Dotted-path\n" #
    "traversal is available from a queryable entity to its edge target.\n\n" #
    "## Units and encodings\n\n" #
    "- **Timestamps** (`createdAt`, `updatedAt`, `dueDate`, `uploadedAt`) are `Int`\n" #
    "  nanoseconds since the Unix epoch. Divide by 1_000_000_000 for seconds.\n" #
    "- **Identifiers** (`id`, `projectId`, `milestoneId`, `subTaskId`, `fileId`,\n" #
    "  `evaluationId`, `commentId`) are `Nat`, assigned sequentially from 0.\n" #
    "- **Principals** are Internet Identity principals; in OQL rows they are encoded\n" #
    "  as text.\n" #
    "- **Weights and scores** (`weight`, `score`, `maxScore`, `totalScore`,\n" #
    "  `averageScore`) are `Nat`. `weight` is a percentage 0–100.\n" #
    "- **`email`** is `?Text`; absent emails are encoded as the empty string in OQL.\n" #
    "- **`blob`** on a file is an object-storage `ExternalBlob` (a `Blob`); the bytes\n" #
    "  live in the object-storage extension and are **not** exposed through OQL.\n" #
    "- **`status`** and **`role`** are variants; OQL encodes them as their tag text\n" #
    "  (`\"draft\"`, `\"inProgress\"`, `\"student\"`, …).\n" #
    "- **`target`** on a comment is a variant `#project(id)` / `#milestone(id)`;\n" #
    "  OQL flattens it to `targetKind` (`\"project\"` / `\"milestone\"`) and `targetId`.\n\n" #
    "## Lifecycle and polling\n\n" #
    "- A project starts in `#draft` and moves through `#pending`, `#inProgress`,\n" #
    "  `#submitted`, `#passed`, `#failed` via `setProjectStatus`.\n" #
    "- A milestone starts in `#notStarted` and moves to `#inProgress` / `#done` via\n" #
    "  `setMilestoneStatus`.\n" #
    "- A sub-task starts with `done = false` and is toggled via `setSubTaskDone`.\n" #
    "- `getProjectProgress` computes a percentage from milestone and sub-task\n" #
    "  completion; it is a pure read and safe to poll.\n" #
    "- Dashboards (`getStudentDashboard`, `getAdvisorDashboard`,\n" #
    "  `getUpcomingDeadlines`, `getAdminStats`) are pure reads and safe to poll.\n" #
    "- There is no push notification or subscription mechanism; clients poll.\n\n" #
    "## Mutation retry safety\n\n" #
    "- All mutating endpoints are **not idempotent**: each successful call creates a\n" #
    "  new record with a fresh id (`createProject`, `createMilestone`,\n" #
    "  `createSubTask`, `addProjectFile`, `submitEvaluation`, `addComment`).\n" #
    "  Retrying after an ambiguous failure can create duplicates.\n" #
    "- `updateProject`, `updateMilestone`, `setProjectStatus`, `setMilestoneStatus`,\n" #
    "  `setSubTaskDone`, `saveCallerUserProfile`, and `setUserRole` are idempotent\n" #
    "  for the same arguments.\n" #
    "- `deleteProject`, `deleteMilestone`, `deleteSubTask`, and `deleteProjectFile`\n" #
    "  are destructive. Deleting a milestone also deletes its sub-tasks. Deleting a\n" #
    "  project does **not** cascade to its milestones, sub-tasks, files,\n" #
    "  evaluations, or comments.\n" #
    "- `deleteProjectFile` removes only the metadata reference; the underlying\n" #
    "  object-storage bytes are not reclaimed by this call.\n\n" #
    "## Errors, traps, and gotchas\n\n" #
    "- Authorization failures and missing records are reported as **traps** (the\n" #
    "  message begins with `Unauthorized:` or names the missing record, e.g.\n" #
    "  `Project not found`). Traps roll back the whole message and reach the\n" #
    "  frontend as an opaque reject.\n" #
    "- `getUserProfile` traps unless the caller is the profile owner or an admin.\n" #
    "- `getAdminStats` and `listUserProfiles` trap for non-admins.\n" #
    "- `submitEvaluation` and `addComment` trap for callers whose application role\n" #
    "  is `#student` (or who have no profile).\n" #
    "- `createProject` and `saveCallerUserProfile` trap for anonymous callers.\n" #
    "- `getProjectProgress` and `getScoreSummary` return zeroed summaries when the\n" #
    "  project has no milestones or evaluations, rather than trapping.\n" #
    "- `listProjects` accepts a filter with optional `status`, `category`,\n" #
    "  `academicYear`, and `search` fields; omitted fields match everything.\n" #
    "- The OQL `execute` endpoint traps with `OQL: invalid query — ...` on malformed\n" #
    "  JSON.\n";
  };
};
