import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="section-shell flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-24 text-center">
      <p className="section-kicker">{t("code")}</p>
      <h1 className="mt-3 font-display text-display-lg tracking-display text-navy">
        {t("title")}
      </h1>
      <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="mt-5 font-sans text-base leading-relaxed text-navy/75">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          {t("home")}
        </Link>
        <Link href="/book" className="btn-ghost">
          {t("book")}
        </Link>
      </div>
    </div>
  );
}
