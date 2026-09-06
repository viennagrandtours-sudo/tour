import { MAX_GUESTS, MIN_GUESTS, SITE, SITE_URL, TOURS, isFillIn } from "@/lib/tours";

export default function JsonLd() {
  const address = {
    "@type": "PostalAddress" as const,
    ...(isFillIn(SITE.address.street) ? {} : { streetAddress: SITE.address.street }),
    addressLocality: "Vienna",
    addressCountry: "AT",
  };

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        name: SITE.name,
        description:
          "Private guided city tours of Vienna in a dark green vintage-style electric vehicle, with narration in English, German, Spanish, Italian, Arabic, Chinese, Portuguese and Turkish.",
        url: SITE_URL,
        ...(isFillIn(SITE.phone) ? {} : { telephone: SITE.phone }),
        email: SITE.email,
        address,
        geo: {
          "@type": "GeoCoordinates",
          latitude: 48.2035,
          longitude: 16.3692,
        },
        areaServed: "Vienna, Austria",
        availableLanguage: ["en", "de", "es", "it", "ar", "zh", "pt", "tr"],
        priceRange: "€25–€69",
        image: `${SITE_URL}/logo.png`,
        makesOffer: TOURS.map((tour) => ({
          "@type": "Offer",
          name: `${tour.id} private Vienna tour (${tour.durationMinutes} min)`,
          price: tour.pricePerPerson,
          priceCurrency: "EUR",
          eligibleQuantity: {
            "@type": "QuantitativeValue",
            minValue: MIN_GUESTS,
            // Online bookings allow multi-car parties; each car seats tour.maxGuests.
            maxValue: MAX_GUESTS,
            unitText: "guests",
          },
        })),
      },
      {
        "@type": "TouristAttraction",
        name: `${SITE.name} — Vienna City Tours`,
        description:
          "Sightseeing tours of Vienna’s Ringstrasse and Old Town in a quiet electric vehicle styled after a vintage car.",
        touristType: "Sightseeing",
        isAccessibleForFree: false,
        address,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
