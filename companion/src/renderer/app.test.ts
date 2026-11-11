// @vitest-environment jsdom
import { fireEvent, screen, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderCompanion, statusChanged, wireCompanion } from "./app";
import type { CompanionWindowAPI } from "../shared/window-api";

const baseStatus = {
  connection: "connected" as const,
  obsVersion: "33.0.0",
  profile: "LikeTACLive",
  sceneCollection: "LikeTACLive Studio",
  programScene: "00 - Standby",
  recording: false,
  recordingStartedAt: null,
  availableScenes: ["00 - Standby", "10 - Host Only", "50 - Host Presentation", "70 - Audio Only"] as const,
};

beforeEach(() => { document.body.innerHTML = '<main id="app"></main>'; });

describe("Like TAC Companion workspace", () => {
  test("guides OBS launch while disconnected and never displays a supplied secret", () => {
    renderCompanion(document.querySelector("#app")!, { ...baseStatus, connection: "disconnected" }, new Date());
    expect(screen.getByRole("button", { name: "Launch OBS" })).toBeVisible();
    expect(screen.getByLabelText("OBS WebSocket password")).toHaveAttribute("type", "password");
    expect(document.body).not.toHaveTextContent("super-secret");
    expect(screen.getByRole("button", { name: "Disconnect from OBS" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close OBS" })).toBeDisabled();
  });

  test("offers explicit disconnect and close controls while connected", async () => {
    const api = {
      disconnectOBS: vi.fn(async () => undefined), closeOBS: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => baseStatus), onStatus: vi.fn(() => () => undefined),
    } as unknown as CompanionWindowAPI;
    renderCompanion(document.querySelector("#app")!, baseStatus, new Date());
    wireCompanion(document.querySelector("#app")!, api);

    fireEvent.click(screen.getByRole("button", { name: "Disconnect from OBS" }));
    await vi.waitFor(() => expect(api.disconnectOBS).toHaveBeenCalledOnce());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Close OBS" }));
    await vi.waitFor(() => expect(api.closeOBS).toHaveBeenCalledOnce());
  });

  test("blocks recording and explains a wrong profile or missing device", () => {
    renderCompanion(document.querySelector("#app")!, {
      ...baseStatus,
      profile: "Untitled",
      readiness: [{ id: "deskpro", label: "Cisco DeskPro Camera", ready: false, reason: "Not connected in Windows." }],
    }, new Date());
    expect(screen.getByText(/Required profile: LikeTACLive/)).toBeVisible();
    expect(screen.getByText("Not connected in Windows.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Live Recording" })).toBeDisabled();
  });

  test("shows actual LIVE state, elapsed time, scene choices, and disabled test recording", () => {
    renderCompanion(document.querySelector("#app")!, {
      ...baseStatus,
      recording: true,
      recordingStartedAt: "2026-10-28T22:00:00.000Z",
      readiness: [{ id: "mic", label: "LCS USB Audio", ready: true, reason: null }],
    }, new Date("2026-10-28T22:01:05.000Z"));
    expect(screen.getByText("LIVE")).toBeVisible();
    expect(screen.getByText("01:05")).toBeVisible();
    expect(screen.getByText("OBS - LikeTACLive")).toHaveClass("recordingPulse");
    expect(screen.getByRole("button", { name: "Test Recording - coming in a later phase" })).toBeDisabled();
    expect(screen.queryByAltText("Like TAC banner preview")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Like TAC opening reel preview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50 - Host Presentation" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Live Recording" })).toBeDisabled();
  });

  test("shows a connection error and retry action", () => {
    renderCompanion(document.querySelector("#app")!, { ...baseStatus, connection: "authentication-failed", error: "OBS rejected the WebSocket password." }, new Date());
    expect(screen.getByText("OBS rejected the WebSocket password.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Connect to OBS" })).toBeVisible();
  });

  test("puts full-screen in the program toolbar, shows the Escape hint, and clears the password after connect", async () => {
    const api = {
      connect: vi.fn(async () => undefined), setFullScreen: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => baseStatus), onStatus: vi.fn(() => () => undefined),
    } as unknown as CompanionWindowAPI;
    renderCompanion(document.querySelector("#app")!, { ...baseStatus, connection: "disconnected" }, new Date());
    wireCompanion(document.querySelector("#app")!, api);
    const password = screen.getByLabelText("OBS WebSocket password") as HTMLInputElement;
    fireEvent.input(password, { target: { value: "super-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect to OBS" }));
    await vi.waitFor(() => expect(api.connect).toHaveBeenCalledWith("super-secret"));
    expect(password.value).toBe("");
    const toolbar = screen.getByRole("toolbar", { name: "Program controls" });
    fireEvent.click(within(toolbar).getByRole("button", { name: "Full screen" }));
    expect(api.setFullScreen).toHaveBeenCalledWith(true);
    expect(screen.getByRole("status")).toHaveTextContent("Press Esc to exit full screen");
    expect(screen.queryByRole("button", { name: "Exit full screen" })).not.toBeInTheDocument();
  });

  test("renders an OBS program preview surface", () => {
    renderCompanion(document.querySelector("#app")!, baseStatus, new Date());
    const preview = screen.getByLabelText("OBS program preview");
    expect(preview).toBeVisible();
    expect(preview.closest(".preview")?.querySelector(".previewStatus")).toBeNull();
    expect(screen.getByText("Current scene: 00 - Standby")).toHaveClass("programStatus");
    const toolbar = screen.getByRole("toolbar", { name: "Program controls" });
    expect(within(toolbar).getByRole("button", { name: "50 - Host Presentation" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Start Live Recording" })).toBeVisible();
    expect(within(toolbar).getByRole("button", { name: "Full screen" })).toBeVisible();
  });

  test("does not rebuild stable controls during timer polling", () => {
    expect(statusChanged(baseStatus, { ...baseStatus })).toBe(false);
    expect(statusChanged(baseStatus, { ...baseStatus, recording: true })).toBe(true);
  });

  test("disables readiness checks until OBS is connected", () => {
    renderCompanion(document.querySelector("#app")!, { ...baseStatus, connection: "disconnected" }, new Date());
    expect(screen.getByRole("button", { name: "Run readiness checks" })).toBeDisabled();
  });

  test("shows action failures instead of silently swallowing them", async () => {
    const api = {
      refresh: vi.fn(async () => { throw new Error("Readiness check failed."); }),
      getStatus: vi.fn(async () => baseStatus), onStatus: vi.fn(() => () => undefined),
    } as unknown as CompanionWindowAPI;
    renderCompanion(document.querySelector("#app")!, baseStatus, new Date());
    wireCompanion(document.querySelector("#app")!, api);

    fireEvent.click(screen.getByRole("button", { name: "Run readiness checks" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Readiness check failed.");
  });

  test("shows upload progress and never renders the handoff secret", async () => {
    const api = { startMediaUpload: vi.fn(async () => undefined) } as unknown as CompanionWindowAPI;
    renderCompanion(document.querySelector("#app")!, {
      ...baseStatus,
      mediaUpload: { phase: "idle", preparationProgress: 0, fullProgress: 0, previewProgress: 0, sourceName: null, error: null },
    }, new Date());
    wireCompanion(document.querySelector("#app")!, api);
    expect(screen.getByRole("heading", { name: "Publish episode" })).toBeVisible();
    expect(document.body).not.toHaveTextContent("abcdefghijklmnopqrstuvwxyzABCDEFGH123456");
    fireEvent.click(screen.getByRole("button", { name: "Choose completed episode" }));
    await vi.waitFor(() => expect(api.startMediaUpload).toHaveBeenCalledOnce());
  });
});
