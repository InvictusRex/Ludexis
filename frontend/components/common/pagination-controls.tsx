"use client";

import type { MouseEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationControlsProps) {
  if (total <= pageSize) {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= pageCount;

  const handlePrevious = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!isFirstPage) {
      onPageChange(page - 1);
    }
  };

  const handleNext = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!isLastPage) {
      onPageChange(page + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={handlePrevious}
              aria-disabled={isFirstPage || undefined}
              className={cn(isFirstPage && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={handleNext}
              aria-disabled={isLastPage || undefined}
              className={cn(isLastPage && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <span className="text-sm text-muted-foreground">{total} total</span>
    </div>
  );
}
