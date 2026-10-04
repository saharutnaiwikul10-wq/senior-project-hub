import Common "common";
import Projects "projects";
import Milestones "milestones";
import Evaluations "evaluations";

module {
  /// A deadline entry for the timeline / upcoming view.
  public type DeadlineEntry = {
    projectId : Common.ProjectId;
    projectTitle : Text;
    milestoneId : Common.MilestoneId;
    milestoneName : Text;
    dueDate : Common.Timestamp;
    status : Common.MilestoneStatus;
    overdue : Bool;
  };

  /// Student dashboard payload.
  public type StudentDashboard = {
    projects : [Projects.Project];
    progress : [Milestones.ProgressSummary];
    upcoming : [DeadlineEntry];
    scores : [Evaluations.ScoreSummary];
  };

  /// Advisor / committee dashboard payload.
  public type AdvisorDashboard = {
    supervised : [Projects.Project];
    toEvaluate : [Projects.Project];
    evaluated : [Projects.Project];
  };

  /// Count of projects grouped by a label (status or category).
  public type CountByLabel = {
    name : Text;
    count : Nat;
  };

  /// Admin overview statistics.
  public type AdminStats = {
    totalProjects : Nat;
    byStatus : [CountByLabel];
    byCategory : [CountByLabel];
    totalUsers : Nat;
  };
};
