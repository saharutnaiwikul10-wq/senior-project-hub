import type { ProjectInput, ProjectMember } from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateProject,
  useProject,
  useSetProjectStatus,
  useUpdateProject,
} from "@/hooks/useQueries";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_EN,
  PROJECT_STATUS_TONE,
  type Project,
  ProjectStatus,
} from "@/types";
import { Principal } from "@icp-sdk/core/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
  "วิศวกรรมคอมพิวเตอร์",
  "วิศวกรรมไฟฟ้า",
  "วิศวกรรมเครื่องกล",
  "วิศวกรรมโยธา",
  "เทคโนโลยีสารสนเทศ",
  "วิทยาการคอมพิวเตอร์",
  "วิทยาศาสตร์ข้อมูล",
  "อื่น ๆ",
] as const;

const ACADEMIC_YEAR_OPTIONS = ["2567", "2568", "2569", "2570"] as const;

const MEMBER_ROLE_OPTIONS = ["สมาชิกหลัก", "สมาชิกร่วม", "ผู้ประสานงาน"] as const;

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */

interface MemberDraft {
  /** Stable local identity for React keys and row updates. */
  key: string;
  principal: string;
  name: string;
  role: string;
}

interface FormState {
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  academicYear: string;
  advisor: string;
  members: MemberDraft[];
}

type FieldErrors = Partial<
  Record<
    "title" | "abstract" | "keywords" | "category" | "academicYear" | "advisor",
    string
  >
>;

const EMPTY_FORM: FormState = {
  title: "",
  abstract: "",
  keywords: "",
  category: "",
  academicYear: "2567",
  advisor: "",
  members: [],
};

let memberKeySeed = 0;
function nextMemberKey(): string {
  memberKeySeed += 1;
  return `member-${memberKeySeed}`;
}

function emptyMember(): MemberDraft {
  return { key: nextMemberKey(), principal: "", name: "", role: "สมาชิกหลัก" };
}

/** Splits a comma/space separated keyword string into a clean array. */
function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

/** Validates a principal text and returns the parsed value or null. */
function parsePrincipal(raw: string): Principal | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return Principal.fromText(trimmed);
  } catch {
    return null;
  }
}

function formFromProject(project: Project): FormState {
  return {
    title: project.title,
    abstract: project.abstract,
    keywords: project.keywords.join(", "),
    category: project.category,
    academicYear: project.academicYear,
    advisor: project.advisor.toText(),
    members: project.members.map((member) => ({
      key: nextMemberKey(),
      principal: member.principal.toText(),
      name: member.name,
      role: member.role,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg border shadow-subtle">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">{children}</CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface ProjectFormPageProps {
  /** When provided, the page edits this project; otherwise it creates one. */
  projectId?: bigint;
}

/**
 * Full-page project create/edit form used by `/projects/new` and
 * `/projects/$id/edit`. Supports saving as a draft or submitting the proposal.
 */
export function ProjectFormPage({ projectId }: ProjectFormPageProps) {
  const params = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();

  const resolvedId = useMemo<bigint | undefined>(() => {
    if (projectId !== undefined) return projectId;
    if (params.id === undefined) return undefined;
    try {
      return BigInt(params.id);
    } catch {
      return undefined;
    }
  }, [projectId, params.id]);

  const isEdit = resolvedId !== undefined;
  const { data: project, isLoading: isLoadingProject } = useProject(resolvedId);

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const setProjectStatus = useSetProjectStatus();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [seededId, setSeededId] = useState<bigint | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // Re-seed the form whenever the loaded project (or its route id) changes.
  useEffect(() => {
    if (
      isEdit &&
      project &&
      resolvedId !== undefined &&
      seededId !== resolvedId
    ) {
      setForm(formFromProject(project));
      setSeededId(resolvedId);
    }
  }, [isEdit, project, resolvedId, seededId]);

  const isSaving = createProject.isPending || updateProject.isPending;
  const isSubmitting = setProjectStatus.isPending;
  const isBusy = isSaving || isSubmitting;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in errors) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function updateMember(key: string, patch: Partial<MemberDraft>) {
    setForm((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.key === key ? { ...member, ...patch } : member,
      ),
    }));
    setMemberErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function addMember() {
    setForm((current) => ({
      ...current,
      members: [...current.members, emptyMember()],
    }));
  }

  function removeMember(key: string) {
    setForm((current) => ({
      ...current,
      members: current.members.filter((member) => member.key !== key),
    }));
    setMemberErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    const nextMemberErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      nextErrors.title = "กรุณากรอกชื่อเรื่องโครงการ";
    } else if (form.title.trim().length < 5) {
      nextErrors.title = "ชื่อเรื่องต้องมีความยาวอย่างน้อย 5 ตัวอักษร";
    }

    if (!form.abstract.trim()) {
      nextErrors.abstract = "กรุณากรอกบทคัดย่อ";
    } else if (form.abstract.trim().length < 20) {
      nextErrors.abstract = "บทคัดย่อต้องมีความยาวอย่างน้อย 20 ตัวอักษร";
    }

    if (parseKeywords(form.keywords).length === 0) {
      nextErrors.keywords = "กรุณาระบุคำสำคัญอย่างน้อย 1 คำ";
    }

    if (!form.category) {
      nextErrors.category = "กรุณาเลือกประเภท/สาขา";
    }

    if (!form.academicYear) {
      nextErrors.academicYear = "กรุณาเลือกปีการศึกษา";
    }

    if (!form.advisor.trim()) {
      nextErrors.advisor = "กรุณาระบุอาจารย์ที่ปรึกษา";
    } else if (!parsePrincipal(form.advisor)) {
      nextErrors.advisor = "รหัส Principal ของอาจารย์ที่ปรึกษาไม่ถูกต้อง";
    }

    for (const member of form.members) {
      if (!member.name.trim()) {
        nextMemberErrors[member.key] = "กรุณากรอกชื่อสมาชิก";
      } else if (!member.principal.trim()) {
        nextMemberErrors[member.key] = "กรุณาระบุรหัส Principal ของสมาชิก";
      } else if (!parsePrincipal(member.principal)) {
        nextMemberErrors[member.key] = "รหัส Principal ของสมาชิกไม่ถูกต้อง";
      }
    }

    setErrors(nextErrors);
    setMemberErrors(nextMemberErrors);
    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextMemberErrors).length === 0
    );
  }

  function buildInput(): ProjectInput {
    const advisor = parsePrincipal(form.advisor);
    if (!advisor) throw new Error("advisor");
    const members: ProjectMember[] = form.members.map((member) => {
      const principal = parsePrincipal(member.principal);
      if (!principal) throw new Error("member");
      return {
        principal,
        name: member.name.trim(),
        role: member.role,
      };
    });
    return {
      title: form.title.trim(),
      abstract: form.abstract.trim(),
      keywords: parseKeywords(form.keywords),
      category: form.category,
      academicYear: form.academicYear,
      advisor,
      members,
    };
  }

  async function persist(): Promise<bigint> {
    const input = buildInput();
    if (isEdit && resolvedId !== undefined) {
      await updateProject.mutateAsync({ projectId: resolvedId, input });
      return resolvedId;
    }
    const created = await createProject.mutateAsync(input);
    return created.id;
  }

  async function handleSaveDraft() {
    setFeedback(null);
    if (!validate()) {
      setFeedback({
        tone: "error",
        message: "กรุณาตรวจสอบข้อมูลที่จำเป็นให้ครบถ้วนก่อนบันทึก",
      });
      return;
    }
    try {
      const id = await persist();
      if (isEdit) {
        setFeedback({ tone: "success", message: "บันทึกฉบับร่างเรียบร้อยแล้ว" });
      } else {
        await navigate({ to: "/projects/$id", params: { id: id.toString() } });
      }
    } catch {
      setFeedback({
        tone: "error",
        message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      });
    }
  }

  async function handleSubmit() {
    setFeedback(null);
    if (!validate()) {
      setFeedback({
        tone: "error",
        message: "กรุณาตรวจสอบข้อมูลที่จำเป็นให้ครบถ้วนก่อนส่งข้อเสนอ",
      });
      return;
    }
    try {
      const id = await persist();
      await setProjectStatus.mutateAsync({
        projectId: id,
        status: ProjectStatus.submitted,
      });
      await navigate({ to: "/projects/$id", params: { id: id.toString() } });
    } catch {
      setFeedback({
        tone: "error",
        message: "ส่งข้อเสนอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      });
    }
  }

  /* ---- Edit-mode loading / not-found states ---- */

  if (isEdit && isLoadingProject && seededId !== resolvedId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="แก้ไข · Edit"
          title="กำลังโหลดโครงการ…"
          subtitle="กำลังดึงข้อมูลโครงการจากระบบ"
        />
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-20"
          data-ocid="project_form.loading_state"
        >
          <Loader2
            className="size-6 animate-spin text-muted-foreground"
            aria-label="กำลังโหลด"
          />
        </div>
      </div>
    );
  }

  if (isEdit && !isLoadingProject && !project) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="แก้ไข · Edit"
          title="ไม่พบโครงการ"
          subtitle="ไม่พบโครงการที่ต้องการแก้ไข อาจถูกลบไปแล้ว"
        />
        <Card className="rounded-lg border shadow-subtle">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertCircle className="size-6" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              กรุณากลับไปที่ทะเบียนโครงการและเลือกโครงการอีกครั้ง
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate({ to: "/projects" })}
              data-ocid="project_form.back_button"
            >
              กลับทะเบียนโครงการ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = project?.status;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isEdit ? "แก้ไข · Edit" : "ทะเบียน · Registry"}
        title={isEdit ? "แก้ไขโครงการ" : "สร้างโครงการใหม่"}
        subtitle={
          isEdit
            ? "ปรับปรุงข้อมูลโครงการ แล้วบันทึกเป็นฉบับร่างหรือส่งข้อเสนอ"
            : "กรอกข้อมูลโครงการเพื่อยื่นข้อเสนอโครงงานจบการศึกษา"
        }
        actions={
          currentStatus ? (
            <StatusBadge
              label={PROJECT_STATUS_LABELS[currentStatus]}
              labelEn={PROJECT_STATUS_LABELS_EN[currentStatus]}
              tone={PROJECT_STATUS_TONE[currentStatus]}
              seal
            />
          ) : null
        }
      />

      {feedback ? (
        <output
          data-ocid={
            feedback.tone === "success"
              ? "project_form.success_state"
              : "project_form.error_state"
          }
          className={
            feedback.tone === "success"
              ? "flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              : "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          }
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          )}
          {feedback.message}
        </output>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        noValidate
      >
        <SectionCard
          title="ข้อมูลพื้นฐาน"
          description="ชื่อเรื่อง บทคัดย่อ คำสำคัญ และประเภทของโครงการ"
        >
          <div className="space-y-2">
            <Label htmlFor="project-title">
              ชื่อเรื่องโครงการ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="เช่น ระบบวิเคราะห์ข้อมูลเพื่อพยากรณ์ผลการเรียน"
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "project-title-error" : undefined
              }
              data-ocid="project_form.title_input"
            />
            <FieldError id="project-title-error" message={errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-abstract">
              บทคัดย่อ <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="project-abstract"
              value={form.abstract}
              onChange={(event) => updateField("abstract", event.target.value)}
              placeholder="สรุปวัตถุประสงค์ ขอบเขต และผลที่คาดว่าจะได้รับของโครงการ"
              rows={6}
              aria-invalid={!!errors.abstract}
              aria-describedby={
                errors.abstract ? "project-abstract-error" : undefined
              }
              data-ocid="project_form.abstract_textarea"
            />
            <FieldError id="project-abstract-error" message={errors.abstract} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-keywords">
              คำสำคัญ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-keywords"
              value={form.keywords}
              onChange={(event) => updateField("keywords", event.target.value)}
              placeholder="คั่นแต่ละคำด้วยเครื่องหมายจุลภาค เช่น ข้อมูลขนาดใหญ่, การเรียนรู้ของเครื่อง"
              aria-invalid={!!errors.keywords}
              aria-describedby={
                errors.keywords ? "project-keywords-error" : undefined
              }
              data-ocid="project_form.keywords_input"
            />
            <FieldError id="project-keywords-error" message={errors.keywords} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-category">
                ประเภท/สาขา <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger
                  id="project-category"
                  className="w-full"
                  aria-invalid={!!errors.category}
                  data-ocid="project_form.category_select"
                >
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                id="project-category-error"
                message={errors.category}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-year">
                ปีการศึกษา <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.academicYear}
                onValueChange={(value) => updateField("academicYear", value)}
              >
                <SelectTrigger
                  id="project-year"
                  className="w-full"
                  aria-invalid={!!errors.academicYear}
                  data-ocid="project_form.academic_year_select"
                >
                  <SelectValue placeholder="เลือกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      พ.ศ. {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                id="project-year-error"
                message={errors.academicYear}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="อาจารย์ที่ปรึกษา"
          description="ระบุรหัส Principal ของอาจารย์ที่ปรึกษาโครงการ"
        >
          <div className="space-y-2">
            <Label htmlFor="project-advisor">
              รหัส Principal ของอาจารย์ที่ปรึกษา{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-advisor"
              value={form.advisor}
              onChange={(event) => updateField("advisor", event.target.value)}
              placeholder="เช่น aaaaa-bbbbb-ccccc-ddddd-eee"
              className="font-mono text-sm"
              aria-invalid={!!errors.advisor}
              aria-describedby={
                errors.advisor ? "project-advisor-error" : undefined
              }
              data-ocid="project_form.advisor_input"
            />
            <FieldError id="project-advisor-error" message={errors.advisor} />
          </div>
        </SectionCard>

        <SectionCard
          title="สมาชิกในกลุ่ม"
          description="เพิ่มสมาชิกที่ร่วมทำโครงการ พร้อมบทบาทของแต่ละคน"
        >
          {form.members.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center"
              data-ocid="project_form.members_empty_state"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-muted-foreground">
                ยังไม่มีสมาชิกในกลุ่ม กดปุ่มด้านล่างเพื่อเพิ่มสมาชิก
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {form.members.map((member, index) => (
                <li
                  key={member.key}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                  data-ocid={`project_form.member_item.${index + 1}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      สมาชิกคนที่ {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.key)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`ลบสมาชิกคนที่ ${index + 1}`}
                      data-ocid={`project_form.remove_member_button.${index + 1}`}
                    >
                      <Trash2 aria-hidden="true" />
                      ลบ
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`member-name-${member.key}`}>
                        ชื่อ-นามสกุล <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`member-name-${member.key}`}
                        value={member.name}
                        onChange={(event) =>
                          updateMember(member.key, { name: event.target.value })
                        }
                        placeholder="เช่น นายสมชาย ใจดี"
                        aria-invalid={!!memberErrors[member.key]}
                        data-ocid={`project_form.member_name_input.${index + 1}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`member-role-${member.key}`}>บทบาท</Label>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateMember(member.key, { role: value })
                        }
                      >
                        <SelectTrigger
                          id={`member-role-${member.key}`}
                          className="w-full"
                          data-ocid={`project_form.member_role_select.${index + 1}`}
                        >
                          <SelectValue placeholder="เลือกบทบาท" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEMBER_ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`member-principal-${member.key}`}>
                        รหัส Principal{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`member-principal-${member.key}`}
                        value={member.principal}
                        onChange={(event) =>
                          updateMember(member.key, {
                            principal: event.target.value,
                          })
                        }
                        placeholder="เช่น aaaaa-bbbbb-ccccc-ddddd-eee"
                        className="font-mono text-sm"
                        aria-invalid={!!memberErrors[member.key]}
                        data-ocid={`project_form.member_principal_input.${index + 1}`}
                      />
                      <FieldError
                        id={`member-error-${member.key}`}
                        message={memberErrors[member.key]}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addMember}
            data-ocid="project_form.add_member_button"
          >
            <Plus aria-hidden="true" />
            เพิ่มสมาชิก
          </Button>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void navigate({ to: "/projects" })}
            disabled={isBusy}
            data-ocid="project_form.cancel_button"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSaveDraft()}
            disabled={isBusy}
            data-ocid="project_form.save_draft_button"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            บันทึกฉบับร่าง
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
            data-ocid="project_form.submit_button"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            ส่งข้อเสนอ
          </Button>
        </div>
      </form>
    </div>
  );
}
