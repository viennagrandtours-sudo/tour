import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import { SITE } from "@/lib/tours";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

type Section = { title: string; body: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("datenschutzTitle"),
    description: t("datenschutzDescription"),
    alternates: localeAlternates(locale, "/datenschutz"),
  };
}

export default async function DatenschutzPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const raw = t.raw("datenschutz.sections");
  const sections = (Array.isArray(raw) ? raw : []) as Section[];

  return (
    <>
      <PageHero title={t("datenschutzTitle")} subtitle={t("reviewNotice")} />
      <article className="section-shell max-w-3xl space-y-8 py-14 font-sans text-sm leading-relaxed text-navy/80">
        <p className="text-base text-navy/70">{t("datenschutz.intro")}</p>

        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl text-navy">{s.title}</h2>
            <p className="mt-3">{s.body}</p>
            {i === 0 && (
              <p className="mt-3">
                {SITE.legal.companyName}
                <br />
                {SITE.address.street}, {SITE.address.city}
                <br />
                <a
                  href={`mailto:${SITE.email}`}
                  className="underline decoration-gold underline-offset-2"
                >
                  {SITE.email}
                </a>
              </p>
            )}
          </section>
        ))}

        <p className="border-t border-navy/10 pt-6 text-xs text-navy/50">{t("lastUpdated")}</p>
      </article>
    </>
  );
}
