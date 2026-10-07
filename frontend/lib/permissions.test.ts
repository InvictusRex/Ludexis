import { describe, expect, it } from "vitest";
import type { User } from "@/lib/types";
import { can, canSeeDashboard } from "./permissions";

const user = (overrides: Partial<User> = {}): User => ({
  id: "u1",
  username: "reader",
  email: "reader@example.com",
  is_active: true,
  is_superuser: false,
  roles: [],
  ...overrides,
});

describe("can", () => {
  it("grants a permission held through a role", () => {
    const editor = user({
      roles: [{ id: "r1", name: "Moderator", permissions: [{ id: "p1", name: "EDIT_METADATA" }] }],
    });
    expect(can(editor, "EDIT_METADATA")).toBe(true);
    expect(can(editor, "MANAGE_USERS")).toBe(false);
    // Editing metadata is not administration: the dashboard stays hidden.
    expect(canSeeDashboard(editor)).toBe(false);
    const admin = user({
      roles: [{ id: "r3", name: "Administrator", permissions: [{ id: "p3", name: "ACCESS_ADMIN" }] }],
    });
    expect(canSeeDashboard(admin)).toBe(true);
  });

  it("grants everything to superusers and nothing without a user", () => {
    expect(can(user({ is_superuser: true }), "MANAGE_USERS")).toBe(true);
    expect(can(null, "VIEW_LIBRARY")).toBe(false);
  });

  it("keeps read-only users out of the dashboard", () => {
    const reader = user({
      roles: [{ id: "r2", name: "ReadOnly", permissions: [{ id: "p2", name: "VIEW_LIBRARY" }] }],
    });
    expect(canSeeDashboard(reader)).toBe(false);
  });
});
