import { useRef, useState, useCallback } from 'react';
import CourtMarkings from './CourtMarkings';
import PlayerToken from './PlayerToken';
import OverlapIndicator from './OverlapIndicator';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

function screenToSVG(svgEl, clientX, clientY) {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(ctm.inverse());
}

export default function Court({ placements, dispatch, onSwipeLeft, onSwipeRight, responsibilities }) {
  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState(null);

  useSwipeGesture(svgRef, onSwipeLeft, onSwipeRight, draggingRef);

  const handlePointerDown = useCallback((e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    const svg = svgRef.current;
    if (!svg) return;
    draggingRef.current = true;
    setDragging({ slot, pointerId: e.pointerId });
    const pt = screenToSVG(svg, e.clientX, e.clientY);
    setDragPos({ x: pt.x, y: pt.y });
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = screenToSVG(svg, e.clientX, e.clientY);
    const x = Math.max(5, Math.min(85, pt.x));
    const y = Math.max(5, Math.min(85, pt.y));
    setDragPos({ x, y });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    if (dragPos) {
      dispatch({
        type: 'MOVE_PLAYER_ON_COURT',
        slot: dragging.slot,
        x: Math.round(dragPos.x),
        y: Math.round(dragPos.y),
      });
    }
    draggingRef.current = false;
    setDragging(null);
    setDragPos(null);
  }, [dragging, dragPos, dispatch]);

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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <CourtMarkings />
      <OverlapIndicator placements={renderPlacements} />

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
          onPointerDown={(e) => handlePointerDown(e, p.rotationalPosition)}
        />
      ))}
    </svg>
  );
}
