import Types "../types/profiles";

module {
  /// Converts an internal profile record into its public view.
  public func toView(profile : Types.UserProfile) : Types.UserProfileView {
    {
      principal = profile.principal;
      displayName = profile.displayName;
      email = profile.email;
      role = profile.role;
      department = profile.department;
      createdAt = profile.createdAt;
    };
  };
};
