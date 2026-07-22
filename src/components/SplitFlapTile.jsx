export default function SplitFlapTile({
  character,
  nextCharacter,
  phase = 'idle',
  compact = false,
  accent = false,
}) {
  const activeCharacter = character === ' ' ? '\u00A0' : character;
  const incomingCharacter =
    (nextCharacter ?? character) === ' ' ? '\u00A0' : (nextCharacter ?? character);

  return (
    <div
      className={[
        'split-flap-tile',
        phase !== 'idle' ? `split-flap-tile--${phase}` : '',
        compact ? 'split-flap-tile--compact' : '',
        accent ? 'split-flap-tile--accent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="split-flap-tile__panel split-flap-tile__panel--top">
        <div className="split-flap-tile__panel-content split-flap-tile__panel-content--top">
          <span className="split-flap-tile__character">{activeCharacter}</span>
        </div>
      </div>
      <div className="split-flap-tile__panel split-flap-tile__panel--bottom">
        <div className="split-flap-tile__panel-content split-flap-tile__panel-content--bottom">
          <span className="split-flap-tile__character">{activeCharacter}</span>
        </div>
      </div>
      <div className="split-flap-tile__flip">
        <div className="split-flap-tile__panel-content split-flap-tile__panel-content--top">
          <span className="split-flap-tile__character">{incomingCharacter}</span>
        </div>
      </div>
    </div>
  );
}
