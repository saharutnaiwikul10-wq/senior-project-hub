import Types "../types/projects";

module {
  /// Returns true when a project satisfies every populated filter field.
  public func matchesFilter(project : Types.Project, filter : Types.ProjectFilter) : Bool {
    let statusOk = switch (filter.status) {
      case (?s) { project.status == s };
      case null { true };
    };
    let categoryOk = switch (filter.category) {
      case (?c) { project.category == c };
      case null { true };
    };
    let yearOk = switch (filter.academicYear) {
      case (?y) { project.academicYear == y };
      case null { true };
    };
    let searchOk = switch (filter.search) {
      case (?term) {
        let q = term.toLower();
        if (q == "") {
          true;
        } else {
          let titleMatch = project.title.toLower().contains(#text q);
          let abstractMatch = project.abstract.toLower().contains(#text q);
          let keywordMatch = project.keywords.any(func k = k.toLower().contains(#text q));
          titleMatch or abstractMatch or keywordMatch;
        };
      };
      case null { true };
    };
    statusOk and categoryOk and yearOk and searchOk;
  };
};
