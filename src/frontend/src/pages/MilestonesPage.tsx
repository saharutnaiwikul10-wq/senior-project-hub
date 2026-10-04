import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useCreateMilestone,
  useCreateSubTask,
  useDeleteMilestone,
  useDeleteSubTask,
  useMilestones,
  useProject,
  useProjectProgress,
  useSetMilestoneStatus,
  useSetSubTaskDone,
  useSubTasks,
  useUpdateMilestone,
} from "@/hooks/useQueries";
import {
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_LABELS_EN,
  MILESTONE_STATUS_TONE,
  type Milestone,
  MilestoneStatus,
  type SubTask,
  formatThaiDate,
  shortPrincipal,
  timestampToDate,
} from "@/types";
import { Principal } from "@icp-sdk/core/principal";
import { useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MS_PER_DAY = 86_400_000;

/** Converts a `yyyy-mm-dd` input value into a Motoko nanosecond timestamp. */
function dateInputToTimestamp(value: string): bigint | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return BigInt(date.getTime()) * 1_000_000n;
}

/** Converts a backend timestamp into a `yyyy-mm-dd` input value. */
function timestampToDateInput(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Whole days between now and a due date; negative means overdue. */
function daysUntil(timestamp: bigint): number | null {
  const date = timestampToDate(timestamp);
  if (!date) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / MS_PER_DAY);
}

function isOverdue(milestone: Milestone): boolean {
  if (milestone.status === MilestoneStatus.done) return false;
  const days = daysUntil(milestone.dueDate);
  return days !== null && days < 0;
}

function dueLabel(timestamp: bigint): string {
  const days = daysUntil(timestamp);
  if (days === null) return "ไม่ระบุ";
  if (days === 0) return "ครบกำหนดวันนี้";
  if (days === 1) return "อีก 1 วัน";
  if (days > 1) return `อีก ${days} วัน`;
  return `เลยกำหนด ${Math.abs(days)} วัน`;
}

/* ------------------------------------------------------------------ */
/* Milestone form dialog                                               */
/* ------------------------------------------------------------------ */

interface MilestoneFormValues {
  name: string;
  dueDate: string;
  weight: string;
}

const EMPTY_MILESTONE_FORM: MilestoneFormValues = {
  name: "",
  dueDate: "",
  weight: "10",
};

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: bigint;
  editing: Milestone | null;
}

function MilestoneDialog({
  open,
  onOpenChange,
  projectId,
  editing,
}: MilestoneDialogProps) {
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const [form, setForm] = useState<MilestoneFormValues>(EMPTY_MILESTONE_FORM);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the draft whenever the dialog opens for a different record.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const seedKey = open ? (editing ? editing.id.toString() : "new") : null;
  if (open && seedKey !== seededFor) {
    setSeededFor(seedKey);
    setForm(
      editing
        ? {
            name: editing.name,
            dueDate: timestampToDateInput(editing.dueDate),
            weight: editing.weight.toString(),
          }
        : EMPTY_MILESTONE_FORM,
    );
    setError(null);
  }
  if (!open && seededFor !== null) {
    setSeededFor(null);
  }

  const isPending = createMilestone.isPending || updateMilestone.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const dueDate = dateInputToTimestamp(form.dueDate);
    const weight = Number.parseInt(form.weight, 10);
    if (!name) {
      setError("กรุณากรอกชื่อกำหนดส่ง");
      return;
    }
    if (dueDate === null) {
      setError("กรุณาเลือกวันครบกำหนด");
      return;
    }
    if (!Number.isFinite(weight) || weight < 0) {
      setError("น้ำหนักคะแนนต้องเป็นตัวเลขที่ไม่ติดลบ");
      return;
    }
    setError(null);
    if (editing) {
      updateMilestone.mutate(
        { milestoneId: editing.id, name, dueDate, weight: BigInt(weight) },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMilestone.mutate(
        { projectId, name, dueDate, weight: BigInt(weight) },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="milestone.dialog">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขกำหนดส่ง" : "เพิ่มกำหนดส่งใหม่"}</DialogTitle>
          <DialogDescription>
            ระบุชื่อ วันครบกำหนด และน้ำหนักคะแนนของช่วงงานนี้
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-name">ชื่อกำหนดส่ง</Label>
            <Input
              id="milestone-name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="เช่น โครงร่างบทที่ 1–3"
              data-ocid="milestone.name_input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="milestone-due">วันครบกำหนด</Label>
              <Input
                id="milestone-due"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                data-ocid="milestone.due_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-weight">น้ำหนักคะแนน (%)</Label>
              <Input
                id="milestone-weight"
                type="number"
                min={0}
                max={100}
                value={form.weight}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weight: e.target.value }))
                }
                data-ocid="milestone.weight_input"
              />
            </div>
          </div>
          {error ? (
            <p
              className="text-sm font-medium text-destructive"
              data-ocid="milestone.error_state"
            >
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                data-ocid="milestone.cancel_button"
              >
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="milestone.submit_button"
            >
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {editing ? "บันทึกการแก้ไข" : "เพิ่มกำหนดส่ง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-task add form                                                   */
/* ------------------------------------------------------------------ */

interface SubTaskFormProps {
  milestoneId: bigint;
}

function SubTaskForm({ milestoneId }: SubTaskFormProps) {
  const createSubTask = useCreateSubTask();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAssignee = assignee.trim();
    const due = dateInputToTimestamp(dueDate);
    if (!trimmedTitle) {
      setError("กรุณากรอกชื่องานย่อย");
      return;
    }
    if (!trimmedAssignee) {
      setError("กรุณาระบุผู้รับผิดชอบ");
      return;
    }
    if (due === null) {
      setError("กรุณาเลือกวันครบกำหนด");
      return;
    }
    let principal: Principal;
    try {
      principal = Principal.fromText(trimmedAssignee);
    } catch {
      setError("รูปแบบ Principal ของผู้รับผิดชอบไม่ถูกต้อง");
      return;
    }
    setError(null);
    createSubTask.mutate(
      { milestoneId, title: trimmedTitle, assignee: principal, dueDate: due },
      {
        onSuccess: () => {
          setTitle("");
          setAssignee("");
          setDueDate("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor={`subtask-title-${milestoneId}`} className="text-xs">
          ชื่องานย่อย
        </Label>
        <Input
          id={`subtask-title-${milestoneId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น รวบรวมเอกสารอ้างอิง"
          className="h-8"
          data-ocid="subtask.title_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`subtask-assignee-${milestoneId}`} className="text-xs">
          ผู้รับผิดชอบ (Principal)
        </Label>
        <Input
          id={`subtask-assignee-${milestoneId}`}
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
          className="h-8 font-mono text-xs"
          data-ocid="subtask.assignee_input"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`subtask-due-${milestoneId}`} className="text-xs">
          ครบกำหนด
        </Label>
        <Input
          id={`subtask-due-${milestoneId}`}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8"
          data-ocid="subtask.due_input"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={createSubTask.isPending}
        className="h-8"
        data-ocid="subtask.add_button"
      >
        {createSubTask.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Plus aria-hidden="true" />
        )}
        เพิ่ม
      </Button>
      {error ? (
        <p
          className="text-xs font-medium text-destructive sm:col-span-4"
          data-ocid="subtask.error_state"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-task row                                                        */
/* ------------------------------------------------------------------ */

function SubTaskRow({ subTask }: { subTask: SubTask }) {
  const setSubTaskDone = useSetSubTaskDone();
  const deleteSubTask = useDeleteSubTask();
  const overdue = !subTask.done && (daysUntil(subTask.dueDate) ?? 0) < 0;

  return (
    <div
      className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
      data-ocid="subtask.item"
    >
      <Checkbox
        checked={subTask.done}
        disabled={setSubTaskDone.isPending}
        onCheckedChange={(checked) =>
          setSubTaskDone.mutate({
            subTaskId: subTask.id,
            done: checked === true,
          })
        }
        aria-label={`ทำเครื่องหมายงาน ${subTask.title} ว่าเสร็จ`}
        data-ocid="subtask.checkbox"
      />
      <div className="min-w-0 flex-1">
        <p
          className={
            subTask.done
              ? "truncate text-sm text-muted-foreground line-through"
              : "truncate text-sm font-medium text-foreground"
          }
        >
          {subTask.title}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {shortPrincipal(subTask.assignee.toString())}
        </p>
      </div>
      <span
        className={
          overdue
            ? "tabular shrink-0 text-xs font-semibold text-destructive"
            : "tabular shrink-0 text-xs text-muted-foreground"
        }
      >
        {formatThaiDate(subTask.dueDate)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => deleteSubTask.mutate(subTask.id)}
        disabled={deleteSubTask.isPending}
        aria-label={`ลบงานย่อย ${subTask.title}`}
        data-ocid="subtask.delete_button"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Milestone card                                                      */
/* ------------------------------------------------------------------ */

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestone: Milestone) => void;
}

function MilestoneCard({
  milestone,
  index,
  onEdit,
  onDelete,
}: MilestoneCardProps) {
  const [open, setOpen] = useState(false);
  const { data: subTasks = [], isLoading } = useSubTasks(milestone.id);
  const setStatus = useSetMilestoneStatus();

  const doneCount = subTasks.filter((task) => task.done).length;
  const percent =
    subTasks.length === 0
      ? milestone.status === MilestoneStatus.done
        ? 100
        : 0
      : Math.round((doneCount / subTasks.length) * 100);
  const overdue = isOverdue(milestone);

  return (
    <Card
      className="rounded-lg border shadow-subtle"
      data-ocid={`milestone.item.${index + 1}`}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{milestone.name}</CardTitle>
                <StatusBadge
                  label={MILESTONE_STATUS_LABELS[milestone.status]}
                  labelEn={MILESTONE_STATUS_LABELS_EN[milestone.status]}
                  tone={MILESTONE_STATUS_TONE[milestone.status]}
                />
                {overdue ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    เลยกำหนด
                  </span>
                ) : null}
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {formatThaiDate(milestone.dueDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {dueLabel(milestone.dueDate)}
                </span>
                <span className="tabular inline-flex items-center gap-1.5">
                  <ListChecks className="size-3.5" aria-hidden="true" />
                  น้ำหนัก {milestone.weight.toString()}%
                </span>
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Select
                value={milestone.status}
                onValueChange={(value) =>
                  setStatus.mutate({
                    milestoneId: milestone.id,
                    status: value as MilestoneStatus,
                  })
                }
                disabled={setStatus.isPending}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[9.5rem]"
                  aria-label={`เปลี่ยนสถานะของ ${milestone.name}`}
                  data-ocid={`milestone.status_select.${index + 1}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MilestoneStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {MILESTONE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={() => onEdit(milestone)}
                aria-label={`แก้ไขกำหนดส่ง ${milestone.name}`}
                data-ocid={`milestone.edit_button.${index + 1}`}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(milestone)}
                aria-label={`ลบกำหนดส่ง ${milestone.name}`}
                data-ocid={`milestone.delete_button.${index + 1}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <ProgressBar
              value={percent}
              tone={
                milestone.status === MilestoneStatus.done
                  ? "success"
                  : overdue
                    ? "destructive"
                    : "progress"
              }
              label={`ความคืบหน้าของ ${milestone.name}`}
            />
            <p className="text-xs text-muted-foreground">
              งานย่อยเสร็จแล้ว {doneCount}/{subTasks.length} รายการ
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between"
              data-ocid={`milestone.expand_button.${index + 1}`}
            >
              <span className="inline-flex items-center gap-2">
                <ListChecks aria-hidden="true" />
                งานย่อย ({subTasks.length})
              </span>
              <ChevronDown
                className={
                  open
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3">
            {isLoading ? (
              <LoadingState rows={2} />
            ) : subTasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                ยังไม่มีงานย่อยในกำหนดส่งนี้
              </p>
            ) : (
              <div className="space-y-2">
                {subTasks.map((subTask) => (
                  <SubTaskRow key={subTask.id.toString()} subTask={subTask} />
                ))}
              </div>
            )}
            <SubTaskForm milestoneId={milestone.id} />
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Deadline timeline rail                                              */
/* ------------------------------------------------------------------ */

function DeadlineRail({ milestones }: { milestones: Milestone[] }) {
  const sorted = useMemo(
    () =>
      [...milestones].sort((a, b) =>
        a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0,
      ),
    [milestones],
  );

  return (
    <Card
      className="rounded-lg border shadow-subtle"
      data-ocid="timeline.panel"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-accent" aria-hidden="true" />
          ไทม์ไลน์กำหนดส่ง
        </CardTitle>
        <CardDescription>
          เรียงตามวันครบกำหนด แสดงรายการที่ใกล้ถึงและเลยกำหนด
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีกำหนดส่งให้แสดง
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {sorted.map((milestone, index) => {
              const overdue = isOverdue(milestone);
              const done = milestone.status === MilestoneStatus.done;
              return (
                <li
                  key={milestone.id.toString()}
                  className="relative"
                  data-ocid={`timeline.item.${index + 1}`}
                >
                  <span
                    aria-hidden="true"
                    className={
                      overdue
                        ? "absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-card bg-destructive"
                        : done
                          ? "absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-card bg-success"
                          : "absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-card bg-progress"
                    }
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {milestone.name}
                    </p>
                    <p className="tabular text-xs text-muted-foreground">
                      {formatThaiDate(milestone.dueDate)}
                    </p>
                    <p
                      className={
                        overdue
                          ? "text-xs font-semibold text-destructive"
                          : done
                            ? "text-xs font-medium text-success"
                            : "text-xs text-muted-foreground"
                      }
                    >
                      {done ? "เสร็จสิ้นแล้ว" : dueLabel(milestone.dueDate)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function MilestonesPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const rawId = params.id;
  const projectId = useMemo(() => {
    if (!rawId) return undefined;
    try {
      return BigInt(rawId);
    } catch {
      return undefined;
    }
  }, [rawId]);

  const { data: project } = useProject(projectId);
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const { data: progress } = useProjectProgress(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Milestone | null>(null);
  const deleteMilestone = useDeleteMilestone();

  const overdueCount = milestones.filter(isOverdue).length;
  const doneMilestones = milestones.filter(
    (m) => m.status === MilestoneStatus.done,
  ).length;
  const overallPercent = progress ? Number(progress.percent) : 0;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(milestone: Milestone) {
    setEditing(milestone);
    setDialogOpen(true);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteMilestone.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  if (projectId === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="กำหนดส่ง · Milestones"
          title="กำหนดส่งและงานย่อย"
          subtitle="ไม่พบรหัสโครงการในที่อยู่ของหน้า"
        />
        <EmptyState
          icon={AlertTriangle}
          title="รหัสโครงการไม่ถูกต้อง"
          description="กรุณาเปิดหน้านี้จากรายการโครงการเพื่อดูกำหนดส่ง"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="milestones.page">
      <PageHeader
        eyebrow="กำหนดส่ง · Milestones"
        title="กำหนดส่งและงานย่อย"
        subtitle={
          project
            ? `ติดตามกำหนดส่ง น้ำหนักคะแนน และงานย่อยของโครงการ “${project.title}”`
            : "ติดตามกำหนดส่ง น้ำหนักคะแนน และงานย่อยของโครงการ"
        }
        actions={
          <Button
            type="button"
            onClick={openCreate}
            className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
            data-ocid="milestone.open_modal_button"
          >
            <CalendarPlus aria-hidden="true" />
            เพิ่มกำหนดส่ง
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border shadow-subtle">
          <CardContent className="space-y-2 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ความคืบหน้าโดยรวม
            </p>
            <p className="tabular font-display text-3xl font-bold text-foreground">
              {overallPercent}%
            </p>
            <ProgressBar
              value={overallPercent}
              tone={overallPercent >= 100 ? "success" : "progress"}
              showLabel={false}
              label="ความคืบหน้าโดยรวมของโครงการ"
            />
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-subtle">
          <CardContent className="space-y-1 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              กำหนดส่งทั้งหมด
            </p>
            <p className="tabular font-display text-3xl font-bold text-foreground">
              {milestones.length}
            </p>
            <p className="text-xs text-muted-foreground">
              เสร็จสิ้นแล้ว {doneMilestones} รายการ
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border shadow-subtle">
          <CardContent className="space-y-1 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              งานย่อยที่เสร็จ
            </p>
            <p className="tabular font-display text-3xl font-bold text-foreground">
              {progress ? progress.doneSubTasks.toString() : "0"}
              <span className="text-lg font-medium text-muted-foreground">
                /{progress ? progress.totalSubTasks.toString() : "0"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">จากทุกกำหนดส่ง</p>
          </CardContent>
        </Card>
        <Card
          className={
            overdueCount > 0
              ? "rounded-lg border-destructive/40 shadow-subtle"
              : "rounded-lg border shadow-subtle"
          }
        >
          <CardContent className="space-y-1 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              เลยกำหนด
            </p>
            <p
              className={
                overdueCount > 0
                  ? "tabular font-display text-3xl font-bold text-destructive"
                  : "tabular font-display text-3xl font-bold text-foreground"
              }
            >
              {overdueCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {overdueCount > 0 ? "ต้องดำเนินการโดยเร็ว" : "ไม่มีรายการค้าง"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Milestone list */}
        <section className="space-y-4" aria-label="รายการกำหนดส่ง">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">
              กำหนดส่งของโครงการ
            </h2>
            <span className="text-xs text-muted-foreground">
              {milestones.length} รายการ
            </span>
          </div>

          {isLoading ? (
            <LoadingState rows={3} />
          ) : milestones.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="ยังไม่มีกำหนดส่ง"
              description="เริ่มต้นด้วยการเพิ่มกำหนดส่งแรกของโครงการ พร้อมวันครบกำหนดและน้ำหนักคะแนน"
              action={
                <Button
                  type="button"
                  onClick={openCreate}
                  data-ocid="milestone.empty_add_button"
                >
                  <CalendarPlus aria-hidden="true" />
                  เพิ่มกำหนดส่ง
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id.toString()}
                  milestone={milestone}
                  index={index}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Timeline rail */}
        <aside className="space-y-4">
          <DeadlineRail milestones={milestones} />
          <Card className="rounded-lg border shadow-subtle">
            <CardContent className="flex items-start gap-3 py-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
                <CheckCircle2 className="size-4" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  เคล็ดลับการติดตาม
                </p>
                <p className="text-xs text-muted-foreground">
                  อัปเดตสถานะกำหนดส่งเป็น “เสร็จสิ้น” เมื่อส่งงานครบ
                  เพื่อให้เปอร์เซ็นต์ความคืบหน้าคำนวณได้แม่นยำ
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        editing={editing}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="milestone.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกำหนดส่งนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบ “{pendingDelete?.name}” จะลบงานย่อยทั้งหมดภายใต้กำหนดส่งนี้
              และไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="milestone.delete_cancel_button">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMilestone.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="milestone.delete_confirm_button"
            >
              {deleteMilestone.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              ลบกำหนดส่ง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
