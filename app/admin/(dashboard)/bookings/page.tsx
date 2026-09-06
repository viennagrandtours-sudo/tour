import { fetchBookings, fetchResolvedTours } from "@/lib/admin/data";
import { BookingsManager } from "@/components/admin/BookingsManager";
import { DataNotice, PageHeading } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, tours] = await Promise.all([fetchBookings(), fetchResolvedTours()]);

  return (
    <>
      <PageHeading
        title="Bookings"
        description="Every reservation, from the website and from the phone. Filter, edit, change status, or export what you are looking at."
      />

      <DataNotice source={bookings.source} error={bookings.error} />

      <BookingsManager
        bookings={bookings.data}
        tours={tours.data}
        readOnly={bookings.source === "demo"}
      />
    </>
  );
}
