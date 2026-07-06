import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import SplitFlapBoard from '../components/SplitFlapBoard';
import EditPage from './EditPage';
import { fetchCurrentCountdown } from '../services/countdownService';
import { buildBoardState } from '../utils/countdownMath';
import { isValidDateString } from '../utils/validation';

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

export default function DisplayPage() {
  const [countdown, setCountdown] = useState(null);
  const [storageMode, setStorageMode] = useState('local');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCountdown() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await fetchCurrentCountdown();
        if (!isMounted) {
          return;
        }

        setCountdown(result.countdown);
        setStorageMode(result.storageMode);
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
    };
  }, []);

  const boardState = countdown ? buildBoardState(countdown) : null;

  function handleEditSaved(result) {
    setCountdown(result.countdown);
    setStorageMode(result.storageMode);
  }

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

          {!isLoading && errorMessage && (
            <div className="panel panel--status panel--error">
              <p>{errorMessage}</p>
            </div>
          )}

          {!isLoading && countdown && boardState && (
            <SplitFlapBoard name={countdown.name || 'UNTITLED'} boardState={boardState} />
          )}
        </section>

        {!isLoading && countdown && (
          <footer className="display-footer">
            <p>
              {boardState?.direction === 'countup' ? 'Counting up from ' : 'Counting down from '}
              {formatDisplayDate(countdown.date)}
            </p>
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
