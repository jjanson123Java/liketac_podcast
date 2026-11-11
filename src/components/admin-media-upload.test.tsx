import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AdminMediaUpload } from "./admin-media-upload";

const uploadMock = vi.fn();

vi.mock("@vercel/blob/client", () => ({
  upload: (...args: unknown[]) => uploadMock(...args),
}));

beforeEach(() => uploadMock.mockReset());

test("shows upload progress and prevents a duplicate submission", async () => {
  let finishUpload: (() => void) | undefined;
  uploadMock.mockReturnValue(new Promise((resolve) => {
    finishUpload = () => resolve({ url: "https://blob.example/trailer.mp4" });
  }));

  render(<AdminMediaUpload episodeId="episode-1" />);
  fireEvent.change(screen.getByLabelText("Choose file"), {
    target: { files: [new File(["video"], "trailer.mp4", { type: "video/mp4" })] },
  });
  fireEvent.submit(screen.getByRole("button", { name: "Upload private media" }).closest("form")!);

  await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
  uploadMock.mock.calls[0][2].onUploadProgress({ loaded: 50, total: 100, percentage: 50 });

  await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("value", "50"));
  expect(screen.getByRole("button", { name: "Uploading 50%" })).toBeDisabled();

  finishUpload?.();
  await screen.findByText("Upload complete. The media is ready for review.");
});

test("explains when no file reaches the upload handler", async () => {
  render(<AdminMediaUpload episodeId="episode-1" />);
  fireEvent.submit(screen.getByRole("button", { name: "Upload private media" }).closest("form")!);

  expect(await screen.findByText("Choose a media file before uploading.")).toBeInTheDocument();
  expect(uploadMock).not.toHaveBeenCalled();
});
