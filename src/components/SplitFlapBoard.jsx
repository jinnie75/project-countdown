import SplitFlapTile from './SplitFlapTile';
import { buildBoardRows } from '../utils/boardRows';

function buildStaticTiles(characters) {
  return characters.map((character) => ({
    currentCharacter: character,
    nextCharacter: character,
    phase: 'idle',
  }));
}

export default function SplitFlapBoard({
  name,
  boardState,
  renderedBoard = null,
  label = '',
}) {
  const fallbackBoard = buildBoardRows(name, boardState);
  const nameTiles = renderedBoard?.name || buildStaticTiles(fallbackBoard.name);
  const countTiles = renderedBoard?.count || buildStaticTiles(fallbackBoard.count);
  const accessibleLabel = label || `${name}. ${boardState?.label || ''}.`;

  return (
    <section className="board-shell" aria-label={accessibleLabel}>
      <div className="board-face">
        <div className="board-row board-row--name">
          {nameTiles.map((tile, index) => (
            <SplitFlapTile
              key={`name-${index}`}
              character={tile.currentCharacter}
              nextCharacter={tile.nextCharacter}
              phase={tile.phase}
            />
          ))}
        </div>

        <div className="board-row board-row--count" aria-label={boardState?.label || label}>
          {countTiles.map((tile, index) => (
            <SplitFlapTile
              key={`count-${index}`}
              character={tile.currentCharacter}
              nextCharacter={tile.nextCharacter}
              phase={tile.phase}
              compact={index < 2}
              accent={index === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
