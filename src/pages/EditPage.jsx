import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownForm from '../components/CountdownForm';
import {
  fetchCurrentCountdown,
  saveCurrentCountdown,
} from '../services/countdownService';

export default function EditPage() {
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
            : 'Unable to load the current countdown.',
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

  async function handleSave(nextCountdown) {
    const result = await saveCurrentCountdown(nextCountdown);
    setCountdown(result.countdown);
    setStorageMode(result.storageMode);
    return result;
  }

  return (
    <main className="page page--edit">
      <header className="page-nav">
        <Link to="/display" className="text-link">Back</Link>
      </header>

      {isLoading && (
        <section className="panel panel--status">
          <p>Loading countdown settings...</p>
        </section>
      )}

      {!isLoading && errorMessage && (
        <section className="panel panel--status panel--error">
          <p>{errorMessage}</p>
        </section>
      )}

      {!isLoading && countdown && (
        <CountdownForm
          initialCountdown={countdown}
          storageMode={storageMode}
          onSave={handleSave}
        />
      )}
    </main>
  );
}
