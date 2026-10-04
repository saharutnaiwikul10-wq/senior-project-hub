import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAuthActions,
  useCallerProfile,
  useIsPlatformAdmin,
} from "@/hooks/useAuth";
import { AdminPage } from "@/pages/AdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EvaluationsPage } from "@/pages/EvaluationsPage";
import { FilesPage } from "@/pages/FilesPage";
import { MilestonesPage } from "@/pages/MilestonesPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectFormPage } from "@/pages/ProjectFormPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Auth gate                                                           */
/* ------------------------------------------------------------------ */

function SignInScreen() {
  const { signIn, isInitializing, isLoggingIn } = useAuthActions();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
      <Card className="w-full max-w-md rounded-lg border shadow-elevated">
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-gradient-primary font-display text-lg font-bold text-primary-foreground ring-2 ring-accent/50">
            คร
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              ครุฑาสาร
            </h1>
            <p className="text-sm text-muted-foreground">
              ระบบบริหารจัดการโครงการจบการศึกษา ระดับปริญญาตรี ปีที่ 4
            </p>
          </div>
          <Button
            type="button"
            onClick={signIn}
            disabled={isInitializing || isLoggingIn}
            size="lg"
            className="w-full bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
            data-ocid="auth.login_button"
          >
            {isInitializing || isLoggingIn ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <LogIn aria-hidden="true" />
            )}
            {isInitializing
              ? "กำลังโหลด…"
              : isLoggingIn
                ? "กำลังเข้าสู่ระบบ…"
                : "เข้าสู่ระบบด้วย Internet Identity"}
          </Button>
          <p className="text-xs text-muted-foreground">
            ต้องเข้าสู่ระบบก่อนจึงจะเข้าถึงข้อมูลโครงการได้
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="space-y-6">
      <Card className="rounded-lg border shadow-subtle">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            หน้านี้สำหรับผู้ดูแลระบบเท่านั้น หากคุณควรมีสิทธิ์ กรุณาติดต่อผู้ดูแลโครงการ
          </p>
          <Button asChild variant="outline" type="button">
            <Link to="/" data-ocid="access_denied.back_button">
              กลับแดชบอร์ด
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RootLayout() {
  const { isAuthenticated, isInitializing } = useAuthActions();
  const { isLoading } = useCallerProfile();
  const { isPlatformAdmin, isLoading: isLoadingAdmin } = useIsPlatformAdmin();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="กำลังโหลด"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  if (isLoading || isLoadingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="กำลังโหลดโปรไฟล์"
        />
      </div>
    );
  }

  return (
    <Layout isAdmin={isPlatformAdmin}>
      <Outlet />
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

const rootRoute = createRootRoute({ component: RootLayout });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const projectNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/new",
  component: ProjectFormPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id",
  component: ProjectDetailPage,
});

const projectEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id/edit",
  component: ProjectFormPage,
});

const milestonesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id/milestones",
  component: MilestonesPage,
});

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id/files",
  component: FilesPage,
});

const evaluationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id/evaluations",
  component: EvaluationsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminGate,
});

function AdminGate() {
  const { isPlatformAdmin, isLoading } = useIsPlatformAdmin();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="กำลังโหลด"
        />
      </div>
    );
  }
  if (!isPlatformAdmin) {
    return <AccessDenied />;
  }
  return <AdminPage />;
}

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  projectsRoute,
  projectNewRoute,
  projectDetailRoute,
  projectEditRoute,
  milestonesRoute,
  filesRoute,
  evaluationsRoute,
  adminRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
