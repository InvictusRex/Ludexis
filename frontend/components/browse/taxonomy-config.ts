import { Building2, Layers, Library, Tag, type LucideIcon } from "lucide-react";
import { developersApi, franchisesApi, publishersApi, tagsApi } from "@/lib/api";
import type { Permission } from "@/lib/permissions";
import type { LibrarySort } from "@/lib/types";
import { TAXONOMY_FIELDS, type TaxonomyField } from "./taxonomy-form-dialog";

/** The fields every browsable kind shares; the rest are optional per kind. */
export type TaxonomyItem = {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  color?: string | null;
  entry_count: number;
};

type TaxonomyValues = { name: string } & Record<string, string | null>;

export interface TaxonomyKind {
  /** Route segment, `/developers`. */
  path: keyof typeof TAXONOMY_FIELDS;
  singular: string;
  plural: string;
  /** The `/search/` and `/library` query parameter; both match on the name. */
  filter: "developer" | "publisher" | "franchise" | "tag";
  icon: LucideIcon;
  permission: Permission;
  fields: readonly TaxonomyField<string>[];
  /** Order of the games on the detail page. */
  sort: LibrarySort;
  /** Short names read better as a cloud of chips than as rows. */
  chips?: boolean;
  api: {
    getAll(offset: number, limit: number): Promise<{ items: TaxonomyItem[]; total: number }>;
    getById(id: string): Promise<TaxonomyItem>;
    create(values: TaxonomyValues): Promise<TaxonomyItem>;
    update(id: string, values: TaxonomyValues): Promise<TaxonomyItem>;
    delete(id: string): Promise<void>;
  };
}

export const TAXONOMIES = {
  developers: {
    path: "developers",
    singular: "developer",
    plural: "developers",
    filter: "developer",
    icon: Building2,
    permission: "EDIT_METADATA",
    fields: TAXONOMY_FIELDS.developers,
    sort: "title",
    api: developersApi,
  },
  publishers: {
    path: "publishers",
    singular: "publisher",
    plural: "publishers",
    filter: "publisher",
    icon: Library,
    permission: "EDIT_METADATA",
    fields: TAXONOMY_FIELDS.publishers,
    sort: "title",
    api: publishersApi,
  },
  franchises: {
    path: "franchises",
    singular: "franchise",
    plural: "franchises",
    filter: "franchise",
    icon: Layers,
    permission: "EDIT_METADATA",
    fields: TAXONOMY_FIELDS.franchises,
    sort: "release_date",
    api: franchisesApi,
  },
  tags: {
    path: "tags",
    singular: "tag",
    plural: "tags",
    filter: "tag",
    icon: Tag,
    permission: "EDIT_METADATA",
    fields: TAXONOMY_FIELDS.tags,
    sort: "title",
    chips: true,
    api: tagsApi,
  },
} satisfies Record<string, TaxonomyKind>;

export type TaxonomyKey = keyof typeof TAXONOMIES;

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Loads every row of a paged list endpoint, a page at a time, until a short page. */
export async function fetchAll<T>(page: (offset: number, limit: number) => Promise<T[]>, size = 500): Promise<T[]> {
  const items: T[] = [];
  for (;;) {
    const batch = await page(items.length, size);
    items.push(...batch);
    if (batch.length < size) {
      return items;
    }
  }
}

export interface LetterGroup<T> {
  letter: string;
  items: T[];
}

export const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

/** A–Z sections by first letter (accents folded, so "Émile" files under E); anything else under "#". */
export function groupByLetter<T extends { name: string }>(items: T[]): LetterGroup<T>[] {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const groups = new Map<string, T[]>();
  for (const item of sorted) {
    const first = item.name.trim().normalize("NFD").charAt(0).toUpperCase();
    const letter = first >= "A" && first <= "Z" ? first : "#";
    const group = groups.get(letter);
    if (group) {
      group.push(item);
    } else {
      groups.set(letter, [item]);
    }
  }
  return LETTERS.filter((letter) => groups.has(letter)).map((letter) => ({ letter, items: groups.get(letter)! }));
}
