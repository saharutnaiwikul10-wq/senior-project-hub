import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

import Common "types/common";
import Profiles "types/profiles";
import Projects "types/projects";
import Milestones "types/milestones";
import Files "types/files";
import Evaluations "types/evaluations";

import ProfilesApi "mixins/profiles-api";
import ProjectsApi "mixins/projects-api";
import MilestonesApi "mixins/milestones-api";
import FilesApi "mixins/files-api";
import EvaluationsApi "mixins/evaluations-api";
import DashboardApi "mixins/dashboard-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // --- Authorization (platform) ---
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // --- Object storage (platform) ---
  include MixinObjectStorage();

  // --- Domain state ---
  let profiles : Map.Map<Principal, Profiles.UserProfile>;
  let projects : Map.Map<Common.ProjectId, Projects.Project>;
  let milestones : Map.Map<Common.MilestoneId, Milestones.Milestone>;
  let subTasks : Map.Map<Common.SubTaskId, Milestones.SubTask>;
  let files : Map.Map<Common.FileId, Files.ProjectFile>;
  let evaluations : Map.Map<Common.EvaluationId, Evaluations.Evaluation>;
  let comments : Map.Map<Common.CommentId, Evaluations.Comment>;
  let counters : {
    var nextProjectId : Nat;
    var nextMilestoneId : Nat;
    var nextSubTaskId : Nat;
    var nextFileId : Nat;
    var nextEvaluationId : Nat;
    var nextCommentId : Nat;
  };

  // --- Domain APIs ---
  include ProfilesApi(accessControlState, profiles);
  include ProjectsApi(accessControlState, profiles, projects, counters);
  include MilestonesApi(accessControlState, profiles, projects, milestones, subTasks, counters);
  include FilesApi(accessControlState, profiles, projects, files, counters);
  include EvaluationsApi(accessControlState, profiles, projects, evaluations, comments, counters);
  include DashboardApi(accessControlState, profiles, projects, milestones, subTasks, evaluations);

  // --- API documentation ---
  include ApiDocMixin();

  // --- OQL exposure ---
  // Every persisted collection is exposed as a queryable entity. Per-table
  // authorization: profiles and projects are scoped to their owner (the agent
  // reads all as controller); the remaining tables are controller-only.
  include Expose({
    entities = [
      // User profiles — each signed-in user reads only their own row; the
      // platform controller (Data Intelligence agent) reads every row.
      OQL.Entity.manual<Profiles.UserProfile>(
        "profile",
        func () = profiles.values(),
        "UserProfile",
        "principal",
      )
        .sample({
          principal = Principal.fromText("aaaaa-aa");
          displayName = "";
          email = null;
          role = #student;
          department = "";
          createdAt = 0;
        })
        .payload("principal", func p = p.principal)
        .payload("displayName", func p = p.displayName)
        .payload("email", func p = p.email ?? "")
        .payload("role", func p = switch (p.role) {
          case (#student) { "student" };
          case (#advisor) { "advisor" };
          case (#committee) { "committee" };
          case (#admin) { "admin" };
        })
        .payload("department", func p = p.department)
        .payload("createdAt", func p = p.createdAt)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),

      // Senior projects — each signed-in user reads only projects they own;
      // the controller reads all.
      OQL.Entity.manual<Projects.Project>(
        "project",
        func () = projects.values(),
        "Project",
        "id",
      )
        .sample({
          id = 0;
          title = "";
          abstract = "";
          keywords = [];
          category = "";
          advisor = Principal.fromText("aaaaa-aa");
          members = [];
          academicYear = "";
          status = #draft;
          owner = Principal.fromText("aaaaa-aa");
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("id", func p = p.id)
        .payload("title", func p = p.title)
        .payload("abstract", func p = p.abstract)
        .payload("keywords", func p = p.keywords.values().join(", "))
        .payload("category", func p = p.category)
        .payload("advisor", func p = p.advisor)
        .payload("memberCount", func p = p.members.size())
        .payload("academicYear", func p = p.academicYear)
        .payload("status", func p = switch (p.status) {
          case (#draft) { "draft" };
          case (#pending) { "pending" };
          case (#inProgress) { "inProgress" };
          case (#submitted) { "submitted" };
          case (#passed) { "passed" };
          case (#failed) { "failed" };
        })
        .payload("owner", func p = p.owner)
        .payload("createdAt", func p = p.createdAt)
        .payload("updatedAt", func p = p.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),

      // Milestones — controller-only; the agent answers aggregate questions.
      OQL.Entity.manual<Milestones.Milestone>(
        "milestone",
        func () = milestones.values(),
        "Milestone",
        "id",
      )
        .sample({
          id = 0;
          projectId = 0;
          name = "";
          dueDate = 0;
          weight = 0;
          status = #notStarted;
          createdAt = 0;
        })
        .payload("id", func m = m.id)
        .payload("projectId", func m = m.projectId)
        .edge("projectId", "project")
        .payload("name", func m = m.name)
        .payload("dueDate", func m = m.dueDate)
        .payload("weight", func m = m.weight)
        .payload("status", func m = switch (m.status) {
          case (#notStarted) { "notStarted" };
          case (#inProgress) { "inProgress" };
          case (#done) { "done" };
        })
        .payload("createdAt", func m = m.createdAt)
        .controllerOnly()
        .build(),

      // Sub-tasks — all-primitive record, auto-derived. Controller-only.
      subTasks.toEntity("subTask", "SubTask", "id")
        .sample({
          id = 0;
          milestoneId = 0;
          title = "";
          assignee = Principal.fromText("aaaaa-aa");
          dueDate = 0;
          done = false;
        })
        .edge("milestoneId", "milestone")
        .controllerOnly()
        .build(),

      // Project files — metadata only; the blob bytes are omitted. Controller-only.
      OQL.Entity.manual<Files.ProjectFile>(
        "file",
        func () = files.values(),
        "ProjectFile",
        "id",
      )
        .sample({
          id = 0;
          projectId = 0;
          name = "";
          category = "";
          version = "";
          mimeType = "";
          blob = "" : Blob;
          uploadedBy = Principal.fromText("aaaaa-aa");
          uploadedAt = 0;
        })
        .payload("id", func f = f.id)
        .payload("projectId", func f = f.projectId)
        .edge("projectId", "project")
        .payload("name", func f = f.name)
        .payload("category", func f = f.category)
        .payload("version", func f = f.version)
        .payload("mimeType", func f = f.mimeType)
        .payload("uploadedBy", func f = f.uploadedBy)
        .payload("uploadedAt", func f = f.uploadedAt)
        .controllerOnly()
        .build(),

      // Evaluations — criteria collapsed to a count. Controller-only.
      OQL.Entity.manual<Evaluations.Evaluation>(
        "evaluation",
        func () = evaluations.values(),
        "Evaluation",
        "id",
      )
        .sample({
          id = 0;
          projectId = 0;
          evaluator = Principal.fromText("aaaaa-aa");
          criteria = [];
          totalScore = 0;
          averageScore = 0;
          comment = "";
          createdAt = 0;
        })
        .payload("id", func e = e.id)
        .payload("projectId", func e = e.projectId)
        .edge("projectId", "project")
        .payload("evaluator", func e = e.evaluator)
        .payload("criterionCount", func e = e.criteria.size())
        .payload("totalScore", func e = e.totalScore)
        .payload("averageScore", func e = e.averageScore)
        .payload("comment", func e = e.comment)
        .payload("createdAt", func e = e.createdAt)
        .controllerOnly()
        .build(),

      // Comments — target variant flattened to kind + id. Controller-only.
      OQL.Entity.manual<Evaluations.Comment>(
        "comment",
        func () = comments.values(),
        "Comment",
        "id",
      )
        .sample({
          id = 0;
          target = #project(0);
          author = Principal.fromText("aaaaa-aa");
          body = "";
          createdAt = 0;
        })
        .payload("id", func c = c.id)
        .payload("targetKind", func c = switch (c.target) {
          case (#project(_)) { "project" };
          case (#milestone(_)) { "milestone" };
        })
        .payload("targetId", func c = switch (c.target) {
          case (#project(id)) { id };
          case (#milestone(id)) { id };
        })
        .payload("author", func c = c.author)
        .payload("body", func c = c.body)
        .payload("createdAt", func c = c.createdAt)
        .controllerOnly()
        .build(),
    ];
  });
};
