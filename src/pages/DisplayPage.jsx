import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SplitFlapBoard from '../components/SplitFlapBoard';
import { fetchCurrentCountdown } from '../services/countdownService';
import { buildBoardState } from '../utils/countdownMath';

function formatUpdatedTime(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
    .replace(', ', ' ')
    .replace(' AM', 'AM')
    .replace(' PM', 'PM');
}

export default function DisplayPage() {
  const [countdown, setCountdown] = useState(null);
  const [storageMode, setStorageMode] = useState('local');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <main className="page page--display">
      <header className="display-toolbar">
        {storageMode === 'local' && (
          <span className="sync-pill sync-pill--local">Local Preview</span>
        )}
        <Link to="/edit" className="icon-link icon-link--edit" aria-label="Edit countdown">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 20h4.75L19 9.75 14.25 5 4 15.25V20zm12.06-16.06 2 2a1.5 1.5 0 0 1 0 2.12l-1 1L12.31 4.31l1-1a1.5 1.5 0 0 1 2.12 0z"
              fill="currentColor"
            />
          </svg>
        </Link>
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
          <p>Updated at {formatUpdatedTime(countdown.updatedAt)}</p>
        </footer>
      )}
    </main>
  );
}
