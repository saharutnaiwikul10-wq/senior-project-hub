import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/projects";
import Profiles "../types/profiles";
import Common "../types/common";
import ProjectsLib "../lib/projects";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Profiles.UserProfile>,
  projects : Map.Map<Common.ProjectId, Types.Project>,
  counters : {
    var nextProjectId : Nat;
    var nextMilestoneId : Nat;
    var nextSubTaskId : Nat;
    var nextFileId : Nat;
    var nextEvaluationId : Nat;
    var nextCommentId : Nat;
  },
) {
  /// True when the caller owns the project or is an admin.
  func canManageProject(caller : Principal, project : Types.Project) : Bool {
    Principal.equal(caller, project.owner) or AccessControl.isAdmin(accessControlState, caller);
  };

  /// Creates a new project owned by the caller (student).
  public shared ({ caller }) func createProject(input : Types.ProjectInput) : async Types.Project {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: anonymous caller");
    };
    let now = Time.now();
    let id = counters.nextProjectId;
    counters.nextProjectId += 1;
    let project : Types.Project = {
      id;
      title = input.title;
      abstract = input.abstract;
      keywords = input.keywords;
      category = input.category;
      advisor = input.advisor;
      members = input.members;
      academicYear = input.academicYear;
      status = #draft;
      owner = caller;
      createdAt = now;
      updatedAt = now;
    };
    projects.add(id, project);
    project;
  };

  /// Updates a project's editable details. Owner or admin only.
  public shared ({ caller }) func updateProject(
    projectId : Common.ProjectId,
    input : Types.ProjectUpdate,
  ) : async Types.Project {
    let project = projects.get(projectId) ?? Runtime.trap("Project not found");
    if (not canManageProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner or an admin can update this project");
    };
    let updated : Types.Project = {
      project with
      title = input.title;
      abstract = input.abstract;
      keywords = input.keywords;
      category = input.category;
      advisor = input.advisor;
      members = input.members;
      academicYear = input.academicYear;
      updatedAt = Time.now();
    };
    projects.add(projectId, updated);
    updated;
  };

  /// Changes a project's lifecycle status. Owner, advisor, or admin.
  public shared ({ caller }) func setProjectStatus(
    projectId : Common.ProjectId,
    status : Common.ProjectStatus,
  ) : async Types.Project {
    let project = projects.get(projectId) ?? Runtime.trap("Project not found");
    let isAdvisor = Principal.equal(caller, project.advisor);
    if (not (canManageProject(caller, project) or isAdvisor)) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can change status");
    };
    let updated : Types.Project = { project with status; updatedAt = Time.now() };
    projects.add(projectId, updated);
    updated;
  };

  /// Deletes a project. Owner or admin only.
  public shared ({ caller }) func deleteProject(projectId : Common.ProjectId) : async () {
    let project = projects.get(projectId) ?? Runtime.trap("Project not found");
    if (not canManageProject(caller, project)) {
      Runtime.trap("Unauthorized: only the owner or an admin can delete this project");
    };
    projects.remove(projectId);
  };

  /// Returns a single project by id.
  public query func getProject(projectId : Common.ProjectId) : async ?Types.Project {
    projects.get(projectId);
  };

  /// Lists projects matching an optional filter.
  public query func listProjects(filter : Types.ProjectFilter) : async [Types.Project] {
    projects.values().filter(func p = ProjectsLib.matchesFilter(p, filter)).toArray();
  };

  /// Lists projects owned by the caller.
  public query ({ caller }) func listMyProjects() : async [Types.Project] {
    projects.values().filter(func p = Principal.equal(p.owner, caller)).toArray();
  };
};
