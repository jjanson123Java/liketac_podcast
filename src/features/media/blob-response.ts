export function readableBlobStatus(status: number) {
  return status === 200 || status === 206;
}
