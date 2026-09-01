"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  filterLanguages,
  type LanguageDefinition,
} from "@/lib/i18n/languages-registry";

type LanguageSelectorProps = {
  id: string;
  value: string;
  options: readonly LanguageDefinition[];
  disabled?: boolean;
  /** When true, planned languages are listed but not selectable. */
  onlyReadySelectable?: boolean;
  searchPlaceholder?: string;
  comingSoonLabel?: string;
  onChange: (englishName: string) => void;
};

function optionLabel(lang: LanguageDefinition): string {
  if (lang.nativeName === lang.englishName) return lang.englishName;
  return `${lang.nativeName} — ${lang.englishName}`;
}

function initialHighlightIndex(
  list: readonly LanguageDefinition[],
  selectedValue: string,
  onlyReadySelectable: boolean
): number {
  const selectedIdx = list.findIndex((l) => l.englishName === selectedValue);
  if (selectedIdx >= 0) {
    const lang = list[selectedIdx]!;
    if (!onlyReadySelectable || lang.uiStatus === "ready") return selectedIdx;
  }
  const firstReady = list.findIndex(
    (l) => !onlyReadySelectable || l.uiStatus === "ready"
  );
  return firstReady >= 0 ? firstReady : 0;
}

export function LanguageSelector({
  id,
  value,
  options,
  disabled = false,
  onlyReadySelectable = false,
  searchPlaceholder = "Search languages…",
  comingSoonLabel = "Coming soon",
  onChange,
}: LanguageSelectorProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** Highlight index is only updated from user events (open / search / keys / hover). */
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () => options.find((o) => o.englishName === value) ?? options[0],
    [options, value]
  );

  const filtered = useMemo(
    () => filterLanguages(options, query),
    [options, query]
  );

  const selectableIndexes = useMemo(() => {
    return filtered
      .map((lang, i) => ({ lang, i }))
      .filter(
        ({ lang }) => !onlyReadySelectable || lang.uiStatus === "ready"
      )
      .map(({ i }) => i);
  }, [filtered, onlyReadySelectable]);

  const resetClosed = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlight(0);
  }, []);

  const openPicker = useCallback(() => {
    if (disabled) return;
    setQuery("");
    setHighlight(initialHighlightIndex(options, value, onlyReadySelectable));
    setOpen(true);
  }, [disabled, options, value, onlyReadySelectable]);

  // Subscribe to outside clicks only. setState runs in the event handler, not in the effect body.
  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        resetClosed();
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, resetClosed]);

  // DOM focus only — no React state updates.
  useLayoutEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  function isSelectable(lang: LanguageDefinition): boolean {
    return !onlyReadySelectable || lang.uiStatus === "ready";
  }

  function pick(lang: LanguageDefinition) {
    if (!isSelectable(lang) || disabled) return;
    onChange(lang.englishName);
    resetClosed();
  }

  function moveHighlight(delta: number) {
    if (!selectableIndexes.length) return;
    const currentPos = selectableIndexes.indexOf(highlight);
    const nextPos =
      currentPos < 0
        ? 0
        : (currentPos + delta + selectableIndexes.length) %
          selectableIndexes.length;
    setHighlight(selectableIndexes[nextPos]!);
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  function onListKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      resetClosed();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const lang = filtered[highlight];
      if (lang) pick(lang);
    }
  }

  function onSearchChange(nextQuery: string) {
    const nextFiltered = filterLanguages(options, nextQuery);
    setQuery(nextQuery);
    setHighlight(
      initialHighlightIndex(nextFiltered, value, onlyReadySelectable)
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          if (open) resetClosed();
          else openPicker();
        }}
        onKeyDown={onTriggerKeyDown}
        className="field-input flex w-full items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate">
          {selected ? optionLabel(selected) : value}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10"
          onKeyDown={onListKeyDown}
        >
          <div className="flex items-center gap-2 border-b border-border/80 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              aria-autocomplete="list"
              aria-controls={listId}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="max-h-64 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">No matches</li>
            ) : (
              filtered.map((lang, index) => {
                const selectable = isSelectable(lang);
                const active = lang.englishName === value;
                const highlighted = index === highlight;
                return (
                  <li key={lang.code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      disabled={!selectable}
                      onMouseEnter={() => selectable && setHighlight(index)}
                      onClick={() => pick(lang)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition-colors ${
                        highlighted && selectable
                          ? "bg-primary-soft text-foreground"
                          : "text-foreground"
                      } ${
                        selectable
                          ? "hover:bg-surface-secondary"
                          : "cursor-not-allowed opacity-55"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate font-medium leading-snug"
                          lang={lang.bcp47}
                          dir={lang.dir}
                        >
                          {lang.nativeName}
                        </span>
                        {lang.nativeName !== lang.englishName ? (
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {lang.englishName}
                          </span>
                        ) : null}
                      </span>
                      {!selectable ? (
                        <span className="shrink-0 rounded-md border border-border/80 bg-surface-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted">
                          {comingSoonLabel}
                        </span>
                      ) : active ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden
                        />
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
