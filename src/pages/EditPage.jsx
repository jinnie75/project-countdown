import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CountdownForm from '../components/CountdownForm';
import {
  fetchCurrentCountdown,
  saveCurrentCountdown,
} from '../services/countdownService';

export default function EditPage({ onClose, onSaved }) {
  const [countdown, setCountdown] = useState(null);
  const [storageMode, setStorageMode] = useState('local');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false);

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

  useEffect(() => {
    if (!shouldCloseAfterSave) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onClose?.();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose, shouldCloseAfterSave]);

  async function handleSave(nextCountdown) {
    const result = await saveCurrentCountdown(nextCountdown);
    setCountdown(result.countdown);
    setStorageMode(result.storageMode);
    onSaved?.(result);
    setShouldCloseAfterSave(true);
    return result;
  }

  function handleClose() {
    onClose?.();
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-label="Edit countdown">
        <div className="modal-close-row">
          <button
            type="button"
            className="modal-close-button"
            aria-label="Close edit popup"
            onClick={handleClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {isLoading && (
          <section className="panel panel--status modal-status">
            <p>Loading countdown settings...</p>
          </section>
        )}

        {!isLoading && errorMessage && (
          <section className="panel panel--status panel--error modal-status">
            <p>{errorMessage}</p>
          </section>
        )}

        {!isLoading && countdown && (
          <CountdownForm
            initialCountdown={countdown}
            storageMode={storageMode}
            onSave={handleSave}
            onFormChange={() => setShouldCloseAfterSave(false)}
          />
        )}
      </section>
    </div>
  );
}
