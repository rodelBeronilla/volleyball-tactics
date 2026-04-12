import { useState, useCallback, useMemo } from 'react';
import { STATS, PLAYER_STAT_GROUPS } from '../../data/statCategories';
import { POSITIONS, ZONE_CENTERS } from '../../data/positions';
import TagSelector from './TagSelector';
import TouchTimeline from './TouchTimeline';

/** Quick-access actions for the action picker */
const QUICK_ACTIONS = [
  'kill', 'attackError', 'attackAttempt',
  'ace', 'serveInPlay', 'serviceError',
  'passPerfect', 'passGood', 'passPoor',
  'dig', 'defenseError',
  'assist', 'setError',
  'blockSolo', 'blockError',
];

/**
 * Build a rally touch-by-touch.
 * User flow: select player -> tap court for ball position -> pick action -> touch added.
 */
export default function RallyBuilder({
  rally = null,
  players = [],
  matches = [],
  rotation: initialRotation = 1,
  dispatch,
  onSave,
  onCancel,
}) {
  const isEditing = !!rally;

  // Rally metadata
  const [matchId, setMatchId] = useState(rally?.matchId || '');
  const [setNumber, setSetNumber] = useState(rally?.setNumber || 1);
  const [rotation, setRotation] = useState(rally?.rotation || initialRotation);
  const [ourScore, setOurScore] = useState(rally?.ourScore || 0);
  const [theirScore, setTheirScore] = useState(rally?.theirScore || 0);
  const [servingTeam, setServingTeam] = useState(rally?.servingTeam || 'us');
  const [outcome, setOutcome] = useState(rally?.outcome || 'won');

  // Film review data
  const [touches, setTouches] = useState(rally?.filmReview?.touches || []);
  const [tags, setTags] = useState(rally?.filmReview?.tags || []);
  const [notes, setNotes] = useState(rally?.filmReview?.notes || '');
  const [playerPositions, setPlayerPositions] = useState(
    rally?.filmReview?.playerPositions || buildDefaultPositions(),
  );

  // Builder workflow state
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [pendingBallFrom, setPendingBallFrom] = useState(null);
  const [pendingBallTo, setPendingBallTo] = useState(null);
  const [activeTouchIndex, setActiveTouchIndex] = useState(touches.length > 0 ? touches.length - 1 : 0);
  const [showActionPicker, setShowActionPicker] = useState(false);

  const playerMap = useMemo(
    () => Object.fromEntries(players.map(p => [p.id, p])),
    [players],
  );

  function buildDefaultPositions() {
    // Place 6 positions in default zone centers
    const positions = {};
    Object.entries(ZONE_CENTERS).forEach(([zone, center]) => {
      positions[zone] = { x: center.x, y: center.y };
    });
    return positions;
  }

  const getPlayerColor = (player) => {
    if (!player?.position) return '#888';
    return POSITIONS[player.position]?.color || '#888';
  };

  // Handle court tap to set ball position
  const handleCourtClick = useCallback((e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 94 - 2;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - 5;

    // Clamp to court bounds
    const cx = Math.max(0, Math.min(90, x));
    const cy = Math.max(0, Math.min(90, y));

    if (!selectedPlayerId) return;

    if (!pendingBallFrom) {
      // First tap: set ballFrom
      setPendingBallFrom({ x: cx, y: cy });
    } else {
      // Second tap: set ballTo, show action picker
      setPendingBallTo({ x: cx, y: cy });
      setShowActionPicker(true);
    }
  }, [selectedPlayerId, pendingBallFrom]);

  // Select an action to finalize the touch
  const handleActionSelect = useCallback((action) => {
    if (!selectedPlayerId) return;

    const newTouch = {
      id: 'touch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      order: touches.length + 1,
      playerId: selectedPlayerId,
      action,
      ballFrom: pendingBallFrom || { x: 45, y: 45 },
      ballTo: pendingBallTo || pendingBallFrom || { x: 45, y: 45 },
      note: '',
      timestamp: Date.now(),
    };

    setTouches(prev => [...prev, newTouch]);
    setActiveTouchIndex(touches.length);
    setSelectedPlayerId(null);
    setPendingBallFrom(null);
    setPendingBallTo(null);
    setShowActionPicker(false);
  }, [selectedPlayerId, pendingBallFrom, pendingBallTo, touches.length]);

  const handleDeleteTouch = useCallback((index) => {
    setTouches(prev => {
      const next = prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 }));
      return next;
    });
    setActiveTouchIndex(prev => Math.max(0, Math.min(prev, touches.length - 2)));
  }, [touches.length]);

  const handleToggleTag = useCallback((tagId) => {
    setTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (isEditing && rally?.id) {
      // Update existing rally's film review
      dispatch({
        type: 'UPDATE_RALLY_FILM_REVIEW',
        rallyId: rally.id,
        filmReview: {
          version: 1,
          touches,
          tags,
          notes,
          playerPositions,
        },
      });
    } else {
      // Create new film rally
      dispatch({
        type: 'CREATE_FILM_RALLY',
        matchId: matchId || null,
        setNumber,
        rallyNumber: null,
        rotation,
        ourScore,
        theirScore,
        servingTeam,
        outcome,
        touches,
        tags,
        notes,
        playerPositions,
      });
    }
    onSave?.();
  }, [
    isEditing, rally, dispatch, matchId, setNumber, rotation,
    ourScore, theirScore, servingTeam, outcome, touches, tags, notes, playerPositions, onSave,
  ]);

  const cancelSelection = useCallback(() => {
    setSelectedPlayerId(null);
    setPendingBallFrom(null);
    setPendingBallTo(null);
    setShowActionPicker(false);
  }, []);

  // Build current ball position for visualization
  const currentBall = useMemo(() => {
    if (pendingBallTo) return pendingBallTo;
    if (pendingBallFrom) return pendingBallFrom;
    if (touches.length > 0) {
      const lastTouch = touches[touches.length - 1];
      return lastTouch.ballTo || lastTouch.ballFrom;
    }
    return null;
  }, [pendingBallFrom, pendingBallTo, touches]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-white/5 shrink-0">
        <button onClick={onCancel} className="text-sm text-white/60 hover:text-white">
          &larr; Cancel
        </button>
        <h3 className="text-sm font-bold text-white">
          {isEditing ? 'Edit Rally' : 'New Rally'}
        </h3>
        <button
          onClick={handleSave}
          className="px-3 py-1 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold active:scale-95 transition-transform"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Rally metadata */}
        <div className="px-4 py-3 space-y-3 bg-[var(--color-surface-2)] border-b border-white/5">
          <div className="flex flex-wrap gap-2">
            {/* Match selector */}
            <select
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
              className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1.5 flex-1 min-w-[120px]"
            >
              <option value="">No Match</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>vs {m.opponent} ({m.date})</option>
              ))}
            </select>

            {/* Set number */}
            <select
              value={setNumber}
              onChange={e => setSetNumber(Number(e.target.value))}
              className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1.5"
            >
              {[1, 2, 3, 4, 5].map(s => (
                <option key={s} value={s}>Set {s}</option>
              ))}
            </select>

            {/* Rotation */}
            <select
              value={rotation}
              onChange={e => setRotation(Number(e.target.value))}
              className="text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1.5"
            >
              {[1, 2, 3, 4, 5, 6].map(r => (
                <option key={r} value={r}>R{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Score */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50">Us:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={ourScore}
                onChange={e => setOurScore(Number(e.target.value))}
                className="w-12 text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1 text-center"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50">Them:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={theirScore}
                onChange={e => setTheirScore(Number(e.target.value))}
                className="w-12 text-xs bg-[var(--color-surface-3)] text-white border border-white/10 rounded px-2 py-1 text-center"
              />
            </div>

            {/* Serving team */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-white/50">Serve:</span>
              <button
                onClick={() => setServingTeam(servingTeam === 'us' ? 'them' : 'us')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  servingTeam === 'us'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {servingTeam === 'us' ? 'Us' : 'Them'}
              </button>
            </div>

            {/* Outcome */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOutcome(outcome === 'won' ? 'lost' : 'won')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  outcome === 'won'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {outcome === 'won' ? 'W' : 'L'}
              </button>
            </div>
          </div>
        </div>

        {/* Workflow hint */}
        <div className="px-4 py-2 text-xs text-white/40 text-center bg-[var(--color-surface)]">
          {!selectedPlayerId && 'Select a player below, then tap court for ball path'}
          {selectedPlayerId && !pendingBallFrom && 'Tap court to set ball start position'}
          {selectedPlayerId && pendingBallFrom && !showActionPicker && 'Tap court to set ball destination'}
          {showActionPicker && 'Pick an action to complete the touch'}
        </div>

        {/* Player bar */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {players.map(player => {
              const isSelected = selectedPlayerId === player.id;
              const color = getPlayerColor(player);
              return (
                <button
                  key={player.id}
                  onClick={() => {
                    if (isSelected) {
                      cancelSelection();
                    } else {
                      cancelSelection();
                      setSelectedPlayerId(player.id);
                    }
                  }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 border ${
                    isSelected
                      ? 'border-white/40 shadow-lg'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                  style={{
                    backgroundColor: isSelected ? color + '40' : 'var(--color-surface-3)',
                    color: isSelected ? '#fff' : color,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {player.number}
                  </span>
                  {player.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Court SVG */}
        <div className="px-4 py-2">
          <div className="w-full max-w-md mx-auto aspect-square">
            <svg
              viewBox="-2 -5 94 100"
              className="w-full h-full cursor-crosshair"
              onClick={handleCourtClick}
            >
              {/* Court background */}
              <rect x="0" y="0" width="90" height="90" rx="2" fill="var(--color-court, #2d6b30)" />

              {/* Net line */}
              <line x1="0" y1="0" x2="90" y2="0" stroke="white" strokeWidth="1.5" opacity="0.8" />
              <text x="45" y="-2" textAnchor="middle" fill="white" fontSize="3" opacity="0.5">
                NET
              </text>

              {/* Attack line */}
              <line x1="0" y1="30" x2="90" y2="30" stroke="white" strokeWidth="0.4" opacity="0.4" />

              {/* Court border */}
              <rect x="0" y="0" width="90" height="90" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />

              {/* Zone labels */}
              {Object.entries(ZONE_CENTERS).map(([zone, center]) => (
                <text
                  key={zone}
                  x={center.x}
                  y={center.y + 14}
                  textAnchor="middle"
                  fill="white"
                  fontSize="2.5"
                  opacity="0.2"
                >
                  {center.label}
                </text>
              ))}

              {/* Player positions on court */}
              {Object.entries(playerPositions).map(([slotOrId, pos]) => {
                const player = playerMap[slotOrId] || players.find(p => String(p.number) === slotOrId);
                const color = getPlayerColor(player);
                const isSelected = player && selectedPlayerId === player.id;

                return (
                  <g key={slotOrId}>
                    {isSelected && (
                      <circle cx={pos.x} cy={pos.y} r="6" fill="none" stroke="white" strokeWidth="0.8" opacity="0.6" strokeDasharray="1.5,1" />
                    )}
                    <circle cx={pos.x} cy={pos.y} r="4" fill={color} stroke="white" strokeWidth="0.5" opacity={isSelected ? 1 : 0.7} />
                    <text x={pos.x} y={pos.y + 1.2} textAnchor="middle" fill="white" fontSize="3.5" fontWeight="bold">
                      {player?.number || slotOrId}
                    </text>
                  </g>
                );
              })}

              {/* Pending ball path */}
              {pendingBallFrom && pendingBallTo && (
                <line
                  x1={pendingBallFrom.x}
                  y1={pendingBallFrom.y}
                  x2={pendingBallTo.x}
                  y2={pendingBallTo.y}
                  stroke="#fbbf24"
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                  opacity="0.7"
                />
              )}

              {/* Pending ball from marker */}
              {pendingBallFrom && (
                <circle cx={pendingBallFrom.x} cy={pendingBallFrom.y} r="2" fill="#fbbf24" opacity="0.5" />
              )}

              {/* Ball marker */}
              {currentBall && (
                <circle
                  cx={currentBall.x}
                  cy={currentBall.y}
                  r="2.5"
                  fill="#fbbf24"
                  stroke="white"
                  strokeWidth="0.5"
                />
              )}

              {/* Previous touches trail */}
              {touches.map((touch, i) => (
                touch.ballFrom && touch.ballTo ? (
                  <line
                    key={touch.id}
                    x1={touch.ballFrom.x}
                    y1={touch.ballFrom.y}
                    x2={touch.ballTo.x}
                    y2={touch.ballTo.y}
                    stroke="#fbbf24"
                    strokeWidth="0.4"
                    opacity={0.15 + (i / touches.length) * 0.25}
                  />
                ) : null
              ))}
            </svg>
          </div>
        </div>

        {/* Action picker overlay */}
        {showActionPicker && (
          <div className="px-4 py-3 bg-[var(--color-surface-2)] border-y border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Select Action</span>
              <button onClick={cancelSelection} className="text-xs text-white/40 hover:text-white">
                Cancel
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(actionKey => {
                const stat = STATS[actionKey];
                if (!stat) return null;
                return (
                  <button
                    key={actionKey}
                    onClick={() => handleActionSelect(actionKey)}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold active:scale-95 transition-transform border border-white/10 ${
                      stat.positive
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    }`}
                  >
                    {stat.label}
                  </button>
                );
              })}
            </div>

            {/* Full action list by group */}
            <details className="mt-2">
              <summary className="text-xs text-white/40 cursor-pointer">All actions...</summary>
              <div className="mt-2 space-y-2">
                {PLAYER_STAT_GROUPS.map(group => (
                  <div key={group.id}>
                    <div className="text-[10px] text-white/30 uppercase mb-1">{group.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.stats.map(statKey => {
                        const stat = STATS[statKey];
                        return (
                          <button
                            key={statKey}
                            onClick={() => handleActionSelect(statKey)}
                            className="px-2 py-1 rounded text-[11px] bg-[var(--color-surface-3)] text-white/70 hover:text-white active:scale-95 transition-transform"
                          >
                            {stat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Touch timeline */}
        <div className="px-4 py-3 border-t border-white/5">
          <TouchTimeline
            touches={touches}
            players={players}
            activeTouchIndex={activeTouchIndex}
            onSelectTouch={setActiveTouchIndex}
            onDeleteTouch={handleDeleteTouch}
          />
        </div>

        {/* Tags */}
        <div className="px-4 py-3 border-t border-white/5">
          <TagSelector selectedTags={tags} onToggleTag={handleToggleTag} />
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-t border-white/5">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wide block mb-1">
            Rally Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this rally..."
            rows={3}
            className="w-full bg-[var(--color-surface-3)] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-[var(--color-accent)] focus:outline-none resize-none placeholder:text-white/30"
          />
        </div>

        {/* Bottom save */}
        <div className="px-4 py-4">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm active:scale-[0.98] transition-transform"
          >
            {isEditing ? 'Update Rally' : 'Save Rally'}
          </button>
        </div>
      </div>
    </div>
  );
}
