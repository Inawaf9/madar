import { getUserId } from "@/lib/user-id";
import { z } from "zod";
import { apiRequest } from "./client";
import { ApiError } from "./errors";

const text = z.string().nullable();
const number = z.number().finite().nullable();
const integer = z.number().int().nullable();
/** All 35 public PropertyDTO fields. No invented action or internal *En fields. */
export const chatPropertySchema = z.object({
  externalId: text,
  source: text,
  sourceName: text,
  title: text,
  listingUrl: text,
  city: text,
  neighborhood: text,
  propertyType: text,
  listingType: text,
  price: integer,
  bedrooms: integer,
  areaSqm: number,
  latitude: number,
  longitude: number,
  image: text,
  updatedAt: text,
  distanceKm: number,
  originalTitle: text,
  cityName: text,
  description: text,
  titleAr: text,
  titleEn: text,
  neighborhoodAr: text,
  neighborhoodNameEn: text,
  cityNameAr: text,
  cityNameEn: text,
  descriptionAr: text,
  descriptionTextEn: text,
  bathrooms: integer,
  pricePeriod: text,
  // Java Long may exceed JS precision. Never display a rounded advertised amount.
  postedPrice: z
    .number()
    .finite()
    .nullable()
    .transform((value) =>
      value !== null && !Number.isSafeInteger(value) ? null : value,
    ),
  postedPricePeriod: text,
  sourceUrl: text,
  images: z.array(z.string()).nullable(),
  neighborhoodId: integer,
});
export const chatReplySchema = z.object({
  reply: z.string().trim().min(1),
  properties: z.array(chatPropertySchema).max(10),
});
export type ChatProperty = z.infer<typeof chatPropertySchema>;
export type ChatReply = z.infer<typeof chatReplySchema>;
export type ChatErrorCode =
  "invalid-message" | "invalid-user" | "invalid-response" | "busy";
export class ChatError extends Error {
  constructor(readonly code: ChatErrorCode) {
    super(code);
    this.name = "ChatError";
  }
}
const activeUsers = new Set<number>();
async function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const userId = Number(getUserId());
  if (!Number.isInteger(userId) || userId < 1 || userId > 2147483647)
    throw new ChatError("invalid-user");
  if (activeUsers.has(userId)) throw new ChatError("busy");
  activeUsers.add(userId);
  try {
    return await work();
  } finally {
    activeUsers.delete(userId);
  }
}

/** Uses the session-protected BFF. No retries or unsupported fields. */
export async function sendChatMessage(
  message: string,
  signal?: AbortSignal,
): Promise<ChatReply> {
  const request = chatSchema.safeParse({ message });
  if (!request.success) throw new ChatError("invalid-message");
  return exclusive(async () => {
    const response = await apiRequest<unknown>(`/api/v1/ai/chat`, {
      method: "POST",
      body: request.data,
      signal,
    });
    const parsed = chatReplySchema.safeParse(response);
    if (!parsed.success) throw new ChatError("invalid-response");
    return parsed.data;
  });
}
export async function clearChatConversation(signal?: AbortSignal) {
  return exclusive(async () => {
    const response = await apiRequest<unknown>(`/api/v1/ai/chat`, {
      method: "DELETE",
      signal,
    });
    const parsed = z.object({ message: z.literal("Chat cleared") }).safeParse(response);
    if (!parsed.success) throw new ChatError("invalid-response");
    return parsed.data;
  });
}
export function chatErrorText(error: unknown, ar: boolean): string {
  if (error instanceof ChatError) {
    if (error.code === "invalid-message")
      return ar
        ? "اكتب رسالة من 1 إلى 500 حرف."
        : "Enter a message of 1 to 500 characters.";
    if (error.code === "invalid-user")
      return ar ? "سجّل الدخول أولًا." : "Sign in first.";
    if (error.code === "busy")
      return ar
        ? "عندك رسالة قيد الإرسال. انتظر ردها قبل ترسل رسالة ثانية."
        : "A message is already being sent. Wait for the reply before sending another.";
    return ar
      ? "استجابة المحادثة غير مكتملة. قد تكون الرسالة وصلت؛ لا تُعد إرسالها تلقائيًا."
      : "The chat response was incomplete. The message may have been received; do not automatically resend it.";
  }
  if (error instanceof ApiError) {
    if (error.status === 401)
      return ar
        ? "انتهت الجلسة. سجّل الدخول مجددًا."
        : "Your session has expired. Sign in again.";
    if (error.status === 403)
      return ar
        ? "ليس لديك صلاحية للوصول إلى هذه المحادثة."
        : "You do not have permission to access this conversation.";
    if (error.backendMessage === "User not found")
      return ar
        ? "ما لقينا حسابك. سجّل دخولك من جديد."
        : "Your account could not be found. Sign in again.";
    if (error.backendMessage === "AI is unavailable right now")
      return ar
        ? "خدمة الذكاء الاصطناعي غير متاحة حاليًا. احتفظنا برسالتك."
        : "AI is currently unavailable. Your message has been kept.";
    if (error.status === 408 || error.status >= 500)
      return ar
        ? "تعذّر تأكيد الرد من الخادم. قد تكون رسالتك وصلت؛ الإرسال مجددًا قد يكررها."
        : "The server response could not be confirmed. Your message may have arrived; resending may duplicate it.";
    if (error.status === 429)
      return ar
        ? "بلغت الخدمة حد الطلبات. حاول لاحقًا."
        : "The service request limit was reached. Try later.";
  }
  return ar
    ? "تعذّر إكمال الطلب. احتفظنا بالنص؛ يمكنك مراجعته وإرساله مجددًا."
    : "The request could not be completed. Your text was kept for review and manual resubmission.";
}

export const chatSchema = z.object({ message: z.string().trim().min(1).max(500) });
