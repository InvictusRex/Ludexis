import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TAXONOMY_FIELDS,
  TaxonomyFormDialog,
} from "./taxonomy-form-dialog";
import { toastError } from "@/lib/toast";

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const renderDialog = (
  onSubmit = vi.fn().mockResolvedValue(undefined),
  onOpenChange = vi.fn(),
) => {
  render(
    <TaxonomyFormDialog
      open
      onOpenChange={onOpenChange}
      title="Edit Tag"
      description="Update details"
      fields={TAXONOMY_FIELDS.tags}
      initial={{ name: "retro", description: "Old games", color: "#FF9900" }}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, onOpenChange };
};

describe("TaxonomyFormDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("prefills fields from the initial values", () => {
    renderDialog();

    expect(screen.getByLabelText(/name/i)).toHaveValue("retro");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Old games");
    expect(screen.getByLabelText(/color/i)).toHaveValue("#FF9900");
  });

  it("submits trimmed values, sends null for cleared fields and closes", async () => {
    const user = userEvent.setup();
    const { onSubmit, onOpenChange } = renderDialog();

    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), "  classic  ");
    await user.clear(screen.getByLabelText(/color/i));
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "classic",
      description: "Old games",
      color: null,
    });
  });

  it("requires a name", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.clear(screen.getByLabelText(/name/i));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and reports errors when submit fails", async () => {
    const user = userEvent.setup();
    const error = new Error("Tag name already exists");
    const { onOpenChange } = renderDialog(vi.fn().mockRejectedValue(error));

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(error, "Failed to save"),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText("Failed to save")).toBeInTheDocument();
  });
});
