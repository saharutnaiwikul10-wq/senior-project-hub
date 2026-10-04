import Types "../types/milestones";

module {
  /// Computes a project's progress from its milestones and sub-tasks.
  /// Percent is the average of the milestone completion ratio and the
  /// sub-task completion ratio, each weighted equally; 0 when there is
  /// nothing to measure.
  public func computeProgress(
    projectId : Nat,
    milestones : [Types.Milestone],
    subTasks : [Types.SubTask],
  ) : Types.ProgressSummary {
    let totalMilestones = milestones.size();
    let doneMilestones = milestones.filter(func m = m.status == #done).size();
    let totalSubTasks = subTasks.size();
    let doneSubTasks = subTasks.filter(func s = s.done).size();

    let milestonePercent : Nat = if (totalMilestones == 0) {
      0;
    } else {
      (doneMilestones * 100) / totalMilestones;
    };
    let subTaskPercent : Nat = if (totalSubTasks == 0) {
      0;
    } else {
      (doneSubTasks * 100) / totalSubTasks;
    };

    let percent : Nat = if (totalMilestones == 0 and totalSubTasks == 0) {
      0;
    } else if (totalMilestones == 0) {
      subTaskPercent;
    } else if (totalSubTasks == 0) {
      milestonePercent;
    } else {
      (milestonePercent + subTaskPercent) / 2;
    };

    {
      projectId;
      totalMilestones;
      doneMilestones;
      totalSubTasks;
      doneSubTasks;
      percent;
    };
  };
};
