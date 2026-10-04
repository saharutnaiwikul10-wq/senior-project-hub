import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallerProfile } from "@/hooks/useAuth";
import {
  useAdminStats,
  useAdvisorDashboard,
  useStudentDashboard,
  useUpcomingDeadlines,
} from "@/hooks/useQueries";
import type {
  AdminStats,
  AdvisorDashboard,
  DeadlineEntry,
  ProgressSummary,
  Project,
  ScoreSummary,
  StudentDashboard,
} from "@/types";
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_TONE,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_EN,
  PROJECT_STATUS_TONE,
  ROLE_LABELS,
  formatThaiDate,
} from "@/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Gauge,
  GraduationCap,
  Layers,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

type KpiTone = "primary" | "accent" | "success" | "progress";

const KPI_ICON_TONE: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent-foreground",
  success: "bg-success/15 text-success",
  progress: "bg-progress/15 text-progress",
};

interface Kpi {
  icon: LucideIcon;
  value: string;
  label: string;
  labelEn: string;
  tone?: KpiTone;
}

function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.labelEn}
            className="rounded-lg border shadow-subtle"
            data-ocid={`dashboard.kpi.${item.labelEn.toLowerCase().replace(/\s+/g, "_")}`}
          >
            <CardContent className="flex items-center gap-4 py-1">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${KPI_ICON_TONE[item.tone ?? "primary"]}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="tabular font-display text-2xl font-bold leading-none text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.labelEn}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SectionHeading({
  title,
  labelEn,
  count,
}: {
  title: string;
  labelEn: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {labelEn}
        </span>
      </div>
      {typeof count === "number" ? (
        <span className="tabular rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function ProjectCard({
  project,
  progress,
  index,
}: {
  project: Project;
  progress?: ProgressSummary;
  index: number;
}) {
  const percent = progress ? Number(progress.percent) : 0;
  const tone = PROJECT_STATUS_TONE[project.status];

  return (
    <Card
      className="group rounded-lg border shadow-subtle transition-smooth hover:border-primary/40 hover:shadow-elevated"
      data-ocid={`dashboard.project_card.${index}`}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 text-base leading-snug">
            <Link
              to="/projects/$id"
              params={{ id: project.id.toString() }}
              className="line-clamp-2 transition-colors hover:text-primary"
              data-ocid={`dashboard.project_link.${index}`}
            >
              {project.title}
            </Link>
          </CardTitle>
          <StatusBadge
            label={PROJECT_STATUS_LABELS[project.status]}
            labelEn={PROJECT_STATUS_LABELS_EN[project.status]}
            tone={tone}
            className="shrink-0"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" aria-hidden="true" />
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="size-3.5" aria-hidden="true" />
            ปีการศึกษา {project.academicYear}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar
          value={percent}
          tone={tone}
          label={`ความคืบหน้า ${project.title}`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {progress
              ? `${Number(progress.doneMilestones)}/${Number(progress.totalMilestones)} ช่วงงาน`
              : "ยังไม่มีกำหนดส่ง"}
          </span>
          <span className="tabular">
            {progress
              ? `${Number(progress.doneSubTasks)}/${Number(progress.totalSubTasks)} งานย่อย`
              : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectGrid({
  projects,
  progressById,
}: {
  projects: Project[];
  progressById?: Map<string, ProgressSummary>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id.toString()}
          project={project}
          progress={progressById?.get(project.id.toString())}
          index={index}
        />
      ))}
    </div>
  );
}

function DeadlineRail({ deadlines }: { deadlines: DeadlineEntry[] }) {
  return (
    <Card className="rounded-lg border shadow-subtle">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-accent" aria-hidden="true" />
          กำหนดส่งที่ใกล้ถึง
          <span className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
            Upcoming
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        {deadlines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ไม่มีกำหนดส่งที่ใกล้ถึงในขณะนี้
          </p>
        ) : (
          <ul
            className="divide-y divide-border"
            data-ocid="dashboard.deadline_list"
          >
            {deadlines.map((entry, index) => (
              <li
                key={entry.milestoneId.toString()}
                className="flex items-start gap-3 py-3"
                data-ocid={`dashboard.deadline_item.${index}`}
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    entry.overdue ? "bg-destructive" : "bg-warning"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.milestoneName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.projectTitle}
                  </p>
                  <p
                    className={`tabular mt-1 text-xs font-semibold ${
                      entry.overdue ? "text-destructive" : "text-warning"
                    }`}
                  >
                    {entry.overdue ? "เกินกำหนด" : "ใกล้ถึง"} ·{" "}
                    {formatThaiDate(entry.dueDate)}
                  </p>
                </div>
                <StatusBadge
                  label={MILESTONE_STATUS_LABELS[entry.status]}
                  tone={MILESTONE_STATUS_TONE[entry.status]}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardLayout({
  main,
  deadlines,
}: {
  main: ReactNode;
  deadlines: DeadlineEntry[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">{main}</div>
      <aside className="space-y-6">
        <DeadlineRail deadlines={deadlines} />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Student dashboard                                                   */
/* ------------------------------------------------------------------ */

function StudentView({
  data,
  deadlines,
}: {
  data: StudentDashboard;
  deadlines: DeadlineEntry[];
}) {
  const projects = data.projects;
  const progressById = new Map(
    data.progress.map((p) => [p.projectId.toString(), p]),
  );
  const avgProgress =
    data.progress.length > 0
      ? Math.round(
          data.progress.reduce((sum, p) => sum + Number(p.percent), 0) /
            data.progress.length,
        )
      : 0;
  const totalEvaluations = data.scores.reduce(
    (sum, s) => sum + Number(s.evaluationCount),
    0,
  );
  const avgScore =
    data.scores.length > 0
      ? (
          data.scores.reduce((sum, s) => sum + Number(s.averageScore), 0) /
          data.scores.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-8">
      <KpiStrip
        items={[
          {
            icon: FolderKanban,
            value: String(projects.length),
            label: "โครงการของฉัน",
            labelEn: "My projects",
          },
          {
            icon: Gauge,
            value: `${avgProgress}%`,
            label: "ความคืบหน้าเฉลี่ย",
            labelEn: "Avg progress",
            tone: "progress",
          },
          {
            icon: CalendarClock,
            value: String(deadlines.length),
            label: "กำหนดส่งที่ใกล้ถึง",
            labelEn: "Upcoming",
            tone: "accent",
          },
          {
            icon: Star,
            value: avgScore,
            label: `คะแนนเฉลี่ย · ${totalEvaluations} ครั้ง`,
            labelEn: "Avg score",
            tone: "success",
          },
        ]}
      />

      <DashboardLayout
        deadlines={deadlines}
        main={
          <>
            <section className="space-y-4">
              <SectionHeading
                title="โครงการของฉัน"
                labelEn="My projects"
                count={projects.length}
              />
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="ยังไม่มีโครงการ"
                  description="เริ่มต้นด้วยการสร้างข้อเสนอโครงงานจบการศึกษาของคุณ"
                  action={
                    <Button asChild type="button">
                      <Link
                        to="/projects/new"
                        data-ocid="dashboard.create_project_button"
                      >
                        สร้างโครงการใหม่
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <ProjectGrid projects={projects} progressById={progressById} />
              )}
            </section>

            {data.scores.length > 0 ? (
              <section className="space-y-4">
                <SectionHeading
                  title="คะแนนที่ได้รับ"
                  labelEn="Received scores"
                  count={data.scores.length}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  {data.scores.map((score, index) => (
                    <ScoreCard
                      key={score.projectId.toString()}
                      score={score}
                      title={
                        projects.find(
                          (p) => p.id.toString() === score.projectId.toString(),
                        )?.title ?? "โครงการ"
                      }
                      index={index}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        }
      />
    </div>
  );
}

function ScoreCard({
  score,
  title,
  index,
}: {
  score: ScoreSummary;
  title: string;
  index: number;
}) {
  return (
    <Card
      className="rounded-lg border shadow-subtle"
      data-ocid={`dashboard.score_card.${index}`}
    >
      <CardContent className="flex items-center justify-between gap-4 py-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">
            ประเมินแล้ว {Number(score.evaluationCount)} ครั้ง
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-display text-2xl font-bold leading-none text-primary">
            {Number(score.averageScore)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Avg score
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Advisor / committee dashboard                                       */
/* ------------------------------------------------------------------ */

function AdvisorView({
  data,
  deadlines,
  roleLabel,
}: {
  data: AdvisorDashboard;
  deadlines: DeadlineEntry[];
  roleLabel: string;
}) {
  const { supervised, evaluated, toEvaluate } = data;

  return (
    <div className="space-y-8">
      <KpiStrip
        items={[
          {
            icon: Users,
            value: String(supervised.length),
            label: "โครงการที่ดูแล",
            labelEn: "Supervised",
          },
          {
            icon: ClipboardList,
            value: String(toEvaluate.length),
            label: "รอการประเมิน",
            labelEn: "To evaluate",
            tone: "accent",
          },
          {
            icon: CheckCircle2,
            value: String(evaluated.length),
            label: "ประเมินแล้ว",
            labelEn: "Evaluated",
            tone: "success",
          },
          {
            icon: CalendarClock,
            value: String(deadlines.length),
            label: "กำหนดส่งที่ใกล้ถึง",
            labelEn: "Upcoming",
            tone: "progress",
          },
        ]}
      />

      <DashboardLayout
        deadlines={deadlines}
        main={
          <>
            <section className="space-y-4">
              <SectionHeading
                title="รอการประเมิน"
                labelEn="To evaluate"
                count={toEvaluate.length}
              />
              {toEvaluate.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="ไม่มีโครงการที่รอการประเมิน"
                  description={`โครงการที่คุณในฐานะ${roleLabel}ต้องประเมินจะแสดงที่นี่`}
                />
              ) : (
                <ProjectGrid projects={toEvaluate} />
              )}
            </section>

            <section className="space-y-4">
              <SectionHeading
                title="โครงการที่ดูแล"
                labelEn="Supervised"
                count={supervised.length}
              />
              {supervised.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="ยังไม่มีโครงการที่ดูแล"
                  description="โครงการที่คุณเป็นอาจารย์ที่ปรึกษาจะแสดงที่นี่"
                />
              ) : (
                <ProjectGrid projects={supervised} />
              )}
            </section>

            {evaluated.length > 0 ? (
              <section className="space-y-4">
                <SectionHeading
                  title="ประเมินแล้ว"
                  labelEn="Evaluated"
                  count={evaluated.length}
                />
                <ProjectGrid projects={evaluated} />
              </section>
            ) : null}
          </>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */

function DistributionCard({
  title,
  labelEn,
  icon: Icon,
  rows,
  barClass,
  ocidPrefix,
}: {
  title: string;
  labelEn: string;
  icon: LucideIcon;
  rows: { name: string; count: bigint }[];
  barClass: string;
  ocidPrefix: string;
}) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count)));
  return (
    <Card className="rounded-lg border shadow-subtle">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-accent" aria-hidden="true" />
          {title}
          <span className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
            {labelEn}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีข้อมูล
          </p>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.name}
              className="space-y-1.5"
              data-ocid={`${ocidPrefix}.${index}`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="tabular font-semibold text-muted-foreground">
                  {Number(row.count)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{
                    width: `${Math.round((Number(row.count) / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AdminView({
  stats,
  deadlines,
}: {
  stats: AdminStats;
  deadlines: DeadlineEntry[];
}) {
  return (
    <div className="space-y-8">
      <KpiStrip
        items={[
          {
            icon: FolderKanban,
            value: String(Number(stats.totalProjects)),
            label: "โครงการทั้งหมด",
            labelEn: "Total projects",
          },
          {
            icon: Users,
            value: String(Number(stats.totalUsers)),
            label: "ผู้ใช้ทั้งหมด",
            labelEn: "Total users",
            tone: "accent",
          },
          {
            icon: Layers,
            value: String(stats.byCategory.length),
            label: "สาขา/หมวดหมู่",
            labelEn: "Categories",
            tone: "progress",
          },
          {
            icon: CalendarClock,
            value: String(deadlines.length),
            label: "กำหนดส่งที่ใกล้ถึง",
            labelEn: "Upcoming",
            tone: "success",
          },
        ]}
      />

      <DashboardLayout
        deadlines={deadlines}
        main={
          <>
            <DistributionCard
              title="โครงการตามสถานะ"
              labelEn="By status"
              icon={TrendingUp}
              rows={stats.byStatus}
              barClass="bg-primary"
              ocidPrefix="dashboard.status_row"
            />
            <DistributionCard
              title="โครงการตามสาขา"
              labelEn="By category"
              icon={Layers}
              rows={stats.byCategory}
              barClass="bg-accent"
              ocidPrefix="dashboard.category_row"
            />
          </>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { data: profile, isLoading: isProfileLoading } = useCallerProfile();
  const role = profile?.role;
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isAdvisorLike = role === "advisor" || role === "committee";

  const studentQuery = useStudentDashboard();
  const advisorQuery = useAdvisorDashboard();
  const adminQuery = useAdminStats();
  const deadlinesQuery = useUpcomingDeadlines();

  const deadlines = deadlinesQuery.data ?? [];
  const activeQuery = isStudent
    ? studentQuery
    : isAdmin
      ? adminQuery
      : advisorQuery;

  const isLoading =
    isProfileLoading || activeQuery.isLoading || deadlinesQuery.isLoading;
  const isError = activeQuery.isError || deadlinesQuery.isError;
  const roleLabel = role ? ROLE_LABELS[role] : "ผู้ใช้";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ภาพรวม · Overview"
        title="แดชบอร์ด"
        subtitle={
          isStudent
            ? "ติดตามความคืบหน้า กำหนดส่งที่ใกล้ถึง และคะแนนที่ได้รับของโครงการคุณ"
            : isAdmin
              ? "สรุปสถิติภาพรวมของโครงการทั้งหมดในระบบ"
              : `ภาพรวมโครงการที่คุณดูแลและต้องประเมินในฐานะ${roleLabel}`
        }
        actions={
          isStudent ? (
            <Button
              asChild
              type="button"
              data-ocid="dashboard.new_project_button"
            >
              <Link to="/projects/new">
                <ClipboardList aria-hidden="true" />
                สร้างโครงการใหม่
              </Link>
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"
          description="เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ กรุณาลองใหม่อีกครั้ง"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void activeQuery.refetch();
                void deadlinesQuery.refetch();
              }}
              data-ocid="dashboard.retry_button"
            >
              ลองใหม่
            </Button>
          }
        />
      ) : isStudent && studentQuery.data ? (
        <StudentView data={studentQuery.data} deadlines={deadlines} />
      ) : isAdmin && adminQuery.data ? (
        <AdminView stats={adminQuery.data} deadlines={deadlines} />
      ) : isAdvisorLike && advisorQuery.data ? (
        <AdvisorView
          data={advisorQuery.data}
          deadlines={deadlines}
          roleLabel={roleLabel}
        />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="ยังไม่มีข้อมูลสำหรับบทบาทของคุณ"
          description="เมื่อมีโครงการที่เกี่ยวข้องกับบทบาทของคุณ ข้อมูลจะแสดงที่นี่"
        />
      )}
    </div>
  );
}
