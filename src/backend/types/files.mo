import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// Metadata for an uploaded project file. The bytes live in the
  /// object-storage extension; the backend stores only this reference.
  public type ProjectFile = {
    id : Common.FileId;
    projectId : Common.ProjectId;
    name : Text;
    category : Text; // e.g. "document", "slide", "image"
    version : Text; // e.g. "v1", "v2"
    mimeType : Text;
    blob : Storage.ExternalBlob;
    uploadedBy : Principal;
    uploadedAt : Common.Timestamp;
  };

  /// Input payload for registering an uploaded file.
  public type FileInput = {
    projectId : Common.ProjectId;
    name : Text;
    category : Text;
    version : Text;
    mimeType : Text;
    blob : Storage.ExternalBlob;
  };
};
