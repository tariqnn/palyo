"use client";

import React from "react";
import Image from "next/image";
import { Plus, CheckCircle2 } from "lucide-react";

export type CourtPlayer = {
  id: string;
  name: string;
  username?: string;
  avatar_url: string | null;
  team?: string | null;
};

export type SportCourtProps = {
  sport: string;
  format: string;
  capacity: number;
  bookedCount: number;
  players: CourtPlayer[];
  venueName?: string;
};

// Generates balanced (x%, y%) coordinates for any sport & capacity
function getSpotPositions(sport: string, capacity: number): { x: number; y: number; label: string; team: "BLACK" | "WHITE" }[] {
  const normSport = (sport || "").toLowerCase();
  const half = Math.ceil(capacity / 2);
  const spots: { x: number; y: number; label: string; team: "BLACK" | "WHITE" }[] = [];

  if (normSport === "football") {
    // Top Half (BLACK team)
    // 5v5 or 7v7 typical
    const topPositions: { x: number; y: number; label: string }[] = [];
    if (half === 1) {
      topPositions.push({ x: 50, y: 25, label: "Striker" });
    } else if (half === 2) {
      topPositions.push({ x: 50, y: 14, label: "GK" }, { x: 50, y: 36, label: "FW" });
    } else if (half === 5) {
      // 5v5 formation (1-2-1-1)
      topPositions.push(
        { x: 50, y: 12, label: "GK" },
        { x: 28, y: 24, label: "LB" },
        { x: 72, y: 24, label: "RB" },
        { x: 50, y: 35, label: "MF" },
        { x: 50, y: 44, label: "ST" }
      );
    } else if (half === 7) {
      // 7v7 formation (1-2-3-1)
      topPositions.push(
        { x: 50, y: 11, label: "GK" },
        { x: 26, y: 22, label: "CB" },
        { x: 74, y: 22, label: "CB" },
        { x: 20, y: 34, label: "LM" },
        { x: 50, y: 32, label: "CM" },
        { x: 80, y: 34, label: "RM" },
        { x: 50, y: 44, label: "ST" }
      );
    } else {
      // General distribution
      const rows = Math.min(3, Math.ceil(half / 2));
      let idx = 0;
      for (let r = 0; r < rows; r++) {
        const rowCount = r === 0 ? 1 : Math.ceil((half - 1) / (rows - 1));
        const y = 12 + (r / Math.max(1, rows - 1)) * 32;
        for (let c = 0; c < rowCount && idx < half; c++) {
          const x = rowCount === 1 ? 50 : 25 + (c / (rowCount - 1)) * 50;
          topPositions.push({ x, y, label: r === 0 ? "GK" : r === rows - 1 ? "ST" : "MF" });
          idx++;
        }
      }
    }

    topPositions.forEach(p => spots.push({ ...p, team: "BLACK" }));

    // Bottom Half (WHITE team - mirror vertically)
    topPositions.forEach(p => {
      spots.push({
        x: p.x,
        y: 100 - p.y,
        label: p.label,
        team: "WHITE"
      });
    });

  } else if (normSport === "basketball") {
    // Basketball positions
    const topPositions: { x: number; y: number; label: string }[] = [];
    if (half === 3) {
      // 3v3
      topPositions.push(
        { x: 50, y: 15, label: "PG" },
        { x: 28, y: 33, label: "SG" },
        { x: 72, y: 33, label: "C" }
      );
    } else if (half === 5) {
      // 5v5
      topPositions.push(
        { x: 50, y: 14, label: "PG" },
        { x: 24, y: 26, label: "SG" },
        { x: 76, y: 26, label: "SF" },
        { x: 34, y: 39, label: "PF" },
        { x: 66, y: 39, label: "C" }
      );
    } else {
      for (let i = 0; i < half; i++) {
        const x = half === 1 ? 50 : 20 + (i / (half - 1)) * 60;
        const y = 18 + (i % 2) * 18;
        topPositions.push({ x, y, label: `P${i + 1}` });
      }
    }

    topPositions.forEach(p => spots.push({ ...p, team: "BLACK" }));
    topPositions.forEach(p => {
      spots.push({
        x: p.x,
        y: 100 - p.y,
        label: p.label,
        team: "WHITE"
      });
    });

  } else if (normSport === "tennis") {
    // Tennis Singles (2) or Doubles (4)
    if (half <= 1) {
      spots.push(
        { x: 50, y: 22, label: "Side A", team: "BLACK" },
        { x: 50, y: 78, label: "Side B", team: "WHITE" }
      );
    } else {
      // Doubles
      spots.push(
        { x: 35, y: 24, label: "Net / Deuce", team: "BLACK" },
        { x: 65, y: 24, label: "Base / Ad", team: "BLACK" },
        { x: 35, y: 76, label: "Base / Deuce", team: "WHITE" },
        { x: 65, y: 76, label: "Net / Ad", team: "WHITE" }
      );
    }

  } else {
    // Dodgeball / generic arena
    for (let i = 0; i < half; i++) {
      const x = 20 + (i / Math.max(1, half - 1)) * 60;
      const y = 22 + (i % 2) * 16;
      spots.push({ x, y, label: `Line ${i + 1}`, team: "BLACK" });
    }
    for (let i = 0; i < half; i++) {
      const x = 20 + (i / Math.max(1, half - 1)) * 60;
      const y = 78 - (i % 2) * 16;
      spots.push({ x, y, label: `Line ${i + 1}`, team: "WHITE" });
    }
  }

  return spots.slice(0, capacity);
}

export function SportCourt({
  sport,
  format,
  capacity,
  bookedCount,
  players,
  venueName
}: SportCourtProps) {
  const totalJoined = Math.min(capacity, bookedCount);
  const spotsRemaining = Math.max(0, capacity - totalJoined);

  const spotLayout = getSpotPositions(sport, capacity);
  const normSport = (sport || "").toLowerCase();

  const allActivePlayers = players;

  // Progress percentage
  const fillPercentage = Math.round((totalJoined / capacity) * 100);

  return (
    <div className="court-container">
      {/* Header Info & Capacity Meter */}
      <div className="court-header">
        <div className="court-title-group">
          <div className="court-sport-badge">
            <span className="court-sport-icon">
              {normSport === "football" ? "⚽" : normSport === "basketball" ? "🏀" : normSport === "tennis" ? "🎾" : "🏐"}
            </span>
            <strong>{sport ? sport.toUpperCase() : "MATCH"} COURT · {format}</strong>
          </div>
          {venueName && <span className="court-venue-sub">{venueName}</span>}
        </div>

        <div className="court-capacity-status">
          <div className="court-status-pill">
            {spotsRemaining > 0 ? (
              <>
                <span className="live-dot pulse" />
                <strong className="status-open">{spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} remaining</strong>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} className="status-full-icon" />
                <strong className="status-full">Pitch Full ({capacity}/{capacity})</strong>
              </>
            )}
          </div>
          <div className="court-progress-bar">
            <div className="court-progress-fill" style={{ width: `${fillPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Court Legend */}
      <div className="court-sim-bar">
        <div className="court-sim-legend">
          <span className="legend-item"><span className="legend-color team-black" /> Team Black</span>
          <span className="legend-item"><span className="legend-color team-white" /> Team White</span>
          <span className="legend-item"><span className="legend-color spot-open" /> Available Spot</span>
        </div>

      </div>

      {/* The Visual Animated Court Canvas */}
      <div className={`court-field court-field-${normSport}`}>
        {/* Pitch / Field Line Markings */}
        {normSport === "football" && (
          <div className="field-markings markings-football">
            <div className="fb-halfway-line" />
            <div className="fb-center-circle">
              <div className="fb-center-dot" />
            </div>
            {/* Top Penalty Area */}
            <div className="fb-box fb-box-top">
              <div className="fb-goal-area" />
              <div className="fb-penalty-spot" />
              <div className="fb-penalty-arc fb-arc-top" />
            </div>
            {/* Bottom Penalty Area */}
            <div className="fb-box fb-box-bottom">
              <div className="fb-goal-area" />
              <div className="fb-penalty-spot" />
              <div className="fb-penalty-arc fb-arc-bottom" />
            </div>
            {/* Corner Arcs */}
            <div className="fb-corner fb-corner-tl" />
            <div className="fb-corner fb-corner-tr" />
            <div className="fb-corner fb-corner-bl" />
            <div className="fb-corner fb-corner-br" />
          </div>
        )}

        {normSport === "basketball" && (
          <div className="field-markings markings-basketball">
            <div className="bb-halfway-line" />
            <div className="bb-center-circle" />
            {/* Top Key & 3pt line */}
            <div className="bb-key bb-key-top">
              <div className="bb-free-throw" />
              <div className="bb-hoop" />
            </div>
            <div className="bb-arc-3pt bb-arc-top" />
            {/* Bottom Key & 3pt line */}
            <div className="bb-key bb-key-bottom">
              <div className="bb-free-throw" />
              <div className="bb-hoop" />
            </div>
            <div className="bb-arc-3pt bb-arc-bottom" />
          </div>
        )}

        {normSport === "tennis" && (
          <div className="field-markings markings-tennis">
            <div className="tn-net" />
            <div className="tn-center-service-line tn-service-top" />
            <div className="tn-service-box-line tn-sline-top" />
            <div className="tn-center-service-line tn-service-bottom" />
            <div className="tn-service-box-line tn-sline-bottom" />
            <div className="tn-singles-line tn-sline-left" />
            <div className="tn-singles-line tn-sline-right" />
          </div>
        )}

        {normSport === "dodgeball" && (
          <div className="field-markings markings-dodgeball">
            <div className="db-center-line" />
            <div className="db-attack-line db-attack-top" />
            <div className="db-attack-line db-attack-bottom" />
            <div className="db-ball-staging">
              <span className="db-ball" />
              <span className="db-ball" />
              <span className="db-ball" />
              <span className="db-ball" />
              <span className="db-ball" />
            </div>
          </div>
        )}

        {/* Player and Empty Spot Markers */}
        {spotLayout.map((spot, index) => {
          const player = allActivePlayers[index];
          const isOccupied = !!player;

          return (
            <div
              key={`spot-${index}`}
              className={`court-spot ${isOccupied ? "is-occupied" : "is-open"}`}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                animationDelay: `${index * 45}ms`
              }}
            >
              {isOccupied ? (
                <div className="player-token-wrapper">
                  <div className={`player-token team-${(player.team || spot.team).toLowerCase()}`}>
                    {player.avatar_url ? (
                      <Image
                        src={player.avatar_url}
                        alt={player.name}
                        width={36}
                        height={36}
                        className="player-token-img"
                      />
                    ) : (
                      <span className="player-token-initial">{player.name[0]}</span>
                    )}
                  </div>
                  <div className="player-token-tag">
                    <span className="player-name-label">{player.name.split(" ")[0]}</span>
                    <span className="player-role-label">{spot.label}</span>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="player-tooltip">
                    <strong>{player.name}</strong>
                    <small>{spot.team} Team · {spot.label}</small>
                    <span className="tooltip-joined">✓ Joined</span>
                  </div>
                </div>
              ) : (
                <div
                  className="open-spot-wrapper"
                  onClick={() => {
                    // Smoothly scroll to booking card if spot is clicked
                    const bookingPanel = document.querySelector(".booking-panel");
                    if (bookingPanel) {
                      bookingPanel.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  title="Spot available! Click to join match"
                >
                  <div className="open-spot-circle">
                    <span className="open-spot-pulse-ring" />
                    <Plus size={16} className="open-spot-plus" />
                  </div>
                  <div className="open-spot-tag">
                    <span>Open Spot</span>
                    <small>{spot.label}</small>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Court Footer Summary */}
      <div className="court-footer">
        <div className="court-footer-info">
          <span>
            {spotsRemaining > 0
              ? `⚡ ${spotsRemaining} spots left on the ${normSport === "football" ? "pitch" : "court"}. Tap an open spot or book on the right.`
              : `🎉 Match formation is completely full! Teams are balanced and ready to play.`}
          </span>
        </div>
      </div>
    </div>
  );
}
