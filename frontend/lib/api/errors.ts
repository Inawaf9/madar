export class ApiError extends Error {
  readonly status: number;
  readonly backendMessage?: string;
  constructor(message: string, status: number, backendMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.backendMessage = backendMessage;
  }
}

export function getUserFacingApiError(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) return "rateLimited";
  if (error instanceof ApiError && error.status === 502) return "providerUnavailable";
  if (error instanceof ApiError && error.status === 402) return "accessRequired";
  if (error instanceof ApiError && error.status === 409) return "requestConflict";
  if (error instanceof ApiError && error.status === 403) return "environmentUnavailable";
  if (error instanceof ApiError && error.status === 400) return "invalidRequest";
  if (error instanceof ApiError && error.status === 503) return "backendUnavailable";
  if (error instanceof ApiError && error.status === 404) return "featureUnavailable";
  if (error instanceof ApiError && error.status === 408) return "requestTimedOut";
  return "requestFailed";
}
