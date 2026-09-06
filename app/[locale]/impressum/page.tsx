import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import { SITE, isFillIn } from "@/lib/tours";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("impressumTitle"),
    description: t("impressumDescription"),
    alternates: localeAlternates(locale, "/impressum"),
  };
}

export default async function ImpressumPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const label = (key: string) => t(`impressum.labels.${key}`);

  return (
    <>
      <PageHero title={t("impressumTitle")} subtitle={t("reviewNotice")} />
      <article className="section-shell max-w-3xl space-y-8 py-14 font-sans text-sm leading-relaxed text-navy/80">
        <p className="text-base text-navy/70">{t("impressum.intro")}</p>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.companyHeading")}</h2>
          <p className="mt-3">
            {SITE.legal.companyName}
            <br />
            {label("legalForm")}: {SITE.legal.legalForm}
            <br />
            {SITE.address.street}
            <br />
            {SITE.address.city}
            <br />
            {SITE.address.country}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.ownerHeading")}</h2>
          <p className="mt-3">{SITE.legal.owner}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.contactHeading")}</h2>
          <p className="mt-3">
            {!isFillIn(SITE.phone) && (
              <>
                {label("phone")}: {SITE.phone}
                <br />
              </>
            )}
            {label("email")}: {SITE.email}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.registerHeading")}</h2>
          <p className="mt-3">
            {label("gisa")}: {SITE.legal.gisa}
            <br />
            {label("firmenbuch")}: {SITE.legal.firmenbuch}
            {!isFillIn(SITE.legal.court) && SITE.legal.court !== "—" && (
              <>
                <br />
                {label("court")}: {SITE.legal.court}
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.vatHeading")}</h2>
          <p className="mt-3">
            {SITE.legal.vatExempt || !SITE.legal.uid || isFillIn(SITE.legal.uid)
              ? t("impressum.vatExemptBody")
              : `${label("uid")}: ${SITE.legal.uid}`}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.chamberHeading")}</h2>
          <p className="mt-3">{SITE.legal.chamber}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.tradeHeading")}</h2>
          <p className="mt-3">{t("impressum.tradeBody")}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.authorityHeading")}</h2>
          <p className="mt-3">{t("impressum.authorityBody", { district: SITE.legal.tradeAuthorityDistrict })}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.purposeHeading")}</h2>
          <p className="mt-3">{t("impressum.purposeBody")}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.odrHeading")}</h2>
          <p className="mt-3">
            {t("impressum.odrBody")}{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="underline decoration-gold underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.contentHeading")}</h2>
          <p className="mt-3">{t("impressum.contentBody")}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-navy">{t("impressum.copyrightHeading")}</h2>
          <p className="mt-3">{t("impressum.copyrightBody")}</p>
        </section>

        <p className="border-t border-navy/10 pt-6 text-xs text-navy/70">{t("lastUpdated")}</p>
      </article>
    </>
  );
}
