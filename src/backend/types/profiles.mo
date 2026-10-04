import Common "common";

module {
  /// A user profile. `principal` is the Internet Identity principal.
  /// `email` is the verified email captured at sign-in (may be absent).
  public type UserProfile = {
    principal : Principal;
    displayName : Text;
    email : ?Text;
    role : Common.AppRole;
    department : Text;
    createdAt : Common.Timestamp;
  };

  /// Public view of a profile (same shape; kept explicit for API stability).
  public type UserProfileView = {
    principal : Principal;
    displayName : Text;
    email : ?Text;
    role : Common.AppRole;
    department : Text;
    createdAt : Common.Timestamp;
  };
};
