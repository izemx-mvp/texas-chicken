import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SkeletonRows, EmptyState } from "./bits";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  value?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: string[];
  match: (row: T, value: string) => boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchFields,
  loading = false,
  pageSize: initialPageSize = 10,
  emptyTitle = "Aucun élément",
  toolbar,
  onRowClick,
  selectable = false,
  bulkActions,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: FilterDef<T>[];
  searchFields: (row: T) => string;
  loading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  bulkActions?: (ids: string[], clear: () => void) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let out = rows;
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => searchFields(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = active[f.key];
      if (v && v !== "Tous") out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        out = [...out].sort((a, b) => {
          const va = col.value!(a);
          const vb = col.value!(b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, active, sort, filters, columns, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const hasFilters = query || Object.values(active).some((v) => v && v !== "Tous");

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative min-w-[210px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher..."
            className="h-9 border-border bg-secondary/40 pl-9"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={active[f.key] ?? "Tous"}
            onChange={(e) => {
              setActive((a) => ({ ...a, [f.key]: e.target.value }));
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-secondary/40 px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="Tous">{f.label} : tous</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setActive({});
              setPage(1);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Réinitialiser
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>

      {selectable && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-brand/10 px-3 py-2 text-sm">
          <span className="font-semibold">{selected.length} sélectionné(s)</span>
          {bulkActions?.(selected, () => setSelected([]))}
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : pageRows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={hasFilters ? "Aucun résultat" : emptyTitle}
              description={
                hasFilters
                  ? "Aucun élément ne correspond à votre recherche ou à vos filtres."
                  : "Créez un premier élément pour commencer."
              }
            />
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {selectable && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      className="accent-[oklch(0.62_0.23_28)]"
                      checked={pageRows.every((r) => selected.includes(r.id))}
                      onChange={(e) =>
                        setSelected(e.target.checked ? pageRows.map((r) => r.id) : [])
                      }
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-3 py-3 font-semibold", c.className)}>
                    {c.sortable ? (
                      <button
                        className="inline-flex items-center gap-1 transition-colors hover:text-gold"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key
                              ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                              : { key: c.key, dir: "asc" },
                          )
                        }
                      >
                        {c.header}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "animate-rise border-b border-border/60 transition-colors hover:bg-secondary/40",
                    onRowClick && "cursor-pointer",
                  )}
                  style={{ animationDelay: `${i * 22}ms` }}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.23_28)]"
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked ? [...s, row.id] : s.filter((x) => x !== row.id),
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-3 align-middle", c.className)}>
                      {c.render ? c.render(row) : String(c.value?.(row) ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <div>
          {filtered.length} élément(s) — page {current} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border border-border bg-secondary/40 px-2 text-foreground"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="h-4 w-4" /> Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= totalPages}
            onClick={() => setPage(current + 1)}
          >
            Suivant <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
