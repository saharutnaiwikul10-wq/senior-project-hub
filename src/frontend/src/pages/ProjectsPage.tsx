import type { ProjectFilter } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
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
import { useProjects } from "@/hooks/useQueries";
import type { Project, ProjectStatus } from "@/types";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_EN,
  PROJECT_STATUS_TONE,
  shortPrincipal,
} from "@/types";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  FolderKanban,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const ALL = "__all__";

const STATUS_OPTIONS: ProjectStatus[] = [
  "draft",
  "pending",
  "inProgress",
  "submitted",
  "passed",
  "failed",
] as ProjectStatus[];

/** One project card in the registry grid. */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tone = PROJECT_STATUS_TONE[project.status];
  return (
    <Card
      className="group rounded-lg border shadow-subtle transition-smooth hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-elevated"
      data-ocid={`projects.card.${index + 1}`}
    >
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              {project.category}
            </p>
            <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-foreground">
              {project.title}
            </h3>
          </div>
          <StatusBadge
            label={PROJECT_STATUS_LABELS[project.status]}
            labelEn={PROJECT_STATUS_LABELS_EN[project.status]}
            tone={tone}
            className="shrink-0"
          />
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.abstract}
        </p>

        <div className="mt-auto space-y-3">
          <ProgressBar
            value={0}
            tone={tone}
            label={`ความคืบหน้า ${project.title}`}
          />
          <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <div className="min-w-0">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <UserRound className="size-3.5" aria-hidden="true" />
                อาจารย์ที่ปรึกษา
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {shortPrincipal(project.advisor.toText())}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                ปีการศึกษา
              </dt>
              <dd className="tabular mt-0.5 truncate font-medium text-foreground">
                {project.academicYear}
              </dd>
            </div>
          </dl>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full transition-smooth group-hover:border-accent/60 group-hover:bg-accent/10"
          >
            <Link
              to="/projects/$id"
              params={{ id: project.id.toString() }}
              data-ocid={`projects.open_button.${index + 1}`}
            >
              ดูรายละเอียด
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Project registry: searchable, filterable card grid. */
export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [academicYear, setAcademicYear] = useState<string>(ALL);

  const filter = useMemo<ProjectFilter>(() => {
    const next: ProjectFilter = {};
    if (search.trim()) next.search = search.trim();
    if (status !== ALL) next.status = status as ProjectStatus;
    if (category !== ALL) next.category = category;
    if (academicYear !== ALL) next.academicYear = academicYear;
    return next;
  }, [search, status, category, academicYear]);

  const { data: projects, isLoading, isError } = useProjects(filter);

  const { categories, academicYears } = useMemo(() => {
    const categorySet = new Set<string>();
    const yearSet = new Set<string>();
    for (const project of projects ?? []) {
      if (project.category) categorySet.add(project.category);
      if (project.academicYear) yearSet.add(project.academicYear);
    }
    return {
      categories: Array.from(categorySet).sort(),
      academicYears: Array.from(yearSet).sort().reverse(),
    };
  }, [projects]);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== ALL ||
    category !== ALL ||
    academicYear !== ALL;

  function clearFilters() {
    setSearch("");
    setStatus(ALL);
    setCategory(ALL);
    setAcademicYear(ALL);
  }

  const list = projects ?? [];

  return (
    <div className="space-y-6" data-ocid="projects.page">
      <PageHeader
        eyebrow="ทะเบียน · Registry"
        title="โครงการทั้งหมด"
        subtitle="ค้นหาและกรองโครงการตามสถานะ สาขา และปีการศึกษา"
        actions={
          <Button
            asChild
            type="button"
            className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
          >
            <Link to="/projects/new" data-ocid="projects.new_button">
              <Plus aria-hidden="true" />
              สร้างโครงการใหม่
            </Link>
          </Button>
        }
      />

      <Card className="rounded-lg border shadow-subtle">
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
            <Label htmlFor="project-search">ค้นหาโครงการ</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="project-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ชื่อเรื่อง คำสำคัญ หรือบทคัดย่อ"
                className="pl-9"
                data-ocid="projects.search_input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-status">สถานะ</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                id="project-status"
                className="w-full"
                data-ocid="projects.status_select"
              >
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PROJECT_STATUS_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-category">สาขา / ประเภท</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="project-category"
                className="w-full"
                data-ocid="projects.category_select"
              >
                <SelectValue placeholder="ทุกสาขา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกสาขา</SelectItem>
                {categories.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-year">ปีการศึกษา</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger
                id="project-year"
                className="w-full"
                data-ocid="projects.year_select"
              >
                <SelectValue placeholder="ทุกปีการศึกษา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทุกปีการศึกษา</SelectItem>
                {academicYears.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          พบ{" "}
          <span className="tabular font-semibold text-foreground">
            {list.length}
          </span>{" "}
          โครงการ
        </p>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-ocid="projects.clear_filters_button"
          >
            <X aria-hidden="true" />
            ล้างตัวกรอง
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <EmptyState
          icon={FolderKanban}
          title="ไม่สามารถโหลดข้อมูลโครงการได้"
          description="เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              data-ocid="projects.retry_button"
            >
              ลองใหม่
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={hasActiveFilters ? "ไม่พบโครงการที่ตรงกับเงื่อนไข" : "ยังไม่มีโครงการ"}
          description={
            hasActiveFilters
              ? "ลองปรับคำค้นหาหรือล้างตัวกรองเพื่อดูโครงการทั้งหมด"
              : "เริ่มต้นด้วยการสร้างโครงการจบการศึกษาโครงการแรกของคุณ"
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="projects.empty_clear_button"
              >
                ล้างตัวกรอง
              </Button>
            ) : (
              <Button asChild type="button">
                <Link to="/projects/new" data-ocid="projects.empty_new_button">
                  <Plus aria-hidden="true" />
                  สร้างโครงการใหม่
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          data-ocid="projects.list"
        >
          {list.map((project, index) => (
            <ProjectCard
              key={project.id.toString()}
              project={project}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
