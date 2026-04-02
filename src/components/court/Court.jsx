import { useRef, useState, useCallback } from 'react';
import CourtMarkings from './CourtMarkings';
import PlayerToken from './PlayerToken';
import OverlapIndicator from './OverlapIndicator';
import ArrowDefs from './ArrowDefs';
import MovementArrows from './MovementArrows';
import ZoneHeatmap from './ZoneHeatmap';
import CoverageOverlay from './CoverageOverlay';
import RallyBall from './RallyBall';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

function screenToSVG(svgEl, clientX, clientY) {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(ctm.inverse());
}

const TAP_DISTANCE = 8;
const TAP_TIME = 250;

export default function Court({
  placements, dispatch, onSwipeLeft, onSwipeRight,
  responsibilities, selectedSlot, showRoutes, rotation,
  heatmapData, heatmapMode, playerProfiles, showCoverage, courtPhase,
}) {
  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  // Tap detection buffer
  const pointerStart = useRef(null);

  useSwipeGesture(svgRef, onSwipeLeft, onSwipeRight, draggingRef);

  const handlePointerDown = useCallback((e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    const svg = svgRef.current;
    if (!svg) return;

    const pt = screenToSVG(svg, e.clientX, e.clientY);
    // Buffer start — don't promote to drag yet
    pointerStart.current = {
      slot,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      svgX: pt.x,
      svgY: pt.y,
      time: Date.now(),
      promoted: false,
    };
  }, []);

  const promoteToDrag = useCallback((start) => {
    if (start.promoted) return;
    start.promoted = true;
    draggingRef.current = true;
    setDragging({ slot: start.slot, pointerId: start.pointerId });
    setDragPos({ x: start.svgX, y: start.svgY });
  }, []);

  const handlePointerMove = useCallback((e) => {
    const start = pointerStart.current;
    if (!start || e.pointerId !== start.pointerId) return;

    // Check if movement exceeds tap threshold
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!start.promoted && dist > TAP_DISTANCE) {
      promoteToDrag(start);
    }

    if (start.promoted) {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = screenToSVG(svg, e.clientX, e.clientY);
      const x = Math.max(5, Math.min(85, pt.x));
      const y = Math.max(5, Math.min(85, pt.y));
      setDragPos({ x, y });
    }
  }, [promoteToDrag]);

  const handlePointerUp = useCallback((e) => {
    const start = pointerStart.current;
    if (!start) return;

    if (start.promoted) {
      // Was a drag — commit position
      if (dragPos) {
        dispatch({
          type: 'MOVE_PLAYER_ON_COURT',
          slot: start.slot,
          x: Math.round(dragPos.x),
          y: Math.round(dragPos.y),
        });
      }
    } else {
      // Was a tap — check time and distance
      const dt = Date.now() - start.time;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TAP_DISTANCE && dt < TAP_TIME) {
        // Tap detected — toggle strategy card
        if (selectedSlot === start.slot) {
          dispatch({ type: 'DESELECT_PLAYER' });
        } else {
          dispatch({ type: 'SELECT_PLAYER', slot: start.slot });
        }
      }
    }

    pointerStart.current = null;
    draggingRef.current = false;
    setDragging(null);
    setDragPos(null);
  }, [dragPos, dispatch, selectedSlot]);

  // Tap on empty court = deselect
  const handleCourtTap = useCallback((e) => {
    if (e.target === svgRef.current && selectedSlot != null) {
      dispatch({ type: 'DESELECT_PLAYER' });
    }
  }, [dispatch, selectedSlot]);

  const renderPlacements = placements.map(p => {
    if (dragging && p.rotationalPosition === dragging.slot && dragPos) {
      return { ...p, x: dragPos.x, y: dragPos.y };
    }
    return p;
  });

  return (
    <svg
      ref={svgRef}
      viewBox="-2 -5 94 100"
      className="w-full max-h-full"
      style={{ touchAction: 'none' }}
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCourtTap}
    >
      <ArrowDefs />
      <CourtMarkings />

      {/* Coverage zones — defense phase */}
      {showCoverage && <CoverageOverlay selectedSlot={selectedSlot} />}

      {/* Heatmap layer */}
      {heatmapData && <ZoneHeatmap data={heatmapData} mode={heatmapMode} />}

      {/* Overlap violations — only valid pre-serve */}
      {courtPhase === 'serve' && (
        <OverlapIndicator placements={renderPlacements} />
      )}

      {/* Movement arrows layer — behind players, above court */}
      {showRoutes && !dragging && (
        <MovementArrows
          rotation={rotation}
          placements={renderPlacements}
          selectedSlot={selectedSlot}
        />
      )}

      {/* Responsibility labels under each player */}
      {responsibilities && renderPlacements.map(p => {
        if (!p.player) return null;
        const resp = responsibilities[p.rotationalPosition];
        if (!resp) return null;
        return (
          <g key={`resp-${p.rotationalPosition}`} transform={`translate(${p.x}, ${p.y})`}>
            <text
              y={10}
              textAnchor="middle"
              fill="#ffd700"
              fontSize="1.8"
              fontWeight="600"
              opacity="0.9"
              style={{ pointerEvents: 'none' }}
            >
              {resp}
            </text>
          </g>
        );
      })}

      {renderPlacements.map(p => (
        <PlayerToken
          key={p.rotationalPosition}
          placement={p}
          isDragging={dragging?.slot === p.rotationalPosition}
          isSelected={selectedSlot === p.rotationalPosition}
          impactScore={playerProfiles?.[p.playerId]?.impactScore}
          onPointerDown={(e) => handlePointerDown(e, p.rotationalPosition)}
        />
      ))}

      {/* Rally ball — shows game action per phase */}
      {courtPhase && <RallyBall phase={courtPhase} />}
    </svg>
  );
}
