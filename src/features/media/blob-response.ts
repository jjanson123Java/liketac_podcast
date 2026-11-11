export function readableBlobStatus(status: number) {
  return status === 200 || status === 206;
}

export function mediaResponseStatus(requestedRange: boolean, blobStatus: number) {
  return requestedRange && blobStatus === 200 ? 206 : blobStatus;
}
