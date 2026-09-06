import { fetchMessages } from "@/lib/admin/data";
import { MessagesInbox } from "@/components/admin/MessagesInbox";
import { DataNotice, PageHeading } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await fetchMessages();

  return (
    <>
      <PageHeading
        title="Inbox"
        description="Messages from the website contact form. Mark them read or handled so you can see what still needs a reply."
      />

      <DataNotice source={messages.source} error={messages.error} />

      <MessagesInbox messages={messages.data} readOnly={messages.source === "demo"} />
    </>
  );
}
