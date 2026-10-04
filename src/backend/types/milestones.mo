import Common "common";

module {
  /// A sub-task under a milestone.
  public type SubTask = {
    id : Common.SubTaskId;
    milestoneId : Common.MilestoneId;
    title : Text;
    assignee : Principal;
    dueDate : Common.Timestamp;
    done : Bool;
  };

  /// A project milestone.
  public type Milestone = {
    id : Common.MilestoneId;
    projectId : Common.ProjectId;
    name : Text;
    dueDate : Common.Timestamp;
    weight : Nat; // percentage weight, 0-100
    status : Common.MilestoneStatus;
    createdAt : Common.Timestamp;
  };

  /// Input payload for creating a milestone.
  public type MilestoneInput = {
    projectId : Common.ProjectId;
    name : Text;
    dueDate : Common.Timestamp;
    weight : Nat;
  };

  /// Input payload for creating a sub-task.
  public type SubTaskInput = {
    milestoneId : Common.MilestoneId;
    title : Text;
    assignee : Principal;
    dueDate : Common.Timestamp;
  };

  /// Computed progress summary for a project.
  public type ProgressSummary = {
    projectId : Common.ProjectId;
    totalMilestones : Nat;
    doneMilestones : Nat;
    totalSubTasks : Nat;
    doneSubTasks : Nat;
    percent : Nat; // 0-100
  };
};
