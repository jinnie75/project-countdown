import { BOARD_ROW_LENGTH } from './validation';

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

export function buildNameRow(name = '') {
  return toFixedBoardRow(name.split(''));
}

export function buildCountRow(boardState) {
  return toFixedBoardRow([
    boardState?.prefix || 'D',
    boardState?.sign || '-',
    ...String(boardState?.value ?? 0).split(''),
  ]);
}

export function buildBoardRows(name, boardState) {
  return {
    name: buildNameRow(name),
    count: buildCountRow(boardState),
  };
}

export function buildBlankBoardRows() {
  return {
    name: buildNameRow(''),
    count: buildNameRow(''),
  };
}

export function rowsMatch(leftRow = [], rightRow = []) {
  if (leftRow.length !== rightRow.length) {
    return false;
  }

  return leftRow.every((character, index) => character === rightRow[index]);
}

export function boardRowsMatch(leftBoard, rightBoard) {
  return (
    rowsMatch(leftBoard?.name, rightBoard?.name) &&
    rowsMatch(leftBoard?.count, rightBoard?.count)
  );
}
