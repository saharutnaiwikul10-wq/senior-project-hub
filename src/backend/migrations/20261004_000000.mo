import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  // Fresh install: the chain starts from an empty actor.
  public type OldActor = {};

  // New stable shape: every stable field declared in main.mo.
  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, {
      principal : Principal;
      displayName : Text;
      email : ?Text;
      role : { #student; #advisor; #committee; #admin };
      department : Text;
      createdAt : Int;
    }>;
    projects : Map.Map<Nat, {
      id : Nat;
      title : Text;
      abstract : Text;
      keywords : [Text];
      category : Text;
      advisor : Principal;
      members : [{ principal : Principal; name : Text; role : Text }];
      academicYear : Text;
      status : {
        #draft;
        #pending;
        #inProgress;
        #submitted;
        #passed;
        #failed;
      };
      owner : Principal;
      createdAt : Int;
      updatedAt : Int;
    }>;
    milestones : Map.Map<Nat, {
      id : Nat;
      projectId : Nat;
      name : Text;
      dueDate : Int;
      weight : Nat;
      status : { #notStarted; #inProgress; #done };
      createdAt : Int;
    }>;
    subTasks : Map.Map<Nat, {
      id : Nat;
      milestoneId : Nat;
      title : Text;
      assignee : Principal;
      dueDate : Int;
      done : Bool;
    }>;
    files : Map.Map<Nat, {
      id : Nat;
      projectId : Nat;
      name : Text;
      category : Text;
      version : Text;
      mimeType : Text;
      blob : Blob;
      uploadedBy : Principal;
      uploadedAt : Int;
    }>;
    evaluations : Map.Map<Nat, {
      id : Nat;
      projectId : Nat;
      evaluator : Principal;
      criteria : [{ criterion : Text; weight : Nat; score : Nat; maxScore : Nat }];
      totalScore : Nat;
      averageScore : Nat;
      comment : Text;
      createdAt : Int;
    }>;
    comments : Map.Map<Nat, {
      id : Nat;
      target : { #project : Nat; #milestone : Nat };
      author : Principal;
      body : Text;
      createdAt : Int;
    }>;
    counters : {
      var nextProjectId : Nat;
      var nextMilestoneId : Nat;
      var nextSubTaskId : Nat;
      var nextFileId : Nat;
      var nextEvaluationId : Nat;
      var nextCommentId : Nat;
    };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      profiles = Map.empty();
      projects = Map.empty();
      milestones = Map.empty();
      subTasks = Map.empty();
      files = Map.empty();
      evaluations = Map.empty();
      comments = Map.empty();
      counters = {
        var nextProjectId = 0;
        var nextMilestoneId = 0;
        var nextSubTaskId = 0;
        var nextFileId = 0;
        var nextEvaluationId = 0;
        var nextCommentId = 0;
      };
    };
  };
};
