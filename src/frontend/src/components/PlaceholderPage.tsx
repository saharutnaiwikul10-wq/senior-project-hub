import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

/**
 * Temporary route body used until the dedicated page task fills it in.
 * Keeps every declared route reachable and visually intentional.
 */
export function PlaceholderPage({
  title,
  subtitle,
  eyebrow,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
      <Card className="rounded-lg border shadow-subtle">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="size-6" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">หน้านี้อยู่ระหว่างการพัฒนา</p>
        </CardContent>
      </Card>
    </div>
  );
}
