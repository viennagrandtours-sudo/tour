import { fetchTestimonials } from "@/lib/admin/data";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { DataNotice, PageHeading } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await fetchTestimonials();

  return (
    <>
      <PageHeading
        title="Testimonials"
        description="Reviews shown on the public site. Only published ones appear; featured ones lead the carousel. Rows marked “Sample” came with the starter schema — delete them once you have real reviews."
      />

      <DataNotice source={testimonials.source} error={testimonials.error} />

      <TestimonialsManager
        testimonials={testimonials.data}
        readOnly={testimonials.source === "demo"}
      />
    </>
  );
}
