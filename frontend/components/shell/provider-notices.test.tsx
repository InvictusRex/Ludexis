import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { metadataApi } from "@/lib/api";
import { toast } from "@/lib/toast";
import { announceNoticesChanged, ProviderNotices } from "./provider-notices";

vi.mock("@/lib/toast", () => ({ toast: { warning: vi.fn() } }));
vi.mock("@/lib/api", () => ({ metadataApi: { notices: vi.fn() } }));

const notice = { provider: "Example", message: "Rate limit reached", expires_at: null };

describe("ProviderNotices", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("toasts a notice once and shows it until it lapses", async () => {
    vi.mocked(metadataApi.notices).mockResolvedValue([notice]);
    render(<ProviderNotices />);
    expect(await screen.findByRole("button", { name: "1 provider warning" })).toBeTruthy();

    await act(async () => announceNoticesChanged());
    await waitFor(() => expect(metadataApi.notices).toHaveBeenCalledTimes(2));
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith("Example: Rate limit reached");

    vi.mocked(metadataApi.notices).mockResolvedValue([]);
    await act(async () => announceNoticesChanged());
    await waitFor(() => expect(screen.queryByRole("button", { name: /provider warning/ })).toBeNull());
  });
});
