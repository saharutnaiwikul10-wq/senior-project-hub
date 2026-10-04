import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/profiles";
import Common "../types/common";
import ProfilesLib "../lib/profiles";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Types.UserProfile>,
) {
  /// Returns the caller's own profile, or null if not yet created.
  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfileView {
    switch (profiles.get(caller)) {
      case (?p) { ?ProfilesLib.toView(p) };
      case null { null };
    };
  };

  /// Creates or updates the caller's own profile. The first caller to save a
  /// profile is registered with the authorization extension; the role defaults
  /// to #student and can later be changed by an admin.
  public shared ({ caller }) func saveCallerUserProfile(
    displayName : Text,
    department : Text,
  ) : async Types.UserProfileView {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: anonymous caller");
    };
    AccessControl.initialize(accessControlState, caller);
    let existing = profiles.get(caller);
    let profile : Types.UserProfile = switch (existing) {
      case (?p) {
        {
          principal = caller;
          displayName;
          email = p.email;
          role = p.role;
          department;
          createdAt = p.createdAt;
        };
      };
      case null {
        {
          principal = caller;
          displayName;
          email = null;
          role = #student;
          department;
          createdAt = Time.now();
        };
      };
    };
    profiles.add(caller, profile);
    ProfilesLib.toView(profile);
  };

  /// Returns another user's profile. Admins may read any profile; other
  /// callers may read only their own.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?Types.UserProfileView {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: can only read your own profile");
    };
    switch (profiles.get(user)) {
      case (?p) { ?ProfilesLib.toView(p) };
      case null { null };
    };
  };

  /// Sets the application role of a user. Admin only.
  public shared ({ caller }) func setUserRole(user : Principal, role : Common.AppRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: only admins can set roles");
    };
    let existing = profiles.get(user) ?? Runtime.trap("Profile not found");
    profiles.add(user, { existing with role });
  };

  /// Lists all user profiles. Admin only.
  public query ({ caller }) func listUserProfiles() : async [Types.UserProfileView] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: only admins can list profiles");
    };
    profiles.values().map(func p = ProfilesLib.toView(p)).toArray();
  };
};
