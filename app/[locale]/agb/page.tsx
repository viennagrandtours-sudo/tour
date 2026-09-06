import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

type Section = { title: string; body: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("agbTitle"),
    description: t("agbDescription"),
    alternates: localeAlternates(locale, "/agb"),
  };
}

export default async function AgbPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const raw = t.raw("agb.sections");
  const sections = (Array.isArray(raw) ? raw : []) as Section[];

  return (
    <>
      <PageHero title={t("agbTitle")} subtitle={t("reviewNotice")} />
      <article className="section-shell max-w-3xl space-y-8 py-14">
        <p className="font-sans text-base leading-relaxed text-navy/70">{t("agb.intro")}</p>
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl text-navy">{s.title}</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-navy/75">{s.body}</p>
          </section>
        ))}
        <p className="border-t border-navy/10 pt-6 font-sans text-xs text-navy/50">
          {t("lastUpdated")}
        </p>
      </article>
    </>
  );
}
