import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/dashboard";
import Profiles "../types/profiles";
import Projects "../types/projects";
import Milestones "../types/milestones";
import Evaluations "../types/evaluations";
import Common "../types/common";
import MilestonesLib "../lib/milestones";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Profiles.UserProfile>,
  projects : Map.Map<Common.ProjectId, Projects.Project>,
  milestones : Map.Map<Common.MilestoneId, Milestones.Milestone>,
  subTasks : Map.Map<Common.SubTaskId, Milestones.SubTask>,
  evaluations : Map.Map<Common.EvaluationId, Evaluations.Evaluation>,
) {
  /// Builds deadline entries for a set of projects, sorted by due date.
  func deadlinesFor(projectList : [Projects.Project]) : [Types.DeadlineEntry] {
    let now = Time.now();
    let entries = projectList.flatMap(
      func p = milestones.values().filter(
        func m = m.projectId == p.id
      ).map(
        func m = {
          projectId = p.id;
          projectTitle = p.title;
          milestoneId = m.id;
          milestoneName = m.name;
          dueDate = m.dueDate;
          status = m.status;
          overdue = m.dueDate < now and m.status != #done;
        }
      )
    );
    entries.sort(
      func(a, b) = if (a.dueDate < b.dueDate) { #less } else if (a.dueDate > b.dueDate) { #greater } else { #equal }
    );
  };

  /// Computes progress summaries for a set of projects.
  func progressFor(projectList : [Projects.Project]) : [Milestones.ProgressSummary] {
    projectList.map(
      func p {
        let projectMilestones = milestones.values().filter(func m = m.projectId == p.id).toArray();
        let milestoneIds = projectMilestones.map(func m = m.id);
        let projectSubTasks = subTasks.values().filter(
          func s = milestoneIds.contains(s.milestoneId)
        ).toArray();
        MilestonesLib.computeProgress(p.id, projectMilestones, projectSubTasks);
      }
    );
  };

  /// Computes score summaries for a set of projects.
  func scoresFor(projectList : [Projects.Project]) : [Evaluations.ScoreSummary] {
    projectList.map(
      func p {
        let projectEvaluations = evaluations.values().filter(func e = e.projectId == p.id).toArray();
        let count = projectEvaluations.size();
        if (count == 0) {
          { projectId = p.id; evaluationCount = 0; averageTotal = 0; averageScore = 0 };
        } else {
          var totalSum : Nat = 0;
          var scoreSum : Nat = 0;
          for (e in projectEvaluations.values()) {
            totalSum += e.totalScore;
            scoreSum += e.averageScore;
          };
          {
            projectId = p.id;
            evaluationCount = count;
            averageTotal = totalSum / count;
            averageScore = scoreSum / count;
          };
        };
      }
    );
  };

  /// Dashboard payload for the calling student.
  public query ({ caller }) func getStudentDashboard() : async Types.StudentDashboard {
    let mine = projects.values().filter(func p = Principal.equal(p.owner, caller)).toArray();
    {
      projects = mine;
      progress = progressFor(mine);
      upcoming = deadlinesFor(mine);
      scores = scoresFor(mine);
    };
  };

  /// Dashboard payload for the calling advisor / committee member.
  public query ({ caller }) func getAdvisorDashboard() : async Types.AdvisorDashboard {
    let supervised = projects.values().filter(func p = Principal.equal(p.advisor, caller)).toArray();
    let evaluatedIds = evaluations.values().filter(
      func e = Principal.equal(e.evaluator, caller)
    ).map(func e = e.projectId).toArray();
    let toEvaluate = supervised.filter(
      func p = not evaluatedIds.contains(p.id)
    );
    let evaluated = supervised.filter(
      func p = evaluatedIds.contains(p.id)
    );
    { supervised; toEvaluate; evaluated };
  };

  /// Overall statistics for admins.
  public query ({ caller }) func getAdminStats() : async Types.AdminStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: only admins can view statistics");
    };
    let all = projects.values().toArray();

    let statusLabels : [(Text, Common.ProjectStatus)] = [
      ("draft", #draft),
      ("pending", #pending),
      ("inProgress", #inProgress),
      ("submitted", #submitted),
      ("passed", #passed),
      ("failed", #failed),
    ];
    let byStatus = statusLabels.map(
      func((name, status)) {
        { name; count = all.filter(func p = p.status == status).size() };
      }
    );

    var categories : [Text] = [];
    for (p in all.values()) {
      if (not categories.contains(p.category)) {
        categories := categories.concat([p.category]);
      };
    };
    let byCategory = categories.map(
      func(c) = { name = c; count = all.filter(func p = p.category == c).size() }
    );

    {
      totalProjects = all.size();
      byStatus;
      byCategory;
      totalUsers = profiles.size();
    };
  };

  /// Upcoming and overdue deadlines across the projects the caller owns or supervises.
  public query ({ caller }) func getUpcomingDeadlines() : async [Types.DeadlineEntry] {
    let involved = projects.values().filter(
      func p = Principal.equal(p.owner, caller) or Principal.equal(p.advisor, caller)
    ).toArray();
    deadlinesFor(involved);
  };
};
