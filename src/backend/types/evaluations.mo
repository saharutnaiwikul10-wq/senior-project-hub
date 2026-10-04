import Common "common";

module {
  /// A single criterion score within an evaluation.
  public type CriterionScore = {
    criterion : Text; // e.g. "creativity", "methodology", "presentation"
    weight : Nat; // percentage weight, 0-100
    score : Nat; // raw score awarded
    maxScore : Nat; // maximum possible raw score
  };

  /// An evaluation of a project by an advisor or committee member.
  public type Evaluation = {
    id : Common.EvaluationId;
    projectId : Common.ProjectId;
    evaluator : Principal;
    criteria : [CriterionScore];
    totalScore : Nat; // weighted total
    averageScore : Nat; // average across criteria
    comment : Text;
    createdAt : Common.Timestamp;
  };

  /// Input payload for submitting an evaluation.
  public type EvaluationInput = {
    projectId : Common.ProjectId;
    criteria : [CriterionScore];
    comment : Text;
  };

  /// A comment attached to a project or to a milestone.
  public type CommentTarget = {
    #project : Common.ProjectId;
    #milestone : Common.MilestoneId;
  };

  /// A comment / feedback entry.
  public type Comment = {
    id : Common.CommentId;
    target : CommentTarget;
    author : Principal;
    body : Text;
    createdAt : Common.Timestamp;
  };

  /// Input payload for adding a comment.
  public type CommentInput = {
    target : CommentTarget;
    body : Text;
  };

  /// Aggregate score summary for a project.
  public type ScoreSummary = {
    projectId : Common.ProjectId;
    evaluationCount : Nat;
    averageTotal : Nat;
    averageScore : Nat;
  };
};
