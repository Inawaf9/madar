import { ApiError } from "./errors";

const isMissingRecord = (error: unknown, message: string) =>
  error instanceof ApiError && error.status === 400 && error.backendMessage === message;

/** Only the exact documented missing-record error becomes an empty result. */
export async function optionalRecord<T>(
  request: Promise<T>,
  emptyMessage: string,
): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (isMissingRecord(error, emptyMessage)) return null;
    throw error;
  }
}
export async function emptyListOnMissing<T>(
  request: Promise<T[]>,
  emptyMessage: string,
): Promise<T[]> {
  try {
    return await request;
  } catch (error) {
    if (isMissingRecord(error, emptyMessage)) return [];
    throw error;
  }
}
