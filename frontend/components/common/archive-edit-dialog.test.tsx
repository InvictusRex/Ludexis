import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchiveEditDialog } from "./archive-edit-dialog";
import { archiveApi } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import type { ArchiveEntry } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  archiveApi: {
    update: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "entry-1",
  title: "Game One",
  file_path: "/path/one",
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "VERIFIED",
  related_entry_ids: [],
  tag_ids: [],
  developer_ids: [],
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const renderDialog = (
  entry: ArchiveEntry,
  onOpenChange = vi.fn(),
  onSaved = vi.fn(),
) =>
  render(
    <ArchiveEditDialog
      entry={entry}
      open
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />,
  );

describe("ArchiveEditDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders editable core fields prefilled from the entry", () => {
    renderDialog(
      makeEntry({
        description: "A retro space adventure",
        version: "1.0.0",
        engine: "Custom",
        release_date: "1997-10-31",
        storage_device: "NAS-01",
      }),
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue("Game One");
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      "A retro space adventure",
    );
    expect(screen.getByLabelText(/release date/i)).toHaveValue("1997-10-31");
    expect(screen.getByLabelText(/version/i)).toHaveValue("1.0.0");
    expect(screen.getByLabelText(/engine/i)).toHaveValue("Custom");
    expect(screen.getByLabelText(/storage device/i)).toHaveValue("NAS-01");
  });

  it("calls archiveApi.update with the edited payload and closes on success", async () => {
    const entry = makeEntry();
    const updated = { ...entry, title: "Updated Title" };
    vi.mocked(archiveApi.update).mockResolvedValue(updated);
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    const user = userEvent.setup();

    renderDialog(entry, onOpenChange, onSaved);

    const title = screen.getByLabelText(/title/i);
    await user.clear(title);
    await user.type(title, "Updated Title");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(archiveApi.update).toHaveBeenCalledWith(
      "entry-1",
      expect.objectContaining({
        title: "Updated Title",
        description: undefined,
        file_path: "/path/one",
        metadata_status: "MATCHED",
        verification_status: "VERIFIED",
        tag_ids: [],
        developer_ids: [],
        publisher_ids: [],
        collection_ids: [],
      }),
    );
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated Title" }),
      ),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Archive entry updated");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows an error toast and stays open when the update fails", async () => {
    const entry = makeEntry();
    vi.mocked(archiveApi.update).mockRejectedValue(
      new Error("Server error"),
    );
    const onOpenChange = vi.fn();
    const onSaved = vi.fn();
    const user = userEvent.setup();

    renderDialog(entry, onOpenChange, onSaved);

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to update archive entry",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText(/failed to update archive entry/i)).toBeInTheDocument();
  });

  it("blocks saving when the title is empty", async () => {
    const entry = makeEntry();
    const user = userEvent.setup();

    renderDialog(entry);

    const title = screen.getByLabelText(/title/i);
    await user.clear(title);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(archiveApi.update).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it("cancels without saving via onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderDialog(makeEntry(), onOpenChange);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(archiveApi.update).not.toHaveBeenCalled();
  });
});
