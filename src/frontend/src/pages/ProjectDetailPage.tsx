import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallerRole } from "@/hooks/useAuth";
import { useProject, useProjectProgress } from "@/hooks/useQueries";
import type { ProgressSummary, Project } from "@/types";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_EN,
  PROJECT_STATUS_TONE,
  formatThaiDate,
  shortPrincipal,
} from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FolderKanban,
  Milestone,
  Pencil,
  Star,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionLink {
  to: string;
  label: string;
  labelEn: string;
  description: string;
  icon: LucideIcon;
}

const SECTION_LINKS: SectionLink[] = [
  {
    to: "/projects/$id/milestones",
    label: "กำหนดส่งและงานย่อย",
    labelEn: "Milestones",
    description: "ติดตามกำหนดส่ง น้ำหนักคะแนน และสถานะของแต่ละช่วงงาน",
    icon: Milestone,
  },
  {
    to: "/projects/$id/files",
    label: "เอกสารโครงการ",
    labelEn: "Files",
    description: "ไฟล์เอกสารของโครงการตามหมวดหมู่และเวอร์ชัน",
    icon: FileText,
  },
  {
    to: "/projects/$id/evaluations",
    label: "การประเมินและคะแนน",
    labelEn: "Evaluations",
    description: "ผลการประเมินตามเกณฑ์ คะแนนรวม และความเห็นของกรรมการ",
    icon: Star,
  },
];

function MetaItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={
          mono
            ? "truncate font-mono text-sm text-foreground"
            : "truncate text-sm font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ProgressPanel({
  progress,
  isLoading,
}: {
  progress: ProgressSummary | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  const percent = progress ? Number(progress.percent) : 0;
  const doneMilestones = progress ? Number(progress.doneMilestones) : 0;
  const totalMilestones = progress ? Number(progress.totalMilestones) : 0;
  const doneSubTasks = progress ? Number(progress.doneSubTasks) : 0;
  const totalSubTasks = progress ? Number(progress.totalSubTasks) : 0;

  return (
    <div className="space-y-4">
      <ProgressBar
        value={percent}
        tone={percent >= 100 ? "success" : "progress"}
        label="ความคืบหน้าโดยรวมของโครงการ"
      />
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">กำหนดส่งที่เสร็จสิ้น</dt>
          <dd className="tabular mt-0.5 font-display text-lg font-bold text-foreground">
            {doneMilestones}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {totalMilestones}
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">งานย่อยที่เสร็จสิ้น</dt>
          <dd className="tabular mt-0.5 font-display text-lg font-bold text-foreground">
            {doneSubTasks}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {totalSubTasks}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ProjectBody({ project }: { project: Project }) {
  const { data: progress, isLoading: isProgressLoading } = useProjectProgress(
    project.id,
  );
  const tone = PROJECT_STATUS_TONE[project.status];

  return (
    <div className="space-y-6" data-ocid="project_detail.page">
      <PageHeader
        eyebrow={`ทะเบียน · ${project.category}`}
        title={project.title}
        subtitle={`รหัสโครงการ #${project.id.toString()} · ปีการศึกษา ${project.academicYear}`}
        actions={
          <>
            <Button asChild variant="outline" type="button">
              <Link to="/projects" data-ocid="project_detail.back_button">
                <ArrowLeft aria-hidden="true" />
                กลับรายการโครงการ
              </Link>
            </Button>
            <Button
              asChild
              type="button"
              className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
            >
              <Link
                to="/projects/$id/edit"
                params={{ id: project.id.toString() }}
                data-ocid="project_detail.edit_button"
              >
                <Pencil aria-hidden="true" />
                แก้ไขโครงการ
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban
                  className="size-4 text-accent"
                  aria-hidden="true"
                />
                ข้อมูลโครงการ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  label={PROJECT_STATUS_LABELS[project.status]}
                  labelEn={PROJECT_STATUS_LABELS_EN[project.status]}
                  tone={tone}
                  seal
                />
                <span className="text-xs text-muted-foreground">
                  อัปเดตล่าสุด {formatThaiDate(project.updatedAt)}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  บทคัดย่อ
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {project.abstract}
                </p>
              </div>

              {project.keywords.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Tag className="size-3.5" aria-hidden="true" />
                    คำสำคัญ
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {project.keywords.map((keyword) => (
                      <li
                        key={keyword}
                        className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <MetaItem
                  icon={UserRound}
                  label="อาจารย์ที่ปรึกษา"
                  value={shortPrincipal(project.advisor.toText())}
                  mono
                />
                <MetaItem
                  icon={Users}
                  label="เจ้าของโครงการ"
                  value={shortPrincipal(project.owner.toText())}
                  mono
                />
                <MetaItem
                  icon={CalendarDays}
                  label="วันที่สร้าง"
                  value={formatThaiDate(project.createdAt)}
                />
                <MetaItem
                  icon={CalendarDays}
                  label="ปีการศึกษา"
                  value={project.academicYear}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-accent" aria-hidden="true" />
                สมาชิกในกลุ่ม
                <span className="tabular text-sm font-normal text-muted-foreground">
                  ({project.members.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิกในกลุ่ม</p>
              ) : (
                <ul className="divide-y divide-border">
                  {project.members.map((member) => (
                    <li
                      key={member.principal.toText()}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                          {member.name.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {shortPrincipal(member.principal.toText())}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">ความคืบหน้า</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressPanel
                progress={progress}
                isLoading={isProgressLoading}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">ส่วนงานที่เกี่ยวข้อง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SECTION_LINKS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.to}
                    to={section.to}
                    params={{ id: project.id.toString() }}
                    className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-smooth hover:border-accent/50 hover:bg-accent/5"
                    data-ocid={`project_detail.section_link.${section.labelEn.toLowerCase()}`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-smooth group-hover:bg-accent/15 group-hover:text-accent-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {section.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {section.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Project detail: full dossier, progress summary, and section links. */
export function ProjectDetailPage() {
  const { id } = useParams({ from: "/projects/$id" });
  const { data: project, isLoading, isError } = useProject(BigInt(id));
  const { isLoading: isRoleLoading } = useCallerRole();

  if (isLoading || isRoleLoading) {
    return (
      <div className="space-y-6" data-ocid="project_detail.loading_state">
        <div className="space-y-3 border-b border-border pb-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6" data-ocid="project_detail.page">
        <PageHeader
          eyebrow="รายละเอียด · Detail"
          title="ไม่พบโครงการ"
          subtitle="โครงการที่คุณกำลังมองหาอาจถูกลบไปแล้วหรือไม่มีอยู่"
        />
        <EmptyState
          icon={FolderKanban}
          title="ไม่พบข้อมูลโครงการ"
          description="กรุณาตรวจสอบรหัสโครงการอีกครั้ง หรือกลับไปยังรายการโครงการทั้งหมด"
          action={
            <Button asChild type="button">
              <Link
                to="/projects"
                data-ocid="project_detail.not_found_back_button"
              >
                <ArrowLeft aria-hidden="true" />
                กลับรายการโครงการ
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <ProjectBody project={project} />;
}
