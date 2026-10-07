import {
  CalendarClock,
  Gauge,
  HardDrive,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/lib/types";
import { can, canSeeDashboard, type Permission } from "@/lib/permissions";

export interface Section {
  href: string;
  label: string;
  icon: LucideIcon;
  /** What the section's endpoints require; Overview opens for every administrator. */
  permission?: Permission;
}

export const SECTIONS: Section[] = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/libraries", label: "Libraries", icon: HardDrive, permission: "ACCESS_ADMIN" },
  { href: "/admin/tasks", label: "Tasks", icon: CalendarClock, permission: "RUN_SCANS" },
  { href: "/admin/metadata", label: "Metadata", icon: Sparkles, permission: "EDIT_METADATA" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "MANAGE_USERS" },
  { href: "/admin/logs", label: "Activity log", icon: ScrollText, permission: "VIEW_AUDIT_LOGS" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "ACCESS_ADMIN" },
];

export function visibleSections(user: User | null | undefined): Section[] {
  if (!canSeeDashboard(user)) {
    return [];
  }
  return SECTIONS.filter((section) => !section.permission || can(user, section.permission));
}
