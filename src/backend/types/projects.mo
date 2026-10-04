import Common "common";

module {
  /// A member of a project group.
  public type ProjectMember = {
    principal : Principal;
    name : Text;
    role : Text; // e.g. "leader", "member"
  };

  /// A senior project.
  public type Project = {
    id : Common.ProjectId;
    title : Text;
    abstract : Text;
    keywords : [Text];
    category : Text; // field / branch of study
    advisor : Principal;
    members : [ProjectMember];
    academicYear : Text; // e.g. "2568"
    status : Common.ProjectStatus;
    owner : Principal; // student who created the project
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Input payload for creating a project.
  public type ProjectInput = {
    title : Text;
    abstract : Text;
    keywords : [Text];
    category : Text;
    advisor : Principal;
    members : [ProjectMember];
    academicYear : Text;
  };

  /// Input payload for updating a project's editable details.
  public type ProjectUpdate = {
    title : Text;
    abstract : Text;
    keywords : [Text];
    category : Text;
    advisor : Principal;
    members : [ProjectMember];
    academicYear : Text;
  };

  /// Filter used by the project list query.
  public type ProjectFilter = {
    status : ?Common.ProjectStatus;
    category : ?Text;
    academicYear : ?Text;
    search : ?Text;
  };
};
