import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/files";
import Profiles "../types/profiles";
import Projects "../types/projects";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Profiles.UserProfile>,
  projects : Map.Map<Common.ProjectId, Projects.Project>,
  files : Map.Map<Common.FileId, Types.ProjectFile>,
  counters : {
    var nextProjectId : Nat;
    var nextMilestoneId : Nat;
    var nextSubTaskId : Nat;
    var nextFileId : Nat;
    var nextEvaluationId : Nat;
    var nextCommentId : Nat;
  },
) {
  /// Registers an uploaded file's metadata against a project. The caller must
  /// own the project, be its advisor, or be an admin.
  public shared ({ caller }) func addProjectFile(input : Types.FileInput) : async Types.ProjectFile {
    let project = projects.get(input.projectId) ?? Runtime.trap("Project not found");
    let allowed = Principal.equal(caller, project.owner)
      or Principal.equal(caller, project.advisor)
      or AccessControl.isAdmin(accessControlState, caller);
    if (not allowed) {
      Runtime.trap("Unauthorized: only the owner, advisor, or an admin can add files");
    };
    let id = counters.nextFileId;
    counters.nextFileId += 1;
    let file : Types.ProjectFile = {
      id;
      projectId = input.projectId;
      name = input.name;
      category = input.category;
      version = input.version;
      mimeType = input.mimeType;
      blob = input.blob;
      uploadedBy = caller;
      uploadedAt = Time.now();
    };
    files.add(id, file);
    file;
  };

  /// Lists all files of a project.
  public query func listProjectFiles(projectId : Common.ProjectId) : async [Types.ProjectFile] {
    files.values().filter(func f = f.projectId == projectId).toArray();
  };

  /// Deletes a file the caller uploaded. Uploader or admin only.
  public shared ({ caller }) func deleteProjectFile(fileId : Common.FileId) : async () {
    let file = files.get(fileId) ?? Runtime.trap("File not found");
    if (not (Principal.equal(caller, file.uploadedBy) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: only the uploader or an admin can delete this file");
    };
    files.remove(fileId);
  };
};
