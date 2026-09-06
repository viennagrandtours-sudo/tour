"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { btnDanger, btnGhost, btnPrimary } from "./styles";
import type { ActionResult } from "@/lib/admin/types";

/** Interactive primitives shared by the admin screens. */

export function useActionFeedback() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = useCallback((action: () => Promise<ActionResult>) => {
    startTransition(async () => {
      try {
        setResult(await action());
      } catch (error) {
        setResult({
          ok: false,
          message: `Unexpected error: ${(error as Error).message}`,
        });
      }
    });
  }, []);

  return { pending, result, setResult, run };
}

export function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={`mt-2 rounded border px-3 py-2 text-sm ${
        result.ok
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      {result.message}
    </p>
  );
}

/**
 * Native <dialog> so we inherit the browser's focus trap, Esc-to-close and
 * inert backdrop rather than reimplementing them.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClose = () => onClose();
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="admin-dialog-title"
      className={`w-[calc(100vw-2rem)] ${width} rounded-md border border-navy/15 bg-cream-soft p-0 text-navy shadow-lift backdrop:bg-navy-ink/50`}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-navy/10 px-4 py-3">
        <h2 id="admin-dialog-title" className="font-display text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xl leading-none text-navy/70 transition hover:bg-navy/5 hover:text-navy"
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
    </dialog>
  );
}

/** Button that opens a confirm dialog before running a destructive action. */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel = "Confirm",
  onConfirm,
  className,
  disabled,
}: {
  label: ReactNode;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => Promise<ActionResult>;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { pending, result, run } = useActionFeedback();

  return (
    <>
      <button
        type="button"
        className={className ?? btnDanger}
        onClick={() => setOpen(true)}
        disabled={disabled || pending}
      >
        {pending ? "Working…" : label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} width="max-w-md">
        <p className="text-sm text-navy/75">{body}</p>
        <Feedback result={result} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={btnDanger}
            disabled={pending}
            onClick={() => {
              run(async () => {
                const res = await onConfirm();
                if (res.ok) setOpen(false);
                return res;
              });
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </Dialog>
    </>
  );
}

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: ReactNode;
  pending: boolean;
  className?: string;
}) {
  return (
    <button type="submit" className={className ?? btnPrimary} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
