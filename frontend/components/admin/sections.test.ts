import { describe, expect, it } from "vitest";
import type { User } from "@/lib/types";
import { visibleSections } from "./sections";

const withPermissions = (...names: string[]): User => ({
  id: "u",
  username: "u",
  email: "u@example.com",
  is_active: true,
  is_superuser: false,
  roles: [{ id: "r", name: "Role", permissions: names.map((name) => ({ id: name, name })) }],
});

const labels = (user: User | null) => visibleSections(user).map((section) => section.label);

describe("visibleSections", () => {
  it("shows every section to a superuser", () => {
    expect(labels({ ...withPermissions(), is_superuser: true })).toEqual([
      "Overview",
      "Libraries",
      "Tasks",
      "Metadata",
      "Users",
      "Activity log",
      "Settings",
    ]);
  });

  it("shows an administrator only the sections their role allows, always with Overview", () => {
    expect(labels(withPermissions("ACCESS_ADMIN", "VIEW_AUDIT_LOGS"))).toEqual([
      "Overview",
      "Libraries",
      "Activity log",
      "Settings",
    ]);
  });

  it("shows nothing to anyone who is not an administrator", () => {
    expect(labels(withPermissions("EDIT_METADATA", "RUN_SCANS"))).toEqual([]);
    expect(labels(withPermissions("VIEW_LIBRARY"))).toEqual([]);
    expect(labels(null)).toEqual([]);
  });
});
