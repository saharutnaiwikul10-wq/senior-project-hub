import type { CountByLabel } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallerProfile } from "@/hooks/useAuth";
import {
  useAdminStats,
  useSetUserRole,
  useUserProfiles,
} from "@/hooks/useQueries";
import {
  AppRole,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_EN,
  PROJECT_STATUS_TONE,
  ROLE_LABELS,
  ROLE_LABELS_EN,
  type StatusTone,
  formatThaiDate,
  shortPrincipal,
} from "@/types";
import type { ProjectStatus, UserProfileView } from "@/types";
import {
  AlertCircle,
  FolderKanban,
  Layers,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ROLE_ORDER: AppRole[] = [
  AppRole.student,
  AppRole.advisor,
  AppRole.committee,
  AppRole.admin,
];

const ROLE_TONE: Record<AppRole, StatusTone> = {
  [AppRole.student]: "info",
  [AppRole.advisor]: "progress",
  [AppRole.committee]: "warning",
  [AppRole.admin]: "success",
};

/** Resolves a backend status label (enum value) to its Thai display name. */
function statusLabel(name: string): string {
  const status = name as ProjectStatus;
  return PROJECT_STATUS_LABELS[status] ?? name;
}

function statusLabelEn(name: string): string | undefined {
  const status = name as ProjectStatus;
  return PROJECT_STATUS_LABELS_EN[status];
}

function statusTone(name: string): StatusTone {
  const status = name as ProjectStatus;
  return PROJECT_STATUS_TONE[status] ?? "draft";
}

/* ------------------------------------------------------------------ */
/* KPI strip                                                           */
/* ------------------------------------------------------------------ */

interface KpiProps {
  label: string;
  labelEn: string;
  value: string;
  icon: typeof FolderKanban;
  ocid: string;
}

function KpiCard({ label, labelEn, value, icon: Icon, ocid }: KpiProps) {
  return (
    <Card
      className="rounded-lg border shadow-subtle transition-smooth hover:border-primary/40 hover:shadow-elevated"
      data-ocid={ocid}
    >
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {labelEn}
          </p>
          <p className="tabular font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-accent/30">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown panel                                                     */
/* ------------------------------------------------------------------ */

interface BreakdownProps {
  title: string;
  titleEn: string;
  rows: CountByLabel[];
  total: number;
  renderLabel: (name: string) => string;
  renderSub?: (name: string) => string | undefined;
  renderTone?: (name: string) => StatusTone;
  ocid: string;
}

function BreakdownPanel({
  title,
  titleEn,
  rows,
  total,
  renderLabel,
  renderSub,
  renderTone,
  ocid,
}: BreakdownProps) {
  const max = rows.reduce((acc, row) => Math.max(acc, Number(row.count)), 0);

  return (
    <Card className="rounded-lg border shadow-subtle" data-ocid={ocid}>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-baseline justify-between gap-3">
          <span className="text-base font-semibold">{title}</span>
          <span className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
            {titleEn}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีข้อมูล
          </p>
        ) : (
          rows.map((row) => {
            const count = Number(row.count);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const width = max > 0 ? Math.round((count / max) * 100) : 0;
            const tone = renderTone ? renderTone(row.name) : "progress";
            const sub = renderSub ? renderSub(row.name) : undefined;
            return (
              <div key={row.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {renderLabel(row.name)}
                    </span>
                    {sub ? (
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {sub}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                    {count}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({percent}%)
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  tabIndex={0}
                  aria-valuenow={width}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${renderLabel(row.name)} ${count} โครงการ`}
                >
                  <div
                    className={`h-full origin-left rounded-full animate-progress-grow ${
                      tone === "draft"
                        ? "bg-draft"
                        : tone === "warning"
                          ? "bg-warning"
                          : tone === "progress"
                            ? "bg-progress"
                            : tone === "info"
                              ? "bg-info"
                              : tone === "success"
                                ? "bg-success"
                                : "bg-destructive"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* User role row                                                       */
/* ------------------------------------------------------------------ */

interface UserRowProps {
  profile: UserProfileView;
  index: number;
  isSelf: boolean;
  isPending: boolean;
  onRoleChange: (principal: string, role: AppRole) => void;
}

function UserRow({
  profile,
  index,
  isSelf,
  isPending,
  onRoleChange,
}: UserRowProps) {
  const principal = profile.principal.toString();
  const displayName = profile.displayName || "ไม่ระบุชื่อ";
  const initials = displayName.slice(0, 2);

  return (
    <TableRow data-ocid={`admin.user_row.${index + 1}`}>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-accent/30">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
              {isSelf ? (
                <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  คุณ
                </span>
              ) : null}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {shortPrincipal(principal)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {profile.department || "—"}
        </span>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="font-mono text-xs text-muted-foreground">
          {profile.email ?? "ยังไม่ยืนยันอีเมล"}
        </span>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="tabular text-xs text-muted-foreground">
          {formatThaiDate(profile.createdAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <StatusBadge
            label={ROLE_LABELS[profile.role]}
            labelEn={ROLE_LABELS_EN[profile.role]}
            tone={ROLE_TONE[profile.role]}
          />
          <Select
            value={profile.role}
            disabled={isPending}
            onValueChange={(value) => onRoleChange(principal, value as AppRole)}
          >
            <SelectTrigger
              size="sm"
              className="w-[9.5rem]"
              aria-label={`เปลี่ยนบทบาทของ ${displayName}`}
              data-ocid={`admin.role_select.${index + 1}`}
            >
              <SelectValue placeholder="เลือกบทบาท" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_ORDER.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AdminPage() {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();
  const {
    data: profiles,
    isLoading: profilesLoading,
    isError: profilesError,
    refetch: refetchProfiles,
  } = useUserProfiles();
  const { data: caller } = useCallerProfile();
  const setUserRole = useSetUserRole();
  const [roleError, setRoleError] = useState<string | null>(null);

  const callerPrincipal = caller?.principal.toString();

  const handleRoleChange = (principal: string, role: AppRole) => {
    setRoleError(null);
    setUserRole.mutate(
      { user: principal, role },
      {
        onError: () => {
          setRoleError("ไม่สามารถบันทึกบทบาทได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  const totalProjects = stats ? Number(stats.totalProjects) : 0;
  const totalUsers = stats ? Number(stats.totalUsers) : 0;
  const userCount = profiles?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ผู้ดูแลระบบ · Admin"
        title="จัดการระบบ"
        subtitle="ภาพรวมสถิติโครงการ บทบาทผู้ใช้ และการตั้งค่าทั้งหมดของระบบทะเบียน"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refetch();
              void refetchProfiles();
            }}
            data-ocid="admin.refresh_button"
          >
            <RefreshCw aria-hidden="true" />
            รีเฟรชข้อมูล
          </Button>
        }
      />

      {isError ? (
        <Alert variant="destructive" data-ocid="admin.stats.error_state">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>โหลดสถิติไม่สำเร็จ</AlertTitle>
          <AlertDescription>
            ไม่สามารถดึงข้อมูลสถิติภาพรวมได้ กรุณาลองรีเฟรชอีกครั้ง
          </AlertDescription>
        </Alert>
      ) : null}

      {/* KPI strip */}
      {isLoading ? (
        <LoadingState rows={2} />
      ) : (
        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="สถิติภาพรวม"
        >
          <KpiCard
            label="โครงการทั้งหมดในระบบ"
            labelEn="Total projects"
            value={totalProjects.toLocaleString("th-TH")}
            icon={FolderKanban}
            ocid="admin.kpi.total_projects"
          />
          <KpiCard
            label="ผู้ใช้ที่ลงทะเบียน"
            labelEn="Total users"
            value={totalUsers.toLocaleString("th-TH")}
            icon={Users}
            ocid="admin.kpi.total_users"
          />
          <KpiCard
            label="หมวดหมู่โครงการ"
            labelEn="Categories"
            value={(stats?.byCategory.length ?? 0).toLocaleString("th-TH")}
            icon={Layers}
            ocid="admin.kpi.categories"
          />
          <KpiCard
            label="สถานะที่ติดตาม"
            labelEn="Tracked statuses"
            value={(stats?.byStatus.length ?? 0).toLocaleString("th-TH")}
            icon={ShieldCheck}
            ocid="admin.kpi.statuses"
          />
        </section>
      )}

      {/* Breakdowns */}
      {isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          <BreakdownPanel
            title="โครงการตามสถานะ"
            titleEn="Projects by status"
            rows={stats?.byStatus ?? []}
            total={totalProjects}
            renderLabel={statusLabel}
            renderSub={statusLabelEn}
            renderTone={statusTone}
            ocid="admin.breakdown.status"
          />
          <BreakdownPanel
            title="โครงการตามสาขา"
            titleEn="Projects by category"
            rows={stats?.byCategory ?? []}
            total={totalProjects}
            renderLabel={(name) => name}
            ocid="admin.breakdown.category"
          />
        </section>
      )}

      {/* User management */}
      <section className="space-y-4" aria-label="จัดการบทบาทผู้ใช้">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">ผู้ใช้และบทบาท</h2>
            <p className="text-sm text-muted-foreground">
              กำหนดบทบาทการเข้าถึงของผู้ใช้แต่ละคนในระบบ
            </p>
          </div>
          <span className="tabular rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {userCount.toLocaleString("th-TH")} ผู้ใช้
          </span>
        </div>

        {roleError ? (
          <Alert variant="destructive" data-ocid="admin.role.error_state">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>บันทึกบทบาทไม่สำเร็จ</AlertTitle>
            <AlertDescription>{roleError}</AlertDescription>
          </Alert>
        ) : null}

        {profilesError ? (
          <Alert variant="destructive" data-ocid="admin.users.error_state">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>โหลดรายชื่อผู้ใช้ไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              ไม่สามารถดึงรายชื่อผู้ใช้ได้ กรุณาลองรีเฟรชอีกครั้ง
            </AlertDescription>
          </Alert>
        ) : profilesLoading ? (
          <LoadingState rows={4} />
        ) : !profiles || profiles.length === 0 ? (
          <EmptyState
            icon={Users}
            title="ยังไม่มีผู้ใช้ในระบบ"
            description="เมื่อมีผู้ใช้เข้าสู่ระบบครั้งแรก รายชื่อจะปรากฏที่นี่เพื่อกำหนดบทบาท"
          />
        ) : (
          <Card className="rounded-lg border shadow-subtle">
            <CardContent className="p-0">
              <Table data-ocid="admin.users.table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">ผู้ใช้</TableHead>
                    <TableHead className="hidden md:table-cell">
                      ภาควิชา
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">อีเมล</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      ลงทะเบียนเมื่อ
                    </TableHead>
                    <TableHead className="pr-5 text-right">บทบาท</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile, index) => (
                    <UserRow
                      key={profile.principal.toString()}
                      profile={profile}
                      index={index}
                      isSelf={profile.principal.toString() === callerPrincipal}
                      isPending={setUserRole.isPending}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
