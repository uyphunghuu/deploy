"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { useLanguage } from "@/lib/LanguageContext";

export function HelpCenterView() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const categories = useMemo(() => [
    { id: "getting-started", title: t("help.category.gettingStarted"), count: 5 }
  ], [t]);

  const filtered = useMemo(
    () => categories.filter((category) => category.title.toLowerCase().includes(query.toLowerCase())),
    [categories, query]
  );

  return (
    <section aria-labelledby="help-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="help-title">
            {t("help.title")}
          </h2>
          <p>{t("help.subtitle")}</p>
        </div>
      </div>
      <div className="content-grid">
        <Card className="form-stack">
          <Field label={t("help.searchLabel")} onChange={(event) => setQuery(event.target.value)} placeholder={t("help.searchPlaceholder")} type="search" value={query} />
          {filtered.length === 0 ? (
            <EmptyState title={t("help.noResults")} description={t("help.noResultsDesc")} />
          ) : (
            <div className="content-grid">
              {filtered.map((category) => (
                <button className="option-card" key={category.id} type="button">
                  <Search size={18} />
                  <strong>{category.title}</strong>
                  <span className="muted">{t("help.articlesCount").replace("{count}", String(category.count))}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card className="activity-card">
          <h2>{t("help.trustTitle")}</h2>
          <p className="muted">{t("help.trustDesc")}</p>
          <Button type="button" variant="ghost">{t("help.openArticle")}</Button>
        </Card>
      </div>
    </section>
  );
}
