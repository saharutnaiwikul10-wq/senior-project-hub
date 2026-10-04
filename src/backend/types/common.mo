module {
  /// Cross-cutting identifiers and shared enums used across domains.
  public type ProjectId = Nat;
  public type MilestoneId = Nat;
  public type SubTaskId = Nat;
  public type FileId = Nat;
  public type EvaluationId = Nat;
  public type CommentId = Nat;
  public type Timestamp = Int; // nanoseconds since epoch (Time.now())

  /// Application-level role layered on top of the authorization extension.
  /// The authorization extension's own UserRole (#admin/#user/#guest) governs
  /// platform access; this role governs domain behavior.
  public type AppRole = {
    #student;
    #advisor;
    #committee;
    #admin;
  };

  /// Lifecycle status of a senior project.
  public type ProjectStatus = {
    #draft;
    #pending;
    #inProgress;
    #submitted;
    #passed;
    #failed;
  };

  /// Progress status of a milestone.
  public type MilestoneStatus = {
    #notStarted;
    #inProgress;
    #done;
  };
};
