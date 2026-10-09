import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { systemApi } from "@/lib/api";
import { ServerSettingsForm } from "./server-settings-form";
import type { ServerSettings } from "@/lib/types";

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  systemApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

const settings: ServerSettings = {
  server_name: "Ludexis",
  provider_order: ["VNDB", "IGDB"],
  available_providers: ["VNDB", "IGDB", "Steam"],
  igdb_client_id: "",
  igdb_configured: false,
  igdb_from_env: false,
  steamgriddb_configured: false,
  steamgriddb_from_env: false,
};

describe("ServerSettingsForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves the name, provider order and credentials", async () => {
    vi.mocked(systemApi.getSettings).mockResolvedValue(settings);
    vi.mocked(systemApi.updateSettings).mockImplementation(async (data) => ({ ...settings, ...data } as ServerSettings));
    render(<ServerSettingsForm />);

    fireEvent.change(await screen.findByLabelText("Server name"), { target: { value: "Basement Shelf" } });
    fireEvent.click(screen.getByRole("button", { name: "Move IGDB up" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Steam" }));
    fireEvent.change(screen.getByLabelText("IGDB (Twitch) client ID"), { target: { value: "client-1" } });
    fireEvent.change(screen.getByLabelText("IGDB (Twitch) client secret"), { target: { value: "secret-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() =>
      expect(systemApi.updateSettings).toHaveBeenCalledWith({
        server_name: "Basement Shelf",
        provider_order: ["IGDB", "VNDB", "Steam"],
        igdb_client_id: "client-1",
        igdb_client_secret: "secret-1",
      }),
    );
  });

  it("leaves credentials alone when they come from the environment", async () => {
    vi.mocked(systemApi.getSettings).mockResolvedValue({ ...settings, igdb_from_env: true, igdb_client_id: "env-id" });
    vi.mocked(systemApi.updateSettings).mockResolvedValue(settings);
    render(<ServerSettingsForm />);

    expect(await screen.findByLabelText("IGDB (Twitch) client ID")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() =>
      expect(systemApi.updateSettings).toHaveBeenCalledWith({
        server_name: "Ludexis",
        provider_order: ["VNDB", "IGDB"],
      }),
    );
  });
});
