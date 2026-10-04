import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallerRole } from "@/hooks/useAuth";
import {
  useAddProjectFile,
  useDeleteProjectFile,
  useProject,
  useProjectFiles,
} from "@/hooks/useQueries";
import type { ProjectFile } from "@/types";
import { formatThaiDateTime, shortPrincipal } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useParams } from "@tanstack/react-router";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  Loader2,
  Presentation,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

const ALL = "__all__";

/** File categories offered when uploading, with Thai labels. */
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "เอกสาร", label: "เอกสาร (Document)" },
  { value: "สไลด์", label: "สไลด์นำเสนอ (Slides)" },
  { value: "รูปภาพ", label: "รูปภาพ (Image)" },
  { value: "ข้อมูล", label: "ชุดข้อมูล (Dataset)" },
  { value: "อื่น ๆ", label: "อื่น ๆ (Other)" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

/** Picks a category from the file's MIME type when the user has not chosen one. */
function guessCategory(file: File): string {
  if (file.type.startsWith("image/")) return "รูปภาพ";
  if (
    file.type.includes("presentation") ||
    /\.(ppt|pptx|key)$/i.test(file.name)
  ) {
    return "สไลด์";
  }
  if (
    file.type.includes("spreadsheet") ||
    file.type.includes("csv") ||
    /\.(xls|xlsx|csv)$/i.test(file.name)
  ) {
    return "ข้อมูล";
  }
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("text") ||
    /\.(pdf|doc|docx|txt|md)$/i.test(file.name)
  ) {
    return "เอกสาร";
  }
  return "อื่น ๆ";
}

/** Chooses a lucide icon for a file based on its MIME type and extension. */
function fileIcon(file: ProjectFile): LucideIcon {
  const { mimeType, name } = file;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("presentation") || /\.(ppt|pptx|key)$/i.test(name)) {
    return Presentation;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv") ||
    /\.(xls|xlsx|csv)$/i.test(name)
  ) {
    return FileSpreadsheet;
  }
  return FileText;
}

/** Human-readable file size from a byte count. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadDraft {
  file: File;
  category: string;
  version: string;
}

/** Upload panel: dropzone, category/version fields, and progress feedback. */
function UploadPanel({
  projectId,
  onUploaded,
}: {
  projectId: bigint;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addFile = useAddProjectFile();

  function selectFile(file: File) {
    setError(null);
    setProgress(0);
    setDraft({
      file,
      category: guessCategory(file),
      version: "1.0",
    });
  }

  function clearDraft() {
    setDraft(null);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!draft) return;
    setError(null);
    try {
      const bytes = new Uint8Array(await draft.file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        draft.file.type,
        draft.file.name,
      ).withUploadProgress((pct) => setProgress(pct));

      await addFile.mutateAsync({
        projectId,
        name: draft.file.name,
        mimeType: draft.file.type || "application/octet-stream",
        version: draft.version.trim() || "1.0",
        category: draft.category,
        blob,
      });
      clearDraft();
      onUploaded();
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง");
    }
  }

  const isUploading = addFile.isPending;

  return (
    <Card className="rounded-lg border shadow-subtle">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent/15 text-accent">
            <FileUp className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">
              อัปโหลดไฟล์โครงงาน
            </h2>
            <p className="text-xs text-muted-foreground">
              รองรับเอกสาร สไลด์ และรูปภาพ ขนาดไม่เกิน 100 MB ต่อไฟล์
            </p>
          </div>
        </div>

        {draft ? (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {draft.file.name}
                </p>
                <p className="tabular text-xs text-muted-foreground">
                  {formatBytes(draft.file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearDraft}
                disabled={isUploading}
                aria-label="ยกเลิกไฟล์ที่เลือก"
                data-ocid="files.upload_cancel_button"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="upload-category">หมวดหมู่</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, category: value } : current,
                    )
                  }
                  disabled={isUploading}
                >
                  <SelectTrigger
                    id="upload-category"
                    className="w-full"
                    data-ocid="files.upload_category_select"
                  >
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upload-version">เวอร์ชัน</Label>
                <Input
                  id="upload-version"
                  value={draft.version}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, version: event.target.value }
                        : current,
                    )
                  }
                  placeholder="เช่น 1.0"
                  disabled={isUploading}
                  data-ocid="files.upload_version_input"
                />
              </div>
            </div>

            {isUploading ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  กำลังอัปโหลด… {progress}%
                </p>
                <ProgressBar
                  value={progress}
                  tone="progress"
                  showLabel={false}
                  label="ความคืบหน้าการอัปโหลด"
                />
              </div>
            ) : null}

            {error ? (
              <p
                className="text-sm font-medium text-destructive"
                role="alert"
                data-ocid="files.upload_error_state"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
                data-ocid="files.upload_submit_button"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <UploadCloud aria-hidden="true" />
                )}
                {isUploading ? "กำลังอัปโหลด…" : "อัปโหลดไฟล์"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearDraft}
                disabled={isUploading}
                data-ocid="files.upload_clear_button"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) selectFile(file);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border bg-muted/20 hover:border-accent/60 hover:bg-accent/5"
            }`}
            data-ocid="files.dropzone"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary ring-1 ring-border">
              <UploadCloud className="size-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </span>
            <span className="text-xs text-muted-foreground">
              เอกสาร · สไลด์ · รูปภาพ
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
          }}
          data-ocid="files.upload_input"
        />
      </CardContent>
    </Card>
  );
}

/** One row in the project file list. */
function FileRow({
  file,
  index,
  canDelete,
  onDownload,
  onDelete,
  isDeleting,
}: {
  file: ProjectFile;
  index: number;
  canDelete: boolean;
  onDownload: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  isDeleting: boolean;
}) {
  const Icon = fileIcon(file);
  const categoryLabel = CATEGORY_LABELS[file.category] ?? file.category;

  return (
    <div
      className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
      data-ocid={`files.item.${index + 1}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {file.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-medium text-foreground">
            {categoryLabel}
          </span>
          <span className="tabular">เวอร์ชัน {file.version}</span>
          <span className="font-mono">
            โดย {shortPrincipal(file.uploadedBy.toString())}
          </span>
          <span className="tabular">{formatThaiDateTime(file.uploadedAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDownload(file)}
          data-ocid={`files.download_button.${index + 1}`}
        >
          <Download aria-hidden="true" />
          ดาวน์โหลด
        </Button>
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file)}
            disabled={isDeleting}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            data-ocid={`files.delete_button.${index + 1}`}
          >
            {isDeleting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            ลบ
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Project files page: upload, filter, download, and delete project documents. */
export function FilesPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const projectId = params.id ? BigInt(params.id) : undefined;

  const { data: project } = useProject(projectId);
  const { data: files, isLoading, isError } = useProjectFiles(projectId);
  const { data: role } = useCallerRole();
  const { identity } = useInternetIdentity();
  const deleteFile = useDeleteProjectFile();

  const [category, setCategory] = useState<string>(ALL);
  const [version, setVersion] = useState<string>(ALL);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const callerPrincipal = identity?.getPrincipal().toText();
  const isAdmin = role === "admin";

  const { categories, versions } = useMemo(() => {
    const categorySet = new Set<string>();
    const versionSet = new Set<string>();
    for (const file of files ?? []) {
      if (file.category) categorySet.add(file.category);
      if (file.version) versionSet.add(file.version);
    }
    return {
      categories: Array.from(categorySet).sort(),
      versions: Array.from(versionSet).sort(),
    };
  }, [files]);

  const filtered = useMemo(() => {
    return (files ?? []).filter((file) => {
      if (category !== ALL && file.category !== category) return false;
      if (version !== ALL && file.version !== version) return false;
      return true;
    });
  }, [files, category, version]);

  const hasActiveFilters = category !== ALL || version !== ALL;

  function clearFilters() {
    setCategory(ALL);
    setVersion(ALL);
  }

  async function handleDownload(file: ProjectFile) {
    setActionError(null);
    setDownloadingId(file.id.toString());
    try {
      const bytes = await file.blob.getBytes();
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setActionError("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(file: ProjectFile) {
    setActionError(null);
    setDeletingId(file.id.toString());
    try {
      await deleteFile.mutateAsync(file.id);
    } catch {
      setActionError("ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeletingId(null);
    }
  }

  if (projectId === undefined) {
    return (
      <div className="space-y-6" data-ocid="files.page">
        <PageHeader
          eyebrow="เอกสาร · Files"
          title="เอกสารโครงการ"
          subtitle="ไม่พบรหัสโครงการในที่อยู่ของหน้า"
        />
        <EmptyState
          icon={FileText}
          title="ไม่พบโครงการ"
          description="กรุณาเปิดหน้านี้จากรายละเอียดโครงการที่ต้องการจัดการเอกสาร"
        />
      </div>
    );
  }

  const list = filtered;

  return (
    <div className="space-y-6" data-ocid="files.page">
      <PageHeader
        eyebrow="เอกสาร · Files"
        title="เอกสารโครงการ"
        subtitle={
          project
            ? `ไฟล์ทั้งหมดของ “${project.title}” จัดหมวดหมู่ตามประเภทและเวอร์ชัน`
            : "อัปโหลดและจัดการไฟล์เอกสารของโครงการตามหมวดหมู่และเวอร์ชัน"
        }
      />

      <UploadPanel
        projectId={projectId}
        onUploaded={() => setActionError(null)}
      />

      <Card className="rounded-lg border shadow-subtle">
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="files-category-filter">หมวดหมู่</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="files-category-filter"
                className="w-full"
                data-ocid="files.category_select"
              >
                <SelectValue placeholder="ทุกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกหมวดหมู่</SelectItem>
                {categories.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CATEGORY_LABELS[option] ?? option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="files-version-filter">เวอร์ชัน</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger
                id="files-version-filter"
                className="w-full"
                data-ocid="files.version_select"
              >
                <SelectValue placeholder="ทุกเวอร์ชัน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกเวอร์ชัน</SelectItem>
                {versions.map((option) => (
                  <SelectItem key={option} value={option}>
                    เวอร์ชัน {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-ocid="files.clear_filters_button"
              >
                <X aria-hidden="true" />
                ล้างตัวกรอง
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          พบ{" "}
          <span className="tabular font-semibold text-foreground">
            {list.length}
          </span>{" "}
          ไฟล์
        </p>
      </div>

      {actionError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          role="alert"
          data-ocid="files.error_state"
        >
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : isError ? (
        <EmptyState
          icon={FileText}
          title="ไม่สามารถโหลดรายการไฟล์ได้"
          description="เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              data-ocid="files.retry_button"
            >
              ลองใหม่
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileUp}
          title={
            hasActiveFilters ? "ไม่พบไฟล์ที่ตรงกับเงื่อนไข" : "ยังไม่มีไฟล์ในโครงการนี้"
          }
          description={
            hasActiveFilters
              ? "ลองปรับหมวดหมู่หรือเวอร์ชัน หรือล้างตัวกรองเพื่อดูไฟล์ทั้งหมด"
              : "เริ่มต้นด้วยการอัปโหลดเอกสาร สไลด์ หรือรูปภาพของโครงการ"
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="files.empty_clear_button"
              >
                ล้างตัวกรอง
              </Button>
            ) : null
          }
        />
      ) : (
        <Card
          className="overflow-hidden rounded-lg border shadow-subtle"
          data-ocid="files.list"
        >
          <div className="hidden items-center gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
            <span className="w-10 shrink-0" aria-hidden="true" />
            <span className="flex-1">ชื่อไฟล์ · หมวดหมู่ · ผู้อัปโหลด</span>
            <span className="shrink-0">การจัดการ</span>
          </div>
          <div>
            {list.map((file, index) => {
              const isOwner =
                !!callerPrincipal &&
                file.uploadedBy.toString() === callerPrincipal;
              return (
                <FileRow
                  key={file.id.toString()}
                  file={file}
                  index={index}
                  canDelete={isOwner || isAdmin}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  isDeleting={deletingId === file.id.toString()}
                />
              );
            })}
          </div>
        </Card>
      )}

      {downloadingId ? (
        <p className="sr-only" aria-live="polite">
          กำลังดาวน์โหลดไฟล์
        </p>
      ) : null}
    </div>
  );
}
