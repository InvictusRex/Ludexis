import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { collectionsApi, usersApi } from "@/lib/api";
import type { Collection, User } from "@/lib/types";
import { UserAccessDialog } from "./user-dialogs";

vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("@/lib/api", () => ({
  collectionsApi: { getAll: vi.fn() },
  usersApi: { update: vi.fn() },
}));

const user = { id: "u1", username: "guest", email: "g@example.com", is_active: true, is_superuser: false } as User;
const collections = [
  { id: "c1", name: "Shelf", entry_ids: ["a"] },
  { id: "c2", name: "Backlog", entry_ids: [] },
] as unknown as Collection[];

describe("UserAccessDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves restricted access and the unchecked collections as blocked", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue(collections);
    vi.mocked(usersApi.update).mockResolvedValue(user);
    const onSaved = vi.fn();
    render(<UserAccessDialog user={user} onOpenChange={vi.fn()} onSaved={onSaved} />);

    expect(collectionsApi.getAll).toHaveBeenCalledWith(0, 500, undefined, true);
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Backlog" }));
    fireEvent.click(screen.getByRole("button", { name: "Save access" }));

    await waitFor(() =>
      expect(usersApi.update).toHaveBeenCalledWith("u1", { allow_restricted: true, blocked_collection_ids: ["c2"] }),
    );
    expect(onSaved).toHaveBeenCalled();
  });
});
