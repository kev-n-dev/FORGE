import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProfessionalCard } from "@/components/search/ProfessionalCard";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { PaginatedResponse, ProfessionalSearchCard } from "@forge/types";
import { Search, SlidersHorizontal, Info } from "lucide-react";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", "professionals", submitted, sortBy, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (submitted) params.set("q", submitted);
      params.set("sortBy", sortBy);
      params.set("page", String(page));
      params.set("pageSize", "20");
      return api.get<PaginatedResponse<ProfessionalSearchCard>>(
        `/search/professionals?${params.toString()}`
      );
    },
    enabled: true,
  });

  const sortOptions: { value: string; label: string }[] = [
    { value: "relevance", label: "Most relevant" },
    { value: "rating", label: "Highest rated" },
    { value: "reviews", label: "Most reviews" },
    { value: "verified_jobs", label: "Most verified jobs" },
    { value: "level", label: "Platform level" },
    { value: "recently_active", label: "Recently active" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal-50 mb-2">Find Professionals</h1>
        <p className="text-charcoal-400">
          Search by trade, skill, or location. Browse evidence and decide who to contact.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
          setPage(1);
        }}
        className="flex gap-3 mb-6"
      >
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Electrician", "Furniture Maker", "Welder"'
            aria-label="Search professionals"
          />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {/* Sort + filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-charcoal-400" aria-hidden="true" />
          <label htmlFor="sort-select" className="text-sm text-charcoal-400">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-copper-500"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Transparency note */}
        <div className="flex items-center gap-1.5 text-xs text-charcoal-500 ml-auto">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Results are sorted by your choice. Sponsored listings are clearly marked.
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-charcoal-400">
          Failed to load results. Please try again.
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-charcoal-500 mb-6" aria-live="polite">
            {data.pagination.total} professional{data.pagination.total !== 1 ? "s" : ""} found
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.pagination.hasPreviousPage}
              >
                Previous
              </Button>
              <span className="text-sm text-charcoal-400">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 space-y-4">
          <Search className="h-12 w-12 text-charcoal-600 mx-auto" aria-hidden="true" />
          <p className="text-charcoal-400 text-lg">No professionals found</p>
          <p className="text-charcoal-500 text-sm">
            Try different keywords or{" "}
            <button
              className="text-copper-400 hover:text-copper-300"
              onClick={() => { setQuery(""); setSubmitted(""); }}
            >
              clear the search
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
