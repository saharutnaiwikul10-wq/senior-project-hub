import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { useCallerProfile } from "@/hooks/useAuth";
import { useSaveCallerProfile } from "@/hooks/useQueries";
import {
  ROLE_LABELS,
  ROLE_LABELS_EN,
  type StatusTone,
  formatThaiDate,
  shortPrincipal,
} from "@/types";
import { AppRole } from "@/types";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

const ROLE_TONE: Record<AppRole, StatusTone> = {
  [AppRole.student]: "info",
  [AppRole.advisor]: "progress",
  [AppRole.committee]: "warning",
  [AppRole.admin]: "success",
};

export function SettingsPage() {
  const { data: profile, isLoading, isError, refetch } = useCallerProfile();
  const saveProfile = useSaveCallerProfile();

  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  // One-time initialization of the draft from the loaded profile. The draft is
  // never overwritten by later refetches, so in-progress edits are preserved.
  useEffect(() => {
    if (profile && !initialized) {
      setDisplayName(profile.displayName ?? "");
      setDepartment(profile.department ?? "");
      setInitialized(true);
    }
  }, [profile, initialized]);

  const trimmedName = displayName.trim();
  const trimmedDepartment = department.trim();
  const isDirty =
    !!profile &&
    (trimmedName !== (profile.displayName ?? "") ||
      trimmedDepartment !== (profile.department ?? ""));
  const canSubmit = trimmedName.length > 0 && isDirty && !saveProfile.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaved(false);
    saveProfile.mutate(
      { displayName: trimmedName, department: trimmedDepartment },
      {
        onSuccess: () => {
          setSaved(true);
        },
      },
    );
  };

  const role = profile?.role;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="บัญชี · Account"
        title="ตั้งค่าโปรไฟล์"
        subtitle="จัดการชื่อที่แสดง ภาควิชา และตรวจสอบข้อมูลบัญชีของคุณ"
      />

      {isError ? (
        <Alert variant="destructive" data-ocid="settings.error_state">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>โหลดโปรไฟล์ไม่สำเร็จ</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>ไม่สามารถดึงข้อมูลโปรไฟล์ของคุณได้</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              data-ocid="settings.retry_button"
            >
              ลองอีกครั้ง
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Editable profile form */}
          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                ข้อมูลที่แก้ไขได้
              </CardTitle>
              <CardDescription>
                ชื่อที่แสดงและภาควิชาจะปรากฏต่อผู้ใช้อื่นในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">ชื่อที่แสดง</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      setSaved(false);
                    }}
                    placeholder="เช่น สมชาย ใจดี"
                    autoComplete="name"
                    maxLength={80}
                    data-ocid="settings.display_name_input"
                  />
                  <p className="text-xs text-muted-foreground">
                    ใช้ชื่อ-นามสกุลจริงเพื่อให้อาจารย์และกรรมการระบุตัวตนได้
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">ภาควิชา / สาขา</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(event) => {
                      setDepartment(event.target.value);
                      setSaved(false);
                    }}
                    placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                    maxLength={120}
                    data-ocid="settings.department_input"
                  />
                  <p className="text-xs text-muted-foreground">
                    ระบุภาควิชาหรือสาขาที่สังกัดเพื่อการจัดกลุ่มโครงการ
                  </p>
                </div>

                {saveProfile.isError ? (
                  <Alert
                    variant="destructive"
                    data-ocid="settings.save.error_state"
                  >
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>บันทึกไม่สำเร็จ</AlertTitle>
                    <AlertDescription>
                      ไม่สามารถบันทึกโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง
                    </AlertDescription>
                  </Alert>
                ) : null}

                {saved && !saveProfile.isError ? (
                  <Alert
                    className="border-success/40 bg-success/10 text-success [&>svg]:text-success"
                    data-ocid="settings.save.success_state"
                  >
                    <CheckCircle2 aria-hidden="true" />
                    <AlertTitle>บันทึกโปรไฟล์แล้ว</AlertTitle>
                    <AlertDescription className="text-success/90">
                      ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อย
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
                    data-ocid="settings.save_button"
                  >
                    {saveProfile.isPending ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Save aria-hidden="true" />
                    )}
                    {saveProfile.isPending ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
                  </Button>
                  {isDirty ? (
                    <span className="text-xs text-muted-foreground">
                      มีการแก้ไขที่ยังไม่บันทึก
                    </span>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Read-only account details */}
          <Card className="rounded-lg border shadow-subtle">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BadgeCheck className="size-4 text-accent" aria-hidden="true" />
                ข้อมูลบัญชี
              </CardTitle>
              <CardDescription>ข้อมูลนี้แก้ไขไม่ได้</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  บทบาท
                </p>
                {role ? (
                  <StatusBadge
                    label={ROLE_LABELS[role]}
                    labelEn={ROLE_LABELS_EN[role]}
                    tone={ROLE_TONE[role]}
                    seal
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden="true" />
                  อีเมลที่ยืนยันแล้ว
                </p>
                <p className="break-all font-mono text-sm text-foreground">
                  {profile?.email ?? "ยังไม่ยืนยันอีเมล"}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Building2 className="size-3.5" aria-hidden="true" />
                  ภาควิชาปัจจุบัน
                </p>
                <p className="text-sm text-foreground">
                  {profile?.department || "ยังไม่ระบุ"}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  รหัสผู้ใช้ (Principal)
                </p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {profile ? shortPrincipal(profile.principal.toString()) : "—"}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  ลงทะเบียนเมื่อ
                </p>
                <p className="tabular text-sm text-foreground">
                  {profile ? formatThaiDate(profile.createdAt) : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
