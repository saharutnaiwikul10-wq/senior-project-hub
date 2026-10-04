import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/milestones";
import Profiles "../types/profiles";
import Projects "../types/projects";
import Common "../types/common";
import MilestonesLib "../lib/milestones";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Profiles.UserProfile>,
  projects : Map.Map<Common.ProjectId, Projects.Project>,
  milestones : Map.Map<Common.MilestoneId, Types.Milestone>,
  subTasks : Map.Map<Common.SubTaskId, Types.SubTask>,
  counters : {
    var nextProjectId : Nat;
    var nextMilestoneId : Nat;
    var nextSubTaskId : Nat;
    var nextFileId : Nat;
    var nextEvaluationId : Nat;
    var nextCommentId : Nat;
  },
) {
  /// True when the caller owns the project, is its advisor, or is an admin.
  func canManageMilestoneProject(caller : Principal, project : Projects.Project) : Bool {
    Principal.equal(caller, project.owner)
    or Principal.equal(caller, project.advisor)
    or AccessControl.isAdmin(accessControlState, caller);
  };

  /// Creates a milestone under a project. Project owner, advisor, or admin.
  public shared ({ caller }) func createMilestone(input : Types.MilestoneInput) : async Types.Milestone {
    let project = projects.get(input.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can add milestones");
    };
    let id = counters.nextMilestoneId;
    counters.nextMilestoneId += 1;
    let milestone : Types.Milestone = {
      id;
      projectId = input.projectId;
      name = input.name;
      dueDate = input.dueDate;
      weight = input.weight;
      status = #notStarted;
      createdAt = Time.now();
    };
    milestones.add(id, milestone);
    milestone;
  };

  /// Updates a milestone's name, due date, or weight.
  public shared ({ caller }) func updateMilestone(
    milestoneId : Common.MilestoneId,
    name : Text,
    dueDate : Common.Timestamp,
    weight : Nat,
  ) : async Types.Milestone {
    let milestone = milestones.get(milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can update milestones");
    };
    let updated : Types.Milestone = { milestone with name; dueDate; weight };
    milestones.add(milestoneId, updated);
    updated;
  };

  /// Sets a milestone's progress status.
  public shared ({ caller }) func setMilestoneStatus(
    milestoneId : Common.MilestoneId,
    status : Common.MilestoneStatus,
  ) : async Types.Milestone {
    let milestone = milestones.get(milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can change milestone status");
    };
    let updated : Types.Milestone = { milestone with status };
    milestones.add(milestoneId, updated);
    updated;
  };

  /// Deletes a milestone and its sub-tasks.
  public shared ({ caller }) func deleteMilestone(milestoneId : Common.MilestoneId) : async () {
    let milestone = milestones.get(milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can delete milestones");
    };
    milestones.remove(milestoneId);
    let remaining = subTasks.values().filter(func s = s.milestoneId != milestoneId).toArray();
    subTasks.clear();
    for (s in remaining.values()) {
      subTasks.add(s.id, s);
    };
  };

  /// Lists milestones of a project.
  public query func listMilestones(projectId : Common.ProjectId) : async [Types.Milestone] {
    milestones.values().filter(func m = m.projectId == projectId).toArray();
  };

  /// Adds a sub-task under a milestone.
  public shared ({ caller }) func createSubTask(input : Types.SubTaskInput) : async Types.SubTask {
    let milestone = milestones.get(input.milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can add sub-tasks");
    };
    let id = counters.nextSubTaskId;
    counters.nextSubTaskId += 1;
    let subTask : Types.SubTask = {
      id;
      milestoneId = input.milestoneId;
      title = input.title;
      assignee = input.assignee;
      dueDate = input.dueDate;
      done = false;
    };
    subTasks.add(id, subTask);
    subTask;
  };

  /// Toggles a sub-task's done flag.
  public shared ({ caller }) func setSubTaskDone(
    subTaskId : Common.SubTaskId,
    done : Bool,
  ) : async Types.SubTask {
    let subTask = subTasks.get(subTaskId) ?? Runtime.trap("Sub-task not found");
    let milestone = milestones.get(subTask.milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can update sub-tasks");
    };
    let updated : Types.SubTask = { subTask with done };
    subTasks.add(subTaskId, updated);
    updated;
  };

  /// Deletes a sub-task.
  public shared ({ caller }) func deleteSubTask(subTaskId : Common.SubTaskId) : async () {
    let subTask = subTasks.get(subTaskId) ?? Runtime.trap("Sub-task not found");
    let milestone = milestones.get(subTask.milestoneId) ?? Runtime.trap("Milestone not found");
    let project = projects.get(milestone.projectId) ?? Runtime.trap("Project not found");
    if (not canManageMilestoneProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can delete sub-tasks");
    };
    subTasks.remove(subTaskId);
  };

  /// Lists sub-tasks of a milestone.
  public query func listSubTasks(milestoneId : Common.MilestoneId) : async [Types.SubTask] {
    subTasks.values().filter(func s = s.milestoneId == milestoneId).toArray();
  };

  /// Computes the percentage progress of a project.
  public query func getProjectProgress(projectId : Common.ProjectId) : async Types.ProgressSummary {
    let projectMilestones = milestones.values().filter(func m = m.projectId == projectId).toArray();
    let milestoneIds = projectMilestones.map(func m = m.id);
    let projectSubTasks = subTasks.values().filter(
      func s = milestoneIds.contains(s.milestoneId)
    ).toArray();
    MilestonesLib.computeProgress(projectId, projectMilestones, projectSubTasks);
  };
};
