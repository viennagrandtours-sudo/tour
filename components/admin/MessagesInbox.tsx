"use client";

import { useMemo, useState } from "react";
import {
  deleteMessageAction,
  setMessageStatusAction,
} from "@/lib/admin/content-actions";
import {
  MESSAGE_STATUSES,
  type AdminMessage,
  type MessageStatus,
} from "@/lib/admin/types";
import { formatTimestamp } from "@/lib/admin/format";
import { ConfirmButton, Feedback, useActionFeedback } from "./client-ui";
import { EmptyState, MessageBadge } from "./ui";
import { btnTiny, select } from "./styles";

export function MessagesInbox({
  messages,
  readOnly,
}: {
  messages: AdminMessage[];
  readOnly: boolean;
}) {
  const [filter, setFilter] = useState<"all" | MessageStatus>("all");

  const visible = useMemo(
    () => (filter === "all" ? messages : messages.filter((m) => m.status === filter)),
    [messages, filter],
  );

  const counts = useMemo(() => {
    const base: Record<MessageStatus, number> = { new: 0, read: 0, handled: 0 };
    for (const m of messages) if (m.status in base) base[m.status] += 1;
    return base;
  }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-navy/10 bg-cream-soft px-4 py-3">
        <p className="text-sm text-navy/70">
          <strong className="font-semibold text-navy">{counts.new}</strong> new ·{" "}
          {counts.read} read · {counts.handled} handled
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-navy/70" htmlFor="message-filter">
            Show
          </label>
          <select
            id="message-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className={`${select} w-auto py-1.5 text-xs`}
          >
            <option value="all">Everything</option>
            {MESSAGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status[0].toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={messages.length === 0 ? "Inbox is empty" : "Nothing in this view"}
          hint={
            messages.length === 0
              ? "Messages sent through the website contact form land here."
              : "Switch the filter to see other messages."
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((message) => (
            <MessageCard key={message.id} message={message} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MessageCard({ message, readOnly }: { message: AdminMessage; readOnly: boolean }) {
  const { pending, result, run } = useActionFeedback();

  return (
    <li
      className={`rounded-md border bg-cream-soft p-4 ${
        message.status === "new" ? "border-gold/60" : "border-navy/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-semibold text-navy">{message.name}</span>
            <MessageBadge status={message.status} />
          </div>
          <a
            href={`mailto:${message.email}`}
            className="text-sm text-navy/70 underline-offset-2 hover:text-navy hover:underline"
          >
            {message.email}
          </a>
          <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-navy/85">
            {message.message}
          </p>
          <p className="mt-2 text-xs text-navy/70">
            Received {formatTimestamp(message.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <a href={`mailto:${message.email}`} className={btnTiny}>
            Reply
          </a>
          {message.status !== "read" ? (
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending}
              onClick={() => run(() => setMessageStatusAction(message.id, "read"))}
            >
              Mark read
            </button>
          ) : null}
          {message.status !== "handled" ? (
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending}
              onClick={() => run(() => setMessageStatusAction(message.id, "handled"))}
            >
              Mark handled
            </button>
          ) : (
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending}
              onClick={() => run(() => setMessageStatusAction(message.id, "new"))}
            >
              Reopen
            </button>
          )}
          <ConfirmButton
            label="Delete"
            title="Delete this message?"
            body={`The message from ${message.name} will be removed permanently. Reply first if you still need their address.`}
            confirmLabel="Delete"
            onConfirm={() => deleteMessageAction(message.id)}
            className="inline-flex items-center rounded border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
            disabled={readOnly}
          />
        </div>
      </div>

      <Feedback result={result} />
    </li>
  );
}
