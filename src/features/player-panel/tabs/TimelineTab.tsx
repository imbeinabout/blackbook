// src/features/player-panel/tabs/TimelineTab.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { AgentEvent } from "../../../models/events" 
import { addAgentEvent, deleteAgentEvent, updateEventDescription } from "../../../lib/eventLogger";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useLayoutMode } from "../../../hooks/useLayoutMode";

type TimelineTabProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ agent, updateAgent }) => {
  const isMobile = useLayoutMode() === "mobile";
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [selectedEvent, setSelectedEvent] = React.useState<AgentEvent | null>(null);
  const [eventNote, setEventNote] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = React.useState(false);
  const [markerType, setMarkerType] = React.useState<
    "session" | "operation" | "campaign"
    >("session");
  const [markerName, setMarkerName] = React.useState("");
    
  React.useEffect(() => {
    setEventNote(selectedEvent?.description ?? "");
  }, [selectedEvent]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    for (const event of agent.events) {
        counts[event.category] =
        (counts[event.category] ?? 0) + 1;
    }

    return counts;
  }, [agent.events]);
  
  const filteredEvents = React.useMemo(() => {
    return [...agent.events]
        .filter((event) => {
        if (categoryFilter === "all") {
            return true;
        }

        return event.category === categoryFilter;
        })
        .filter((event) => {
        const searchText = search.toLowerCase().trim();

        if (!searchText) {
            return true;
        }

        return (
            event.summary.toLowerCase().includes(searchText) ||
            (event.description ?? "")
            .toLowerCase()
            .includes(searchText)
        );
        })
        .sort(
        (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );
    }, [agent.events, search, categoryFilter]);

    const categories = React.useMemo(() => {
        const values = new Set(agent.events.map(e => e.category));

        return ["all", ...Array.from(values).sort()];
    }, [agent.events]);

    const handleCloseModal = () => {
        if (!selectedEvent) return;
        if (
            eventNote === (selectedEvent.description ?? "")
        ) {
            setSelectedEvent(null);
            return;
        }

        const copy: DeltaGreenAgent =
            JSON.parse(JSON.stringify(agent));

        updateEventDescription(
            copy,
            selectedEvent.id,
            eventNote
        );

        updateAgent(copy);
        setEventNote("");

        setSelectedEvent(null);
    };

    const handleCloseMarkerDialog = () => {
        setIsMarkerDialogOpen(false);
        setMarkerName("");
        setMarkerType("session");
        setEventNote("");
    }

    const handleCreateMarker = () => {
        const name = markerName.trim();

        if (!name) {
            return;
        }

        const copy: DeltaGreenAgent =
            JSON.parse(JSON.stringify(agent));

        addAgentEvent(copy, {
            category: "marker",
            action: markerType,
            source: "manual",

            summary:
            `=== ${markerType.toUpperCase()}: ${name} ===`,
            description: eventNote.trim() || undefined,

            metadata: {
                markerType,
                markerName: name,
            },
        });

        updateAgent(copy);

        setMarkerName("");
        setMarkerType("session");
        setEventNote("");
        setIsMarkerDialogOpen(false);
    };

  return(
    <div className="bb-details-tab">

    <div className="bb-timeline-toolbar">
        <select
        className="bb-select bb-timeline-toolbar__filter"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        >
        {categories.map(category => (
            <option key={category} value={category}>
                {category === "all"
                    ? `All Events (${agent.events.length})`
                    : `${formatCategory(category)} (${categoryCounts[category] ?? 0})`}
            </option>
        ))}
        </select>
        
        <input
            type="text"
            className="bb-input bb-timeline-toolbar__search"
            placeholder="Search timeline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />

        <button
            type="button"
            className="bb-button bb-button--small bb-button--ghost bb-timeline-toolbar__add"
            onClick={() => setIsMarkerDialogOpen(true)}
        >
            {isMobile ? "Add Marker" : "+"}
        </button>
    </div>

    <table className="bb-weapons-table bb-timeline-table">
        <thead>
        <tr>
            <th>Date/Time</th>
            <th>Category</th>
            <th>Summary</th>
            <th>Note</th>
            <th>Details</th>
        </tr>
        </thead>

        <tbody>
        {filteredEvents.map(event => (
            <tr
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className={
                event.category === "marker"
                    ? "bb-timeline-row bb-timeline-row--marker"
                    : "bb-timeline-row"
            }
            >
            <td data-label="Date">
                {new Date(event.timestamp).toLocaleString()}
            </td>

            <td data-label="Category">
                {formatCategory(event.category)}
            </td>

            <td data-label="Summary">
                {event.summary}
            </td>

            <td data-label="Note">
                {event.description?.trim() || "—"}
            </td>
            <td>
                <button
                    type="button"
                    className="bb-button bb-button--ghost bb-button--small"
                    onClick={() => setSelectedEvent(event)}
                >
                    Details
                </button>
            </td>
            </tr>
        ))}

        {filteredEvents.length === 0 && (
            <tr>
            <td colSpan={4}>
                No timeline events found.
            </td>
            </tr>
        )}
        </tbody>
    </table>
    {isMarkerDialogOpen && (
        <div className="bb-modal">
          <div className="bb-modal__dialog bb-timeline-modal">
            <div className="bb-modal__header">
                <h3 className="bb-modal__title">
                Add Marker
                </h3>
            </div>
            <div className="bb-modal__body">
                <div className="bb-form-group">
                    <label>Marker Type</label>

                    <select
                    className="bb-select"
                    value={markerType}
                    onChange={(e) =>
                        setMarkerType(
                        e.target.value as
                            | "session"
                            | "operation"
                            | "campaign"
                        )
                    }
                    >
                    <option value="session">Session</option>
                    <option value="operation">Operation</option>
                    <option value="campaign">Campaign</option>
                    </select>
                </div>

                <div className="bb-form-group">
                    <label>Name</label>

                    <input
                    className="bb-input"
                    type="text"
                    value={markerName}
                    onChange={(e) =>
                        setMarkerName(e.target.value)
                    }
                    placeholder={
                        markerType === "session"
                        ? "12"
                        : markerType === "operation"
                        ? "NIGHT FLOORS"
                        : "Impossible Landscapes"
                    }
                    />
                </div>

                <div className="bb-form-group">
                    <label>Notes</label>
                    <textarea
                        className="bb-textarea"
                        rows={5}
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder="Add context or campaign notes..."
                    />
                </div>
            </div>
            <div className="bb-modal__footer">
                <button
                    type="button"
                    className="bb-btn bb-btn--secondary"
                    onClick={handleCloseMarkerDialog}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="bb-btn"
                    onClick={handleCreateMarker}
                    disabled={!markerName.trim()}
                >
                    Create Marker
                </button>
            </div>
          </div>
        </div>
    )}
    {selectedEvent && (
        <div className="bb-modal">
            <div className="bb-modal__dialog bb-timeline-modal">
            <div className="bb-modal__header">
                <h3 className="bb-modal__title">
                Event Details
                </h3>
            </div>

            <div className="bb-modal__body">
                <div className="bb-timeline-event-header">
                    <h2 className="bb-timeline-event-title">
                        {selectedEvent.summary}
                    </h2>

                    <div className="bb-timeline-event-subtitle">
                        {formatCategory(selectedEvent.category)}
                        {" • "}
                        {selectedEvent.source}
                        {" • "}
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                    </div>
                </div>

                <section className="bb-timeline-modal-section">
                    <h3>Notes</h3>

                    <textarea
                        className="bb-textarea"
                        rows={5}
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder="Add context or campaign notes..."
                    />
                </section>

                {(
                    selectedEvent.before !== undefined ||
                    selectedEvent.after !== undefined
                ) && (
                <section className="bb-timeline-modal-section">
                    <h3>Change</h3>

                    <div className="bb-timeline-change-grid">

                        <div>
                            <strong>Before</strong>
                            <pre>
                                {JSON.stringify(
                                    selectedEvent.before,
                                    null,
                                    2
                                )}
                            </pre>
                        </div>

                        <div>
                            <strong>After</strong>
                            <pre>
                                {JSON.stringify(
                                    selectedEvent.after,
                                    null,
                                    2
                                )}
                            </pre>
                        </div>

                    </div>
                </section>
                )}

                <details className="bb-timeline-details">
                    <summary>Technical Details</summary>

                    <div className="bb-timeline-details-content">

                    <div className="bb-timeline-kv">
                        <span>Action</span>
                        <span>{selectedEvent.action}</span>
                    </div>

                    {selectedEvent.relatedEntity && (
                        <div className="bb-timeline-kv">
                            <span>Entity</span>
                            <span>
                                {String(selectedEvent.relatedEntity)}
                            </span>
                        </div>
                    )}

                    {selectedEvent.metadata && (
                        <>
                            <h4>Metadata</h4>

                            <pre className="bb-timeline-json">
                                {JSON.stringify(
                                    selectedEvent.metadata,
                                    null,
                                    2
                                )}
                            </pre>
                        </>
                    )}
                    </div>
                </details>
            </div>

            <div className="bb-modal__footer">
                {selectedEvent.category === "marker" && (
                    <>
                    <button
                        type="button"
                        className="bb-button bb-button--danger"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Delete Marker
                    </button>
                    <ConfirmDialog
                        isOpen={showDeleteConfirm}
                        title="Delete Marker"
                        message={<p>Are you sure you want to delete this marker?</p>}
                        confirmLabel="Delete Marker"
                        danger
                        onCancel={() => setShowDeleteConfirm(false)}
                        onConfirm={ () => {
                            const copy: DeltaGreenAgent = JSON.parse(JSON.stringify(agent));
                            deleteAgentEvent(copy, selectedEvent.id);
                            updateAgent(copy);
                            setShowDeleteConfirm(false);
                            setSelectedEvent(null);
                        }}
                    />
                    </>
                )}
                <button
                    type="button"
                    className="bb-btn"
                    onClick={handleCloseModal}
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );

};

function formatCategory(category: string): string {
  if (category === "all") return "All Events";

  return category
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}