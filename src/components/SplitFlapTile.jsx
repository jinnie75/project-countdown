export default function SplitFlapTile({
  character,
  compact = false,
  accent = false,
}) {
  const safeCharacter = character === ' ' ? '\u00A0' : character;

  return (
    <div
      className={[
        'split-flap-tile',
        compact ? 'split-flap-tile--compact' : '',
        accent ? 'split-flap-tile--accent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span>{safeCharacter}</span>
    </div>
  );
}

