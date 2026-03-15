// src/features/player-panel/tabs/NotesTab.tsx
import React from "react";
import { nanoid } from "nanoid";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";

type NotesTabProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

type AgentNote = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

const EMPTY_NOTES: AgentNote[] = [];

export const NotesTab: React.FC<NotesTabProps> = ({ agent, updateAgent }) => {
  const notesRaw = (agent.system as any).notes;
  const notes: AgentNote[] = Array.isArray(notesRaw) ? notesRaw : EMPTY_NOTES;

  const initialActiveId = React.useMemo(() => {
    if (notes.length === 0) return null;
    const sorted = [...notes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return sorted[0].id;
  }, [notes]);

  const [activeId, setActiveId] = React.useState<string | null>(initialActiveId);
  React.useEffect(() => {
    if (activeId && notes.some(n => n.id === activeId)) return;
    setActiveId(initialActiveId);
  }, [activeId, initialActiveId, notes]);

  const activeNote = notes.find(n => n.id === activeId) ?? null;

  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const isProgrammaticEditRef = React.useRef(false);
  const shouldScrollToHitRef = React.useRef(false);

  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = activeNote?.content ?? "";
    }
  }, [activeNote?.id]);

  const updateNotes = (next: AgentNote[]) => {
    updateAgent({
      ...agent,
      system: {
        ...agent.system,
        notes: next,
      } as any,
    });
  };

  const addNote = () => {
    const note: AgentNote = {
      id: nanoid(),
      title: "New Note",
      content: "",
      updatedAt: Date.now(),
    };
    updateNotes([note, ...notes]);
    setActiveId(note.id);
  };

  const removeNote = (id: string) => {
    const next = notes.filter(n => n.id !== id);
    updateNotes(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? null);
    }
  };

  const updateActiveNote = (partial: Partial<AgentNote>) => {
    if (!activeNote) return;
    updateNotes(
      notes.map(n =>
        n.id === activeNote.id ? { ...n, ...partial, updatedAt: Date.now() } : n
      )
    );
  };

  const saveTimeout = React.useRef<number | null>(null);
  const handleInput = () => {
    if (!editorRef.current || !activeNote) return;

    // Ignore DOM mutations caused by search highlighting/clearing
    if (isProgrammaticEditRef.current) return;

    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);

    saveTimeout.current = window.setTimeout(() => {
      if (!editorRef.current) return;

      // Strip highlight markup before persisting
      const raw = editorRef.current.innerHTML;

      const cleaned = raw.replace(
        /<span class="bb-notes-hit">([\s\S]*?)<\/span>/g,
        "$1"
      );

      // Avoid unnecessary updates
      if (cleaned === (activeNote?.content ?? "")) return;

      updateActiveNote({ content: cleaned });
    }, 250);
  };
  // ------------------------
  // SEARCH
  // ------------------------
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  type SearchHit = {
    noteId: string;
    noteTitle: string;
    offset: number;
    preview: string;
  };

  function stripHtml(html: string): string {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  }

  function findAllOccurrences(haystack: string, needle: string): number[] {
    if (!needle) return [];
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    const out: number[] = [];
    let start = 0;
    while (true) {
        const idx = h.indexOf(n, start);
        if (idx === -1) break;
        out.push(idx);
        start = idx + Math.max(1, n.length);
    }
    return out;
  }

  function makePreview(text: string, at: number, len: number, radius = 28) {
    const s = Math.max(0, at - radius);
    const e = Math.min(text.length, at + len + radius);
    const prefix = s > 0 ? "…" : "";
    const suffix = e < text.length ? "…" : "";
    return prefix + text.slice(s, e) + suffix;
  }
  
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [hitIndex, setHitIndex] = React.useState(-1);

  // Recompute hits whenever query or notes change
  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits((prev) => (prev.length ? [] : prev));
      setHitIndex((prev) => (prev !== -1 ? -1 : prev));
      return;
    }

    const nextHits: SearchHit[] = [];
    const seen = new Set<string>();

    const orderedNotes = [...notes].sort(
        (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    );

    for (const n of orderedNotes) {
        const bodyText = stripHtml(n.content || "");
        const occ = findAllOccurrences(bodyText, q);

        for (const offset of occ) {
        const key = `${n.id}|${offset}`;
        if (seen.has(key)) continue;
        seen.add(key);

        nextHits.push({
            noteId: n.id,
            noteTitle: n.title || "Untitled",
            offset,
            preview: makePreview(bodyText, offset, q.length),
        });
        }
    }

    nextHits.sort((a, b) => {
        if (a.noteId !== b.noteId) {
        const ai = orderedNotes.findIndex(n => n.id === a.noteId);
        const bi = orderedNotes.findIndex(n => n.id === b.noteId);
        return ai - bi;
        }
        return a.offset - b.offset;
    });

    setHits(nextHits);

    setHitIndex(-1);
  }, [query, notes]);

  const clearExistingHighlight = React.useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    isProgrammaticEditRef.current = true;
    try {
      const markers = el.querySelectorAll("span.bb-notes-hit");
      markers.forEach((m) => {
        const parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent ?? ""), m);
        parent.normalize();
      });
    } finally {
      // release on next frame to avoid input events during mutation settling
      requestAnimationFrame(() => {
        isProgrammaticEditRef.current = false;
      });
    }
  }, []);

  const highlightCurrentHit = React.useCallback(
    (needle: string, shouldScroll: boolean) => {
      const el = editorRef.current;
      if (!el) return;

      const q = needle.trim();
      if (!q) return;

      isProgrammaticEditRef.current = true;
      try {
        clearExistingHighlight();

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const lowerNeedle = q.toLowerCase();

        let node: Node | null = null;
        while ((node = walker.nextNode())) {
          const text = node.nodeValue ?? "";
          const idx = text.toLowerCase().indexOf(lowerNeedle);
          if (idx === -1) continue;

          const before = text.slice(0, idx);
          const match = text.slice(idx, idx + q.length);
          const after = text.slice(idx + q.length);

          const frag = document.createDocumentFragment();
          if (before) frag.appendChild(document.createTextNode(before));

          const span = document.createElement("span");
          span.className = "bb-notes-hit";
          span.textContent = match;
          frag.appendChild(span);

          if (after) frag.appendChild(document.createTextNode(after));

          const parent = node.parentNode;
          if (!parent) return;
          parent.replaceChild(frag, node);

          // ✅ Only scroll when user explicitly navigates results
          if (shouldScroll) {
            scrollHitIntoEditor(el, span);
          }

          return;
        }
      } finally {
        requestAnimationFrame(() => {
          isProgrammaticEditRef.current = false;
        });
      }
    },
    [clearExistingHighlight]
  );

  function scrollHitIntoEditor(container: HTMLElement, hitEl: HTMLElement) {
    // Ensure the container is the scrolling element
    const cTop = container.scrollTop;
    const cRect = container.getBoundingClientRect();
    const hRect = hitEl.getBoundingClientRect();

    // Hit position relative to container scroll area
    const topWithin = (hRect.top - cRect.top) + cTop;
    const centerTarget = topWithin - (container.clientHeight / 2) + (hRect.height / 2);

    // Clamp
    const max = Math.max(0, container.scrollHeight - container.clientHeight);
    const next = Math.max(0, Math.min(max, centerTarget));

    container.scrollTop = next;
  }

  React.useEffect(() => {
    const q = query.trim();
    if (!q || hitIndex < 0 || hitIndex >= hits.length) {
      clearExistingHighlight();
      return;
    }

    const current = hits[hitIndex];

    if (current.noteId !== activeId) {
      setActiveId(current.noteId);
      return;
    }

    requestAnimationFrame(() => {
      const shouldScroll = shouldScrollToHitRef.current;
      shouldScrollToHitRef.current = false; // reset immediately
      highlightCurrentHit(q, shouldScroll);
    });
  }, [hitIndex, hits, query, activeId, highlightCurrentHit, clearExistingHighlight]);

  const goPrev = () => {
    if (!hits.length) return;
    setHitIndex(i => (i <= 0 ? hits.length - 1 : i - 1));
  };
  const goNext = () => {
    if (!hits.length) return;
    setHitIndex(i => (i >= hits.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="bb-notes-tab">
      {/* Search bar */}
      <div className="bb-notes-tab__search">
        <div className="bb-notes-searchbar">
            <input
            ref={searchInputRef}
            className="bb-input"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (hits.length) {
                    shouldScrollToHitRef.current = true;
                    setHitIndex(i => (i < 0 ? 0 : (i >= hits.length - 1 ? 0 : i + 1)));
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setQuery("");
                }
            }}
            />

            <div className="bb-notes-searchbar__meta">
            <span className="bb-text-muted">
                {hits.length ? `${Math.max(0, hitIndex + 1)}/${hits.length}` : "0/0"}
            </span>

            <button
                type="button"
                className="bb-btn bb-btn--ghost bb-btn--small"
                onClick={() => {
                  if (!hits.length) return;
                  shouldScrollToHitRef.current = true;
                  setHitIndex(i => (i < 0 ? hits.length - 1 : (i <= 0 ? hits.length - 1 : i - 1)));
                  searchInputRef.current?.focus();
                }}
                disabled={!hits.length}
                title="Previous result"
            >
                ◀
            </button>

            <button
                type="button"
                className="bb-btn bb-btn--ghost bb-btn--small"
                onClick={() => {
                  if (!hits.length) return;
                  shouldScrollToHitRef.current = true;
                  setHitIndex(i => (i < 0 ? 0 : (i >= hits.length - 1 ? 0 : i + 1)));
                  searchInputRef.current?.focus();
                }}
                disabled={!hits.length}
                title="Next result"
            >
                ▶
            </button>
            </div>
        </div>

        {hits.length > 0 && hitIndex >= 0 && (
            <div className="bb-text-muted" style={{ marginTop: 4, fontSize: "0.75rem" }}>
            {hits[hitIndex].noteTitle}: {hits[hitIndex].preview}
            </div>
        )}
        </div>

      <div className="bb-notes-tab__body">
        {/* Notes list */}
        <aside className="bb-notes-list">
          <ul className="bb-notes-list__ul">
            {notes.map((note) => (
              <li
                key={note.id}
                className={
                  "bb-notes-list__item" +
                  (note.id === activeId ? " bb-notes-list__item--active" : "")
                }
                onClick={() => setActiveId(note.id)}
                title={note.title}
              >
                <span className="bb-notes-list__title">{note.title || "Untitled"}</span>

                {/* Remove button on same row */}
                <button
                  type="button"
                  className="bb-btn bb-btn--ghost bb-btn--small bb-notes-list__remove bb-button--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(note.id);
                  }}
                  title="Remove note"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="bb-btn bb-btn--ghost bb-notes-list__add"
            onClick={addNote}
            title="Add note"
          >
            +
          </button>
        </aside>

        {/* Editor */}
        <section className="bb-notes-editor">
          {activeNote ? (
            <>
              <input
                className="bb-input bb-notes-editor__title"
                value={activeNote.title}
                onChange={(e) => updateActiveNote({ title: e.target.value })}
              />

              <div className="bb-notes-toolbar">
                {["bold", "italic", "underline", "strikeThrough"].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    className="bb-btn bb-btn--ghost bb-btn--small"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand(cmd);
                    }}
                    title={cmd}
                  >
                    {cmd === "bold"
                      ? "B"
                      : cmd === "italic"
                      ? "I"
                      : cmd === "underline"
                      ? "U"
                      : "S"}
                  </button>
                ))}

                <button
                  type="button"
                  className="bb-btn bb-btn--ghost bb-btn--small"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand("insertUnorderedList");
                  }}
                  title="Bulleted list"
                >
                  •
                </button>

                <button
                  type="button"
                  className="bb-btn bb-btn--ghost bb-btn--small"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand("insertOrderedList");
                  }}
                  title="Numbered list"
                >
                  1.
                </button>

                <input
                  type="color"
                  title="Text color"
                  onChange={(e) =>
                    document.execCommand("foreColor", false, e.target.value)
                  }
                  style={{ width: 34, height: 24, padding: 0, border: "none" }}
                />
              </div>

              <div
                ref={editorRef}
                className="bb-notes-editor__content"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
              />
            </>
          ) : (
            <p className="bb-text-muted">No note selected.</p>
          )}
        </section>
      </div>
    </div>
  );
};