// src/features/player-panel/tabs/TimelineTab.tsx
import React from "react";
import type { DeltaGreenAgent } from "../../../models/DeltaGreenAgent";
import type { AgentEvent } from "../../../models/events" 

type TimelineTabProps = {
  agent: DeltaGreenAgent;
  updateAgent: (updated: DeltaGreenAgent) => void;
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ agent, updateAgent }) => {
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [selectedEvent, setSelectedEvent] = React.useState<AgentEvent | null>(null);

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

  return(
    <div className="bb-details-tab">

    <div className="bb-timeline-controls">
        <input
        type="text"
        className="bb-input"
        placeholder="Search timeline..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        />

        <select
        className="bb-select"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        >
            <option value="all">
                All ({agent.events.length})
            </option>
        {categories.map(category => (
            <option key={category} value={category}>
            {category}
            </option>
        ))}
        </select>
    </div>

    <table className="bb-weapons-table">
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
            style={{ cursor: "pointer" }}
            >
            <td>
                {new Date(event.timestamp).toLocaleString()}
            </td>

            <td>
                {event.category}
            </td>

            <td>
                {event.summary}
            </td>

            <td>
                {event.description
                ? "📝"
                : "—"}
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

    </div>
  );

};