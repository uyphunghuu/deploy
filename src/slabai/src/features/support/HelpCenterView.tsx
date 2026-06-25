"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { copy } from "@/lib/copy";
import { getHelpCategories } from "@/services/mockRepository";

interface Category {
  id: string;
  title: string;
  count: number;
}

export function HelpCenterView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelpCategories().then((items) => {
      setCategories(items);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => categories.filter((category) => category.title.toLowerCase().includes(query.toLowerCase())),
    [categories, query]
  );

  if (loading) return <SkeletonBlock height="420px" />;

  return (
    <section aria-labelledby="help-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="help-title">
            Help Center
          </h2>
          <p>Tìm câu trả lời về account, training plan và integrations mock.</p>
        </div>
      </div>
      <div className="content-grid">
        <Card className="form-stack">
          <Field label="Search topics" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trợ giúp" type="search" value={query} />
          {filtered.length === 0 ? (
            <EmptyState title="Không có kết quả" description="Thử từ khóa khác hoặc xóa tìm kiếm." />
          ) : (
            <div className="content-grid">
              {filtered.map((category) => (
                <button className="option-card" key={category.id} type="button">
                  <Search size={18} />
                  <strong>{category.title}</strong>
                  <span className="muted">{category.count} bài viết</span>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card className="activity-card">
          <h2>Trust & safety</h2>
          <p className="muted">{copy.trust}</p>
          <Button type="button" variant="ghost">Mở bài viết demo</Button>
        </Card>
      </div>
    </section>
  );
}
