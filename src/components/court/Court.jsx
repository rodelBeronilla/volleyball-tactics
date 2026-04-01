import { useRef, useState, useCallback } from 'react';
import CourtMarkings from './CourtMarkings';
import PlayerToken from './PlayerToken';
import OverlapIndicator from './OverlapIndicator';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

function screenToSVG(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

export default function Court({ placements, dispatch, onSwipeLeft, onSwipeRight }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { slot, pointerId }
  const [dragPos, setDragPos] = useState(null);

  useSwipeGesture(svgRef, onSwipeLeft, onSwipeRight);

  const handlePointerDown = useCallback((e, slot) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('g').setPointerCapture?.(e.pointerId);
    const svg = svgRef.current;
    if (!svg) return;
    setDragging({ slot, pointerId: e.pointerId });
    const pt = screenToSVG(svg, e.clientX, e.clientY);
    setDragPos({ x: pt.x, y: pt.y });
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = screenToSVG(svg, e.clientX, e.clientY);
    // Clamp to court
    const x = Math.max(5, Math.min(85, pt.x));
    const y = Math.max(5, Math.min(85, pt.y));
    setDragPos({ x, y });
  }, [dragging]);

  const handlePointerUp = useCallback((e) => {
    if (!dragging) return;
    if (dragPos) {
      dispatch({
        type: 'MOVE_PLAYER_ON_COURT',
        slot: dragging.slot,
        x: Math.round(dragPos.x),
        y: Math.round(dragPos.y),
      });
    }
    setDragging(null);
    setDragPos(null);
  }, [dragging, dragPos, dispatch]);

  // Merge drag position into placements for rendering
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
