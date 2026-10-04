import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/evaluations";
import Profiles "../types/profiles";
import Projects "../types/projects";
import Common "../types/common";
import EvaluationsLib "../lib/evaluations";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Profiles.UserProfile>,
  projects : Map.Map<Common.ProjectId, Projects.Project>,
  evaluations : Map.Map<Common.EvaluationId, Types.Evaluation>,
  comments : Map.Map<Common.CommentId, Types.Comment>,
  counters : {
    var nextProjectId : Nat;
    var nextMilestoneId : Nat;
    var nextSubTaskId : Nat;
    var nextFileId : Nat;
    var nextEvaluationId : Nat;
    var nextCommentId : Nat;
  },
) {
  /// Returns the caller's application role, defaulting to #student.
  func callerAppRole(caller : Principal) : Common.AppRole {
    switch (profiles.get(caller)) {
      case (?p) { p.role };
      case null { #student };
    };
  };

  /// True when the caller may evaluate or comment: advisor, committee, or admin.
  func canEvaluate(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (callerAppRole(caller)) {
      case (#advisor) { true };
      case (#committee) { true };
      case (#admin) { true };
      case (#student) { false };
    };
  };

  /// Submits an evaluation for a project. Advisor, committee, or admin.
  public shared ({ caller }) func submitEvaluation(input : Types.EvaluationInput) : async Types.Evaluation {
    if (not canEvaluate(caller)) {
      Runtime.trap("Unauthorized: only advisors, committee members, or admins can evaluate");
    };
    ignore (projects.get(input.projectId) ?? Runtime.trap("Project not found"));
    let (totalScore, averageScore) = EvaluationsLib.computeScores(input.criteria);
    let id = counters.nextEvaluationId;
    counters.nextEvaluationId += 1;
    let evaluation : Types.Evaluation = {
      id;
      projectId = input.projectId;
      evaluator = caller;
      criteria = input.criteria;
      totalScore;
      averageScore;
      comment = input.comment;
      createdAt = Time.now();
    };
    evaluations.add(id, evaluation);
    evaluation;
  };

  /// Lists evaluations of a project.
  public query func listEvaluations(projectId : Common.ProjectId) : async [Types.Evaluation] {
    evaluations.values().filter(func e = e.projectId == projectId).toArray();
  };

  /// Returns the aggregate score summary for a project.
  public query func getScoreSummary(projectId : Common.ProjectId) : async Types.ScoreSummary {
    let projectEvaluations = evaluations.values().filter(func e = e.projectId == projectId).toArray();
    let count = projectEvaluations.size();
    if (count == 0) {
      return { projectId; evaluationCount = 0; averageTotal = 0; averageScore = 0 };
    };
    var totalSum : Nat = 0;
    var scoreSum : Nat = 0;
    for (e in projectEvaluations.values()) {
      totalSum += e.totalScore;
      scoreSum += e.averageScore;
    };
    {
      projectId;
      evaluationCount = count;
      averageTotal = totalSum / count;
      averageScore = scoreSum / count;
    };
  };

  /// Adds a comment to a project or milestone. Advisor, committee, or admin.
  public shared ({ caller }) func addComment(input : Types.CommentInput) : async Types.Comment {
    if (not canEvaluate(caller)) {
      Runtime.trap("Unauthorized: only advisors, committee members, or admins can comment");
    };
    let id = counters.nextCommentId;
    counters.nextCommentId += 1;
    let comment : Types.Comment = {
      id;
      target = input.target;
      author = caller;
      body = input.body;
      createdAt = Time.now();
    };
    comments.add(id, comment);
    comment;
  };

  /// Lists comments for a project.
  public query func listProjectComments(projectId : Common.ProjectId) : async [Types.Comment] {
    comments.values().filter(
      func c = switch (c.target) {
        case (#project(id)) { id == projectId };
        case (#milestone(_)) { false };
      }
    ).toArray();
  };

  /// Lists comments for a milestone.
  public query func listMilestoneComments(milestoneId : Common.MilestoneId) : async [Types.Comment] {
    comments.values().filter(
      func c = switch (c.target) {
        case (#milestone(id)) { id == milestoneId };
        case (#project(_)) { false };
      }
    ).toArray();
  };
};
