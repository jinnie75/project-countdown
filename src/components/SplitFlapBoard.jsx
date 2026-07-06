import SplitFlapTile from './SplitFlapTile';
import { BOARD_ROW_LENGTH } from '../utils/validation';

function toFixedBoardRow(characters) {
  const visibleCharacters = characters.slice(0, BOARD_ROW_LENGTH);
  const blankCount = Math.max(BOARD_ROW_LENGTH - visibleCharacters.length, 0);
  const leftBlankCount = Math.floor(blankCount / 2);
  const rightBlankCount = blankCount - leftBlankCount;

  return [
    ...Array.from({ length: leftBlankCount }, () => ' '),
    ...visibleCharacters,
    ...Array.from({ length: rightBlankCount }, () => ' '),
  ];
}

function padBoardName(name) {
  return toFixedBoardRow(name.split(''));
}

function padCountCharacters(boardState) {
  return toFixedBoardRow([
    boardState.prefix,
    boardState.sign,
    ...String(boardState.value).split(''),
  ]);
}

export default function SplitFlapBoard({ name, boardState }) {
  const countCharacters = padCountCharacters(boardState);

  return (
    <section className="board-shell" aria-label={`${name}. ${boardState.label}.`}>

      <div className="board-face">
        <div className="board-row board-row--name">
          {padBoardName(name).map((character, index) => (
            <SplitFlapTile
              key={`${character}-${index}`}
              character={character}
            />
          ))}
        </div>

        <div className="board-row board-row--count" aria-label={boardState.label}>
          {countCharacters.map((character, index) => (
            <SplitFlapTile
              key={`${character}-${index}`}
              character={character}
              compact={index < 2}
              accent={index === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
