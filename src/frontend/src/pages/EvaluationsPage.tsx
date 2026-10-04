import type { CriterionScore } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCallerProfile } from "@/hooks/useAuth";
import {
  useAddComment,
  useEvaluations,
  useProject,
  useProjectComments,
  useScoreSummary,
  useSubmitEvaluation,
} from "@/hooks/useQueries";
import {
  AppRole,
  type Comment,
  type Evaluation,
  formatThaiDateTime,
  shortPrincipal,
} from "@/types";
import { useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MessageSquare,
  Send,
  Star,
  Users,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Criteria definition                                                 */
/* ------------------------------------------------------------------ */

interface CriterionDef {
  key: string;
  label: string;
  labelEn: string;
  weight: bigint;
  maxScore: bigint;
}

const CRITERIA: CriterionDef[] = [
  {
    key: "creativity",
    label: "ความคิดสร้างสรรค์",
    labelEn: "Creativity",
    weight: 30n,
    maxScore: 10n,
  },
  {
    key: "methodology",
    label: "ระเบียบวิธีวิจัย",
    labelEn: "Methodology",
    weight: 40n,
    maxScore: 10n,
  },
  {
    key: "presentation",
    label: "การนำเสนอ",
    labelEn: "Presentation",
    weight: 30n,
    maxScore: 10n,
  },
];

const CRITERION_LABELS: Record<string, string> = Object.fromEntries(
  CRITERIA.map((c) => [c.key, c.label]),
);

const EMPTY_SCORES: Record<string, string> = Object.fromEntries(
  CRITERIA.map((c) => [c.key, ""]),
);

function criterionLabel(key: string): string {
  return CRITERION_LABELS[key] ?? key;
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function SummaryStat({
  icon: Icon,
  label,
  value,
  hint,
  ocid,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  hint?: string;
  ocid: string;
}) {
  return (
    <Card
      className="rounded-lg border shadow-subtle transition-smooth hover:shadow-elevated"
      data-ocid={ocid}
    >
      <CardContent className="flex items-start gap-3 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground ring-1 ring-accent/30">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="tabular font-display text-2xl font-bold text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function CriterionScoreRow({ item }: { item: CriterionScore }) {
  const max = Number(item.maxScore);
  const score = Number(item.score);
  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {criterionLabel(item.criterion)}
        </span>
        <span className="tabular shrink-0 text-sm font-semibold text-foreground">
          {score}
          <span className="text-muted-foreground"> / {max}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="tabular w-14 shrink-0 text-right text-[11px] text-muted-foreground">
          น้ำหนัก {Number(item.weight)}%
        </span>
      </div>
    </div>
  );
}

function EvaluationCard({
  evaluation,
  index,
}: {
  evaluation: Evaluation;
  index: number;
}) {
  return (
    <Card
      className="rounded-lg border shadow-subtle"
      data-ocid={`evaluation.item.${index + 1}`}
    >
      <CardHeader className="gap-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
              {shortPrincipal(evaluation.evaluator.toString()).slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                ผู้ประเมิน {shortPrincipal(evaluation.evaluator.toString())}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatThaiDateTime(evaluation.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                รวม
              </p>
              <p className="tabular font-display text-lg font-bold text-foreground">
                {Number(evaluation.totalScore)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                เฉลี่ย
              </p>
              <p className="tabular font-display text-lg font-bold text-accent-foreground">
                {Number(evaluation.averageScore)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {evaluation.criteria.map((item) => (
            <CriterionScoreRow
              key={`${evaluation.id.toString()}-${item.criterion}`}
              item={item}
            />
          ))}
        </div>
        {evaluation.comment.trim() ? (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {evaluation.comment}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CommentRow({ comment, index }: { comment: Comment; index: number }) {
  return (
    <li className="flex gap-3 py-3" data-ocid={`comment.item.${index + 1}`}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-[11px] font-bold text-secondary-foreground">
        {shortPrincipal(comment.author.toString()).slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-foreground">
            {shortPrincipal(comment.author.toString())}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatThaiDateTime(comment.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {comment.body}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function EvaluationsPage() {
  const { id } = useParams({ from: "/projects/$id/evaluations" });

  const projectId = useMemo<bigint | undefined>(() => {
    try {
      return BigInt(id);
    } catch {
      return undefined;
    }
  }, [id]);

  const { data: profile } = useCallerProfile();
  const role = profile?.role;
  const canEvaluate =
    role === AppRole.advisor ||
    role === AppRole.committee ||
    role === AppRole.admin;

  const { data: project } = useProject(projectId);
  const evaluationsQuery = useEvaluations(projectId);
  const summaryQuery = useScoreSummary(projectId);
  const commentsQuery = useProjectComments(projectId);

  const submitEvaluation = useSubmitEvaluation();
  const addComment = useAddComment();

  const [scores, setScores] = useState<Record<string, string>>(EMPTY_SCORES);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const evaluations = evaluationsQuery.data ?? [];
  const comments = commentsQuery.data ?? [];
  const summary = summaryQuery.data;

  const previewTotal = useMemo(() => {
    const weighted = CRITERIA.reduce((sum, c) => {
      const n = Number(scores[c.key] ?? "");
      return sum + (Number.isNaN(n) ? 0 : n) * Number(c.weight);
    }, 0);
    return weighted / 100;
  }, [scores]);

  function handleScoreChange(key: string, value: string) {
    setScores((current) => ({ ...current, [key]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;

    const parsed = CRITERIA.map((c) => ({ def: c, raw: scores[c.key] ?? "" }));
    const invalid = parsed.find(({ def, raw }) => {
      const n = Number(raw);
      return (
        raw.trim() === "" ||
        Number.isNaN(n) ||
        n < 0 ||
        n > Number(def.maxScore)
      );
    });
    if (invalid) {
      setFormError(
        `กรุณากรอกคะแนน ${invalid.def.label} ระหว่าง 0–${Number(
          invalid.def.maxScore,
        )}`,
      );
      return;
    }

    setFormError(null);
    const criteria: CriterionScore[] = parsed.map(({ def, raw }) => ({
      criterion: def.key,
      weight: def.weight,
      maxScore: def.maxScore,
      score: BigInt(Math.round(Number(raw))),
    }));

    const capturedComment = comment;
    const capturedScores = scores;
    setComment("");
    setScores(EMPTY_SCORES);

    submitEvaluation.mutate(
      { projectId, comment: capturedComment.trim(), criteria },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => {
          setComment((current) => (current === "" ? capturedComment : current));
          setScores((current) =>
            Object.values(current).every((v) => v === "")
              ? capturedScores
              : current,
          );
          setFormError("บันทึกการประเมินไม่สำเร็จ กรุณาลองอีกครั้ง");
        },
      },
    );
  }

  function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    const body = commentDraft.trim();
    if (!body) {
      setCommentError("กรุณาพิมพ์ข้อคิดเห็นก่อนส่ง");
      return;
    }
    setCommentError(null);
    const captured = commentDraft;
    setCommentDraft("");
    addComment.mutate(
      { body, target: { __kind__: "project", project: projectId } },
      {
        onError: () => {
          setCommentDraft((current) => (current === "" ? captured : current));
          setCommentError("ส่งข้อคิดเห็นไม่สำเร็จ กรุณาลองอีกครั้ง");
        },
      },
    );
  }

  if (projectId === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="การประเมิน · Evaluations"
          title="การประเมินและคะแนน"
        />
        <EmptyState
          icon={AlertCircle}
          title="ไม่พบรหัสโครงการ"
          description="ลิงก์ที่คุณเปิดไม่ถูกต้อง กรุณากลับไปเลือกโครงการจากทะเบียนโครงการ"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="evaluations.page">
      <PageHeader
        eyebrow="การประเมิน · Evaluations"
        title="การประเมินและคะแนน"
        subtitle={
          project
            ? `ผลการประเมินตามเกณฑ์ คะแนนรวม และความเห็นของคณะกรรมการสำหรับ “${project.title}”`
            : "ผลการประเมินตามเกณฑ์ คะแนนรวม และความเห็นของคณะกรรมการ"
        }
      />

      {/* Score summary strip */}
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="สรุปคะแนน"
        data-ocid="evaluations.summary_section"
      >
        <SummaryStat
          icon={Users}
          label="จำนวนผู้ประเมิน"
          value={summary ? Number(summary.evaluationCount).toString() : "—"}
          hint="รายการประเมินที่ส่งแล้ว"
          ocid="evaluations.summary_count"
        />
        <SummaryStat
          icon={Star}
          label="คะแนนรวมเฉลี่ย"
          value={summary ? Number(summary.averageTotal).toString() : "—"}
          hint="เฉลี่ยจากทุกผู้ประเมิน"
          ocid="evaluations.summary_average_total"
        />
        <SummaryStat
          icon={ClipboardCheck}
          label="คะแนนเฉลี่ยต่อเกณฑ์"
          value={summary ? Number(summary.averageScore).toString() : "—"}
          hint="เฉลี่ยรายเกณฑ์การประเมิน"
          ocid="evaluations.summary_average_score"
        />
      </section>

      {/* Scoring form — advisors, committee, admin only */}
      {canEvaluate ? (
        <Card
          className="rounded-lg border shadow-subtle"
          data-ocid="evaluations.form_card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck
                className="size-5 text-accent"
                aria-hidden="true"
              />
              ส่งผลการประเมิน
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              ให้คะแนนแต่ละเกณฑ์เต็ม {Number(CRITERIA[0].maxScore)} คะแนน
              ระบบจะถ่วงน้ำหนักตามที่กำหนดและคำนวณคะแนนรวมให้อัตโนมัติ
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {CRITERIA.map((c) => (
                  <div
                    key={c.key}
                    className="grid items-center gap-3 sm:grid-cols-[1fr_auto_8rem]"
                  >
                    <div className="min-w-0">
                      <Label
                        htmlFor={`score-${c.key}`}
                        className="text-sm font-medium"
                      >
                        {c.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {c.labelEn} · น้ำหนัก {Number(c.weight)}%
                      </p>
                    </div>
                    <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground sm:inline-flex">
                      น้ำหนัก {Number(c.weight)}%
                    </span>
                    <Input
                      id={`score-${c.key}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={Number(c.maxScore)}
                      step={1}
                      value={scores[c.key] ?? ""}
                      onChange={(e) => handleScoreChange(c.key, e.target.value)}
                      placeholder={`0–${Number(c.maxScore)}`}
                      className="tabular text-right"
                      data-ocid={`evaluations.score_input.${c.key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                  คะแนนรวมถ่วงน้ำหนัก (ประมาณการ)
                </span>
                <span
                  className="tabular font-display text-xl font-bold text-foreground"
                  data-ocid="evaluations.preview_total"
                >
                  {previewTotal.toFixed(1)}
                </span>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="evaluation-comment"
                  className="text-sm font-medium"
                >
                  ความคิดเห็น / ข้อเสนอแนะ
                </Label>
                <Textarea
                  id="evaluation-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ระบุข้อเสนอแนะเพื่อพัฒนางานของนักศึกษา…"
                  rows={3}
                  data-ocid="evaluations.comment_textarea"
                />
              </div>

              {formError ? (
                <p
                  className="flex items-center gap-2 text-sm font-medium text-destructive"
                  role="alert"
                  data-ocid="evaluations.form_error"
                >
                  <AlertCircle className="size-4" aria-hidden="true" />
                  {formError}
                </p>
              ) : null}

              {submitted ? (
                <p
                  className="flex items-center gap-2 text-sm font-medium text-success"
                  data-ocid="evaluations.success_state"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  บันทึกผลการประเมินเรียบร้อยแล้ว
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitEvaluation.isPending}
                  className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
                  data-ocid="evaluations.submit_button"
                >
                  {submitEvaluation.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  {submitEvaluation.isPending ? "กำลังบันทึก…" : "ส่งผลการประเมิน"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="rounded-lg border border-accent/30 bg-accent/5 shadow-subtle"
          data-ocid="evaluations.readonly_notice"
        >
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
              <Star className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              คุณกำลังดูผลการประเมินในโหมดอ่านอย่างเดียว
              เฉพาะอาจารย์ที่ปรึกษาและกรรมการเท่านั้นที่ส่งผลการประเมินได้
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evaluations list */}
      <section className="space-y-4" data-ocid="evaluations.list_section">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">
            ผลการประเมินทั้งหมด
          </h2>
          <span className="tabular text-sm text-muted-foreground">
            {evaluations.length} รายการ
          </span>
        </div>

        {evaluationsQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : evaluations.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="ยังไม่มีผลการประเมิน"
            description="เมื่ออาจารย์ที่ปรึกษาหรือกรรมการส่งผลการประเมิน คะแนนและความเห็นจะแสดงที่นี่"
          />
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation, index) => (
              <EvaluationCard
                key={evaluation.id.toString()}
                evaluation={evaluation}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* Project comments */}
      <section className="space-y-4" data-ocid="evaluations.comments_section">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-foreground">
            ความคิดเห็นต่อโครงการ
          </h2>
        </div>

        <Card className="rounded-lg border shadow-subtle">
          <CardContent className="p-5">
            {commentsQuery.isLoading ? (
              <LoadingState rows={2} />
            ) : comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีความคิดเห็นต่อโครงการนี้
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {comments.map((comment, index) => (
                  <CommentRow
                    key={comment.id.toString()}
                    comment={comment}
                    index={index}
                  />
                ))}
              </ul>
            )}

            <Separator className="my-4" />

            <form onSubmit={handleAddComment} className="space-y-3">
              <Label htmlFor="project-comment" className="text-sm font-medium">
                เพิ่มความคิดเห็น
              </Label>
              <Textarea
                id="project-comment"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="แสดงความคิดเห็นหรือข้อเสนอแนะต่อโครงการ…"
                rows={3}
                data-ocid="evaluations.comment_input"
              />
              {commentError ? (
                <p
                  className="flex items-center gap-2 text-sm font-medium text-destructive"
                  role="alert"
                  data-ocid="evaluations.comment_error"
                >
                  <AlertCircle className="size-4" aria-hidden="true" />
                  {commentError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={addComment.isPending}
                  data-ocid="evaluations.comment_submit_button"
                >
                  {addComment.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  {addComment.isPending ? "กำลังส่ง…" : "ส่งความคิดเห็น"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
