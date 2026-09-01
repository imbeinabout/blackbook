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
            >
            <td>
                {new Date(event.timestamp).toLocaleString()}
            </td>

            <td>
                {formatCategory(event.category)}
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