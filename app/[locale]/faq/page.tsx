import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: localeAlternates(locale, "/faq"),
  };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const rawItems = t.raw("items");
  const items = (Array.isArray(rawItems) ? rawItems : []) as FAQItem[];

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("sub")}
        imageSrc="/gallery/landmark-hofburg.jpg"
        imageAlt={t("title")}
        objectPosition="center 35%"
      />
      <div className="section-shell max-w-3xl py-14">
        <FAQAccordion items={items} />
      </div>
    </>
  );
}
