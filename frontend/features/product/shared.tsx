"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CircleAlert, LoaderCircle, Plus } from "lucide-react";
import { ApiError, getUserFacingApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

const subscribeReady = () => () => {};
export const businessErrors: Record<string, string> = {
  "Login endpoint missing": "loginGap",
  "Email is already registered": "emailTaken", "Email is already used by another account": "emailTaken",
  "User not found": "userMissing", "User Not Found": "userMissing",
  "This property is already in your saved list": "duplicateSaved", "This comparison already exists": "duplicateComparison",
  "Cannot compare a property with itself": "sameProperty", "User already has a current home": "duplicateHome",
  "User already has housing preferences": "duplicatePreference",
};
export function useErrorText() {
  const t = useTranslations("Workspace");
  return (error: unknown) => t(error instanceof ApiError && error.backendMessage && businessErrors[error.backendMessage] ? businessErrors[error.backendMessage] : getUserFacingApiError(error));
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const t = useTranslations("Workspace"); const message = useErrorText();
  return <Alert variant="destructive"><CircleAlert /><AlertTitle>{t("errorTitle")}</AlertTitle><AlertDescription>{message(error)}{retry ? <Button variant="outline" onClick={retry}>{t("retry")}</Button> : null}</AlertDescription></Alert>;
}
export function Loading() { return <div role="status" className="grid gap-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-44 w-full" /><Skeleton className="h-24 w-full" /></div>; }
export function PageHeading({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl"><p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground">MADAR</p><h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description ? <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}</div>{children}</div>;
}
export function EmptyState({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <Empty className="border"><EmptyHeader><EmptyMedia variant="icon"><Plus /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader>{children}</Empty>;
}
export type FormField = { name: string; type?: string; required?: boolean; hint?: string; min?: number; max?: number; maxLength?: number; autoComplete?: string; options?: { value: string; label: string }[] };
export function DataForm<T extends FieldValues>({ schema, fields, defaults, onSubmit, submitLabel, onCancel }: {
  schema: z.ZodType<T, FieldValues>; fields: FormField[]; defaults?: FieldValues;
  onSubmit: (value: T) => Promise<void>; submitLabel?: string; onCancel?: () => void;
}) {
  const t = useTranslations("Workspace"); const errorText = useErrorText(); const id = useId();
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const [success, setSuccess] = useState(false);
  const { register, control, handleSubmit, formState: { errors, isSubmitting }, setError, clearErrors } = useForm<FieldValues, unknown, T>({ resolver: zodResolver(schema), defaultValues: defaults });
  return <form data-ready={ready} noValidate onChange={() => setSuccess(false)} onSubmit={handleSubmit(async value => { setSuccess(false); clearErrors("root"); try { await onSubmit(value); setSuccess(true); toast.success(t("savedSuccess")); } catch (error) {
    const message = error instanceof ApiError ? error.backendMessage ?? "" : "";
    const serverField = /^(Email is already|Invalid email|Email is required)/.test(message) ? "email"
      : /^Password (must|is required)/.test(message) ? "password"
      : /^Full name is required/.test(message) ? "fullName" : undefined;
    if (serverField && fields.some(field => field.name === serverField)) setError(serverField, { type: "server", message: businessErrors[message] ? errorText(error) : t("invalidField", { field: t(`fields.${serverField}`) }) }, { shouldFocus: true });
    else setError("root", { message: errorText(error) });
  } })} className="flex flex-col gap-6">
    <FieldGroup className="grid gap-5 sm:grid-cols-2">{fields.map(field => {
      const invalid = !!errors[field.name]; const inputId = `${id}-${field.name}`;
      return <Field key={field.name} data-invalid={invalid}>
        <FieldLabel htmlFor={inputId}>{t(`fields.${field.name}`)}{field.required === false ? <span className="text-muted-foreground">{t("optional")}</span> : null}</FieldLabel>
        {field.options ? <Controller control={control} name={field.name} render={({ field: controlled }) => <Select items={field.options} name={controlled.name} value={controlled.value ?? ""} onValueChange={controlled.onChange}><SelectTrigger id={inputId} className="h-11 w-full" onBlur={controlled.onBlur} ref={controlled.ref} aria-invalid={invalid} aria-describedby={`${inputId}-help`}><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{field.options!.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectGroup></SelectContent></Select>} /> : <Input id={inputId} className="h-11" type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} min={field.min} max={field.max} maxLength={field.maxLength} autoComplete={field.autoComplete} aria-invalid={invalid} aria-describedby={`${inputId}-help`} {...register(field.name, { valueAsNumber: field.type === "number" })} />}
        <div id={`${inputId}-help`}>{field.hint ? <FieldDescription>{t(field.hint)}</FieldDescription> : null}{invalid ? <FieldError>{errors[field.name]?.type === "server" ? String(errors[field.name]?.message) : t("invalidField", { field: t(`fields.${field.name}`) })}</FieldError> : null}</div>
      </Field>;
    })}</FieldGroup>
    {errors.root ? <Alert variant="destructive"><AlertDescription>{String(errors.root.message)}</AlertDescription></Alert> : null}
    {success ? <p role="status" className="text-sm text-primary">{t("savedSuccess")}</p> : null}
    <div className="flex flex-wrap gap-2"><Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}{isSubmitting ? t("working") : submitLabel ?? t("save")}</Button>{onCancel ? <Button type="button" size="lg" variant="outline" disabled={isSubmitting} onClick={onCancel}>{t("cancel")}</Button> : null}</div>
  </form>;
}
export function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle>{description ? <CardDescription className="leading-6">{description}</CardDescription> : null}</CardHeader><CardContent>{children}</CardContent></Card>;
}
export function DeleteAction({ onDelete, label }: { onDelete: () => Promise<unknown>; label?: string }) {
  const t = useTranslations("Workspace"); const [open, setOpen] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState<unknown>();
  return <AlertDialog open={open} onOpenChange={value => { if (!pending) { setOpen(value); setError(undefined); } }}><AlertDialogTrigger render={<Button variant="destructive" />}>{label ?? t("remove")}</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle><AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription></AlertDialogHeader>{error ? <ErrorState error={error} /> : null}<AlertDialogFooter><AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel><Button disabled={pending} variant="destructive" onClick={async () => { setPending(true); try { await onDelete(); setOpen(false); } catch (e) { setError(e); } finally { setPending(false); } }}>{pending ? t("working") : t("confirm")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
