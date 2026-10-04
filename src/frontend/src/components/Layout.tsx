import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthActions, useCallerProfile } from "@/hooks/useAuth";
import { ROLE_LABELS, ROLE_LABELS_EN, shortPrincipal } from "@/types";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogIn,
  LogOut,
  type LucideIcon,
  Milestone,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  {
    to: "/",
    label: "แดชบอร์ด",
    labelEn: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/projects",
    label: "โครงการ",
    labelEn: "Projects",
    icon: FolderKanban,
  },
  {
    to: "/projects/new",
    label: "สร้างโครงการ",
    labelEn: "New project",
    icon: ClipboardList,
  },
  {
    to: "/settings",
    label: "ตั้งค่าโปรไฟล์",
    labelEn: "Settings",
    icon: Settings,
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "ผู้ดูแลระบบ",
    labelEn: "Admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const PROJECT_SECTIONS: NavItem[] = [
  {
    to: "/projects/$id/milestones",
    label: "กำหนดส่ง",
    labelEn: "Milestones",
    icon: Milestone,
  },
  {
    to: "/projects/$id/files",
    label: "เอกสาร",
    labelEn: "Files",
    icon: FileText,
  },
  {
    to: "/projects/$id/evaluations",
    label: "การประเมิน",
    labelEn: "Evaluations",
    icon: Star,
  },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.to);
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className="h-10 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
      >
        <Link
          to={item.to}
          data-ocid={`nav.${item.labelEn.toLowerCase().replace(/\s+/g, "_")}`}
        >
          <Icon aria-hidden="true" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate">{item.label}</span>
            <span className="truncate text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              {item.labelEn}
            </span>
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = isAdmin ? [...PRIMARY_NAV, ...ADMIN_NAV] : PRIMARY_NAV;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-2 py-1.5"
          data-ocid="nav.brand"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground ring-2 ring-accent/50">
            คร
          </span>
          <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-base font-bold text-sidebar-foreground">
              ครุฑาสาร
            </span>
            <span className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
              Senior Project Registry
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนูหลัก · Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavLink key={item.to} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>ภายในโครงการ · Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PROJECT_SECTIONS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    disabled
                    tooltip={`${item.label} — เปิดจากหน้าโครงการ`}
                    className="h-10 opacity-60"
                  >
                    <item.icon aria-hidden="true" />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate">{item.label}</span>
                      <span className="truncate text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                        {item.labelEn}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-[10px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          ระบบบริหารจัดการโครงการจบการศึกษา
          <br />
          ระดับปริญญาตรี ปีที่ 4
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const { data: profile } = useCallerProfile();
  const { signIn, signOut, isAuthenticated, isInitializing, isLoggingIn } =
    useAuthActions();

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        onClick={signIn}
        disabled={isInitializing || isLoggingIn}
        className="bg-gradient-primary shadow-subtle transition-smooth hover:shadow-elevated"
        data-ocid="auth.login_button"
      >
        <LogIn aria-hidden="true" />
        {isInitializing
          ? "กำลังโหลด…"
          : isLoggingIn
            ? "กำลังเข้าสู่ระบบ…"
            : "เข้าสู่ระบบ"}
      </Button>
    );
  }

  const displayName = profile?.displayName ?? "ผู้ใช้";
  const role = profile?.role;
  const initials = displayName.slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 gap-2 px-2"
          data-ocid="auth.user_menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[10rem] truncate text-sm font-medium">
              {displayName}
            </span>
            <span className="max-w-[10rem] truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {role ? ROLE_LABELS_EN[role] : "—"}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-semibold">{displayName}</p>
          {role ? (
            <p className="text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[role]} · {ROLE_LABELS_EN[role]}
            </p>
          ) : null}
          <p className="font-mono text-[11px] font-normal text-muted-foreground">
            {profile?.email ?? "ยังไม่ยืนยันอีเมล"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" data-ocid="auth.settings_link">
            <Settings aria-hidden="true" />
            ตั้งค่าโปรไฟล์
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={signOut}
          variant="destructive"
          data-ocid="auth.logout_button"
        >
          <LogOut aria-hidden="true" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar() {
  const { data: profile } = useCallerProfile();
  const role = profile?.role;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-subtle md:px-6">
      <SidebarTrigger
        className="-ml-1"
        aria-label="เปิด/ปิดเมนูนำทาง"
        data-ocid="nav.sidebar_toggle"
      />
      <div className="hidden min-w-0 flex-col leading-tight md:flex">
        <span className="truncate text-sm font-semibold text-foreground">
          ระบบบริหารจัดการโครงการจบการศึกษา
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          Senior Project Management · ปีการศึกษา 2567
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {role ? (
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground sm:inline-flex">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {ROLE_LABELS[role]}
          </span>
        ) : null}
        <UserMenu />
      </div>
    </header>
  );
}

interface LayoutProps {
  children: ReactNode;
  isAdmin: boolean;
}

/** Application shell: persistent sidebar, sticky top bar, and content area. */
export function Layout({ children, isAdmin }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset className="bg-background">
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="border-t border-border bg-muted/40 px-4 py-4 md:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
