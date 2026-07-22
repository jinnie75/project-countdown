import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import flipSoundUrl from '../../flip-sound.mp3';
import SplitFlapBoard from '../components/SplitFlapBoard';
import EditPage from './EditPage';
import {
  fetchCurrentCountdown,
  subscribeToCurrentCountdown,
} from '../services/countdownService';
import { buildBoardRows, rowsMatch } from '../utils/boardRows';
import { buildBoardState } from '../utils/countdownMath';
import { isValidDateString } from '../utils/validation';

// all flaps flutter 
const CONTENT_FLUTTER_MS = 3000;

// individual flip speed
const TILE_FLIP_MS = 300;

// delay from one to another
const TILE_STAGGER_MS = 150;

// buffer after midnight
const MIDNIGHT_OFFSET_MS = 50;

function formatDisplayDate(dateString) {
  if (!isValidDateString(dateString)) {
    return '';
  }

  const [year, month, day] = dateString.split('-').map(Number);

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getCountdownSignature(countdown) {
  return [
    countdown?.name || '',
    countdown?.date || '',
    countdown?.mode || '',
  ].join('|');
}

function buildPresentation(countdown, referenceDate = new Date()) {
  const safeName = countdown?.name || 'UNTITLED';
  const boardState = buildBoardState(countdown, referenceDate);

  return {
    name: safeName,
    boardState,
    rows: buildBoardRows(safeName, boardState),
    label: `${safeName}. ${boardState.label}.`,
  };
}

function createRenderedBoard(rows) {
  return {
    name: rows.name.map((character) => ({
      currentCharacter: character,
      nextCharacter: character,
      phase: 'idle',
    })),
    count: rows.count.map((character) => ({
      currentCharacter: character,
      nextCharacter: character,
      phase: 'idle',
    })),
  };
}

function extractRenderedRows(renderedBoard) {
  return {
    name: renderedBoard?.name?.map((tile) => tile.currentCharacter) || [],
    count: renderedBoard?.count?.map((tile) => tile.currentCharacter) || [],
  };
}

function updateTile(renderedBoard, rowKey, tileIndex, updater) {
  return {
    ...renderedBoard,
    [rowKey]: renderedBoard[rowKey].map((tile, index) => (
      index === tileIndex ? updater(tile) : tile
    )),
  };
}

function setTilesPhase(renderedBoard, targetRows, tiles, phase) {
  return tiles.reduce((nextBoard, tile) => (
    updateTile(nextBoard, tile.rowKey, tile.index, (currentTile) => ({
      ...currentTile,
      nextCharacter: targetRows[tile.rowKey][tile.index],
      phase,
    }))
  ), renderedBoard);
}

function getChangedTiles(currentRows, targetRows, rowKeys = ['name', 'count']) {
  return rowKeys.flatMap((rowKey) => (
    targetRows[rowKey]
      .map((character, index) => ({
        rowKey,
        index,
        character,
      }))
      .filter((tile) => currentRows[rowKey][tile.index] !== tile.character)
  ));
}

function getMillisecondsUntilNextMidnight(referenceDate = new Date()) {
  const nextMidnight = new Date(referenceDate);
  nextMidnight.setHours(24, 0, 0, MIDNIGHT_OFFSET_MS);

  return Math.max(nextMidnight.getTime() - referenceDate.getTime(), MIDNIGHT_OFFSET_MS);
}

export default function DisplayPage() {
  const [storageMode, setStorageMode] = useState('local');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [displayedCountdown, setDisplayedCountdown] = useState(null);
  const [displayedBoardState, setDisplayedBoardState] = useState(null);
  const [renderedBoard, setRenderedBoard] = useState(null);

  const latestCountdownRef = useRef(null);
  const displayedCountdownRef = useRef(null);
  const displayedBoardStateRef = useRef(null);
  const renderedBoardRef = useRef(null);
  const sourceSignatureRef = useRef('');
  const animationSequenceRef = useRef(0);
  const flipAudioRef = useRef(null);

  function playFlipSound() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const sourceAudio = flipAudioRef.current || new Audio(flipSoundUrl);

      if (!flipAudioRef.current) {
        sourceAudio.preload = 'auto';
        flipAudioRef.current = sourceAudio;
      }

      const audio = sourceAudio.cloneNode();
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } catch {
      // Ignore audio playback errors so the board animation can continue.
    }
  }

  function commitRenderedBoard(nextRenderedBoard) {
    renderedBoardRef.current = nextRenderedBoard;
    setRenderedBoard(nextRenderedBoard);
  }

  function updateRenderedBoard(updater) {
    if (!renderedBoardRef.current) {
      return;
    }

    const nextRenderedBoard = updater(renderedBoardRef.current);
    commitRenderedBoard(nextRenderedBoard);
  }

  function commitDisplayedState(nextCountdown, nextBoardState) {
    displayedCountdownRef.current = nextCountdown;
    displayedBoardStateRef.current = nextBoardState;
    setDisplayedCountdown(nextCountdown);
    setDisplayedBoardState(nextBoardState);
  }

  function initializeDisplayedBoard(nextCountdown, referenceDate = new Date()) {
    const presentation = buildPresentation(nextCountdown, referenceDate);
    commitRenderedBoard(createRenderedBoard(presentation.rows));
    commitDisplayedState(nextCountdown, presentation.boardState);
  }

  async function animateContentUpdate(nextCountdown) {
    if (!renderedBoardRef.current) {
      initializeDisplayedBoard(nextCountdown);
      return;
    }

    const sequenceId = animationSequenceRef.current + 1;
    const presentation = buildPresentation(nextCountdown);
    const currentRows = extractRenderedRows(renderedBoardRef.current);
    const orderedTiles = getChangedTiles(currentRows, presentation.rows);

    if (orderedTiles.length === 0) {
      commitDisplayedState(nextCountdown, presentation.boardState);
      return;
    }

    animationSequenceRef.current = sequenceId;

    updateRenderedBoard((currentBoard) => (
      setTilesPhase(currentBoard, presentation.rows, orderedTiles, 'flutter')
    ));

    await delay(CONTENT_FLUTTER_MS);

    if (sequenceId !== animationSequenceRef.current) {
      return;
    }

    for (const tile of orderedTiles) {
      if (sequenceId !== animationSequenceRef.current) {
        return;
      }

      updateRenderedBoard((currentBoard) => (
        updateTile(currentBoard, tile.rowKey, tile.index, (currentTile) => ({
          ...currentTile,
          nextCharacter: tile.character,
          phase: 'flip',
        }))
      ));
      playFlipSound();

      await delay(TILE_FLIP_MS);

      if (sequenceId !== animationSequenceRef.current) {
        return;
      }

      updateRenderedBoard((currentBoard) => (
        updateTile(currentBoard, tile.rowKey, tile.index, (currentTile) => ({
          ...currentTile,
          currentCharacter: tile.character,
          nextCharacter: tile.character,
          phase: 'idle',
        }))
      ));

      await delay(TILE_STAGGER_MS);
    }

    if (sequenceId !== animationSequenceRef.current) {
      return;
    }

    commitDisplayedState(nextCountdown, presentation.boardState);
  }

  async function animateMidnightRollover(nextCountdown, nextBoardState, nextRows) {
    if (!renderedBoardRef.current) {
      initializeDisplayedBoard(nextCountdown);
      return;
    }

    const sequenceId = animationSequenceRef.current + 1;
    const currentRows = extractRenderedRows(renderedBoardRef.current);
    const changedTiles = getChangedTiles(currentRows, nextRows, ['count']);

    if (changedTiles.length === 0) {
      commitDisplayedState(nextCountdown, nextBoardState);
      return;
    }

    animationSequenceRef.current = sequenceId;

    updateRenderedBoard((currentBoard) => (
      setTilesPhase(currentBoard, nextRows, changedTiles, 'flutter')
    ));

    await delay(TILE_STAGGER_MS);

    if (sequenceId !== animationSequenceRef.current) {
      return;
    }

    for (const tile of changedTiles) {
      if (sequenceId !== animationSequenceRef.current) {
        return;
      }

      updateRenderedBoard((currentBoard) => (
        updateTile(currentBoard, tile.rowKey, tile.index, (currentTile) => ({
          ...currentTile,
          nextCharacter: tile.character,
          phase: 'flip',
        }))
      ));
      playFlipSound();

      await delay(TILE_FLIP_MS);

      if (sequenceId !== animationSequenceRef.current) {
        return;
      }

      updateRenderedBoard((currentBoard) => (
        updateTile(currentBoard, tile.rowKey, tile.index, (currentTile) => ({
          ...currentTile,
          currentCharacter: tile.character,
          nextCharacter: tile.character,
          phase: 'idle',
        }))
      ));

      await delay(TILE_STAGGER_MS);
    }

    if (sequenceId !== animationSequenceRef.current) {
      return;
    }

    commitDisplayedState(nextCountdown, nextBoardState);
  }

  function handleIncomingCountdown(nextCountdown, nextStorageMode, options = {}) {
    latestCountdownRef.current = nextCountdown;
    setStorageMode(nextStorageMode);

    const nextSignature = getCountdownSignature(nextCountdown);
    const previousSignature = sourceSignatureRef.current;
    sourceSignatureRef.current = nextSignature;

    if (
      !displayedCountdownRef.current ||
      !displayedBoardStateRef.current ||
      !renderedBoardRef.current ||
      options.forceImmediate
    ) {
      initializeDisplayedBoard(nextCountdown);
      return;
    }

    if (options.skipAnimation || nextSignature === previousSignature) {
      return;
    }

    void animateContentUpdate(nextCountdown);
  }

  function handleMidnightTick() {
    const activeCountdown = latestCountdownRef.current || displayedCountdownRef.current;

    if (!activeCountdown || !displayedBoardStateRef.current || !renderedBoardRef.current) {
      return;
    }

    const nextBoardState = buildBoardState(activeCountdown);

    if (nextBoardState.todayString === displayedBoardStateRef.current.todayString) {
      return;
    }

    const nextRows = buildBoardRows(activeCountdown.name || 'UNTITLED', nextBoardState);
    const currentRows = extractRenderedRows(renderedBoardRef.current);

    if (rowsMatch(currentRows.count, nextRows.count)) {
      commitDisplayedState(activeCountdown, nextBoardState);
      return;
    }

    void animateMidnightRollover(activeCountdown, nextBoardState, nextRows);
  }

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    async function loadCountdown() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await fetchCurrentCountdown();

        if (!isMounted) {
          return;
        }

        handleIncomingCountdown(result.countdown, result.storageMode, {
          forceImmediate: true,
        });

        unsubscribe = subscribeToCurrentCountdown({
          onCountdown: (subscriptionResult) => {
            if (!isMounted) {
              return;
            }

            handleIncomingCountdown(
              subscriptionResult.countdown,
              subscriptionResult.storageMode,
            );
          },
          onError: (error) => {
            if (!isMounted) {
              return;
            }

            setErrorMessage(
              error instanceof Error
                ? error.message
                : 'Unable to keep the countdown synced.',
            );
          },
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load the countdown display.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCountdown();

    return () => {
      isMounted = false;
      animationSequenceRef.current += 1;
      flipAudioRef.current = null;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!displayedCountdown || !displayedBoardState) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      handleMidnightTick();
    }, getMillisecondsUntilNextMidnight());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    displayedCountdown?.name,
    displayedCountdown?.date,
    displayedCountdown?.mode,
    displayedBoardState?.todayString,
  ]);

  function handleEditSaved(result) {
    handleIncomingCountdown(result.countdown, result.storageMode);
  }

  const boardLabel = displayedCountdown && displayedBoardState
    ? `${displayedCountdown.name || 'UNTITLED'}. ${displayedBoardState.label}.`
    : '';

  return (
    <>
      <main className="page page--display">
        <header className="display-toolbar">
          {storageMode === 'local' && (
            <span className="sync-pill sync-pill--local">Local Preview</span>
          )}
          <button
            type="button"
            className="icon-link icon-link--edit icon-button"
            aria-label="Edit countdown"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil aria-hidden="true" />
          </button>
        </header>

        <section className="display-stage">
          {isLoading && (
            <div className="panel panel--status">
              <p>Loading board...</p>
            </div>
          )}

          {!isLoading && errorMessage && !displayedCountdown && (
            <div className="panel panel--status panel--error">
              <p>{errorMessage}</p>
            </div>
          )}

          {!isLoading && displayedCountdown && displayedBoardState && renderedBoard && (
            <SplitFlapBoard
              name={displayedCountdown.name || 'UNTITLED'}
              boardState={displayedBoardState}
              renderedBoard={renderedBoard}
              label={boardLabel}
            />
          )}
        </section>

        {!isLoading && displayedCountdown && displayedBoardState && (
          <footer className="display-footer">
            <p>
              {displayedBoardState.direction === 'countup'
                ? 'Counting up from '
                : 'Counting down from '}
              {formatDisplayDate(displayedCountdown.date)}
            </p>
            {errorMessage && <p>{errorMessage}</p>}
          </footer>
        )}
      </main>

      {isEditOpen && (
        <EditPage
          onClose={() => setIsEditOpen(false)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}
