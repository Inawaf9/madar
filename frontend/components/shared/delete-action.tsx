"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "./error-state";

export function DeleteAction({
  onDelete,
  label,
  title,
  description,
  confirmLabel,
}: {
  onDelete: () => Promise<unknown>;
  label?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
}) {
  const t = useTranslations("Workspace");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setOpen(value);
          setError(undefined);
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        {label ?? t("remove")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t("deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <ErrorState error={error} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
          <Button
            disabled={pending}
            variant="destructive"
            onClick={async () => {
              setPending(true);
              setError(undefined);
              try {
                await onDelete();
                setOpen(false);
              } catch (e) {
                setError(e);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? t("working") : (confirmLabel ?? t("confirm"))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
