import { useEffect, useMemo, useState } from 'react';
import SplitFlapBoard from './SplitFlapBoard';
import { BOARD_COUNT_VALUE_MAX, buildBoardState } from '../utils/countdownMath';
import {
  getDefaultTimezone,
  getEventNameValidation,
  isValidDateString,
  isValidTimezone,
} from '../utils/validation';

const FALLBACK_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function getTimezoneOptions(currentTimezone) {
  const supportedValues = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [];

  return Array.from(
    new Set([currentTimezone, getDefaultTimezone(), ...FALLBACK_TIMEZONES, ...supportedValues]),
  ).sort((left, right) => left.localeCompare(right));
}

export default function CountdownForm({
  initialCountdown,
  storageMode,
  onSave,
}) {
  const [formValues, setFormValues] = useState(initialCountdown);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormValues(initialCountdown);
  }, [initialCountdown]);

  const nameValidation = useMemo(
    () => getEventNameValidation(formValues.name),
    [formValues.name],
  );

  const timezoneLooksValid = isValidTimezone(formValues.timezone);
  const dateLooksValid = isValidDateString(formValues.date);
  const previewCountdown = {
    ...formValues,
    name: nameValidation.sanitizedName || 'UNTITLED',
    timezone: timezoneLooksValid ? formValues.timezone : getDefaultTimezone(),
  };
  const boardState = buildBoardState(previewCountdown);
  const timezoneOptions = useMemo(
    () => getTimezoneOptions(formValues.timezone),
    [formValues.timezone],
  );

  const blockingErrors = [];
  const warnings = [];

  if (nameValidation.isEmpty) {
    blockingErrors.push('Add an event name before saving.');
  }

  if (nameValidation.tooLong) {
    blockingErrors.push('Event name must be 10 characters or fewer after formatting.');
  }

  if (!dateLooksValid) {
    blockingErrors.push('Choose a valid target date.');
  }

  if (!timezoneLooksValid) {
    blockingErrors.push('Use a valid IANA timezone like America/New_York.');
  }

  if (nameValidation.unsupportedCharacters.length > 0) {
    warnings.push(
      `Unsupported characters will be removed on save: ${nameValidation.unsupportedCharacters.join(
        ' ',
      )}`,
    );
  }

  if (boardState.isFutureCountup) {
    warnings.push('Count-up mode is pointing at a future date, so the preview shows D - until that day arrives.');
  }

  if (boardState.isOverLimit) {
    warnings.push(`This D-count is over ${BOARD_COUNT_VALUE_MAX}, which may overflow the physical board layout later.`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusMessage('');
    setErrorMessage('');

    if (blockingErrors.length > 0) {
      setErrorMessage(blockingErrors[0]);
      return;
    }

    setIsSaving(true);

    try {
      const result = await onSave({
        ...formValues,
        name: nameValidation.sanitizedName,
      });
      setFormValues(result.countdown);
      setStatusMessage(
        result.storageMode === 'firebase'
          ? 'Countdown updated in Firebase.'
          : 'Countdown saved locally. Add Firebase env vars to sync it remotely.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save right now.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setStatusMessage('');
    setErrorMessage('');
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  return (
    <div className="edit-layout">
      <section className="panel panel--form">
        <div className="panel-heading">
          <div>
            <h2>Update Countdown</h2>
          </div>
          {storageMode === 'local' && (
            <span className="sync-pill sync-pill--local">Local Preview</span>
          )}
        </div>

        <form className="countdown-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Event Name</span>
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleFieldChange}
              placeholder="Calc finals"
              autoComplete="off"
            />
            <small>{nameValidation.characterCount} / {nameValidation.maxLength} characters</small>
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              name="date"
              value={formValues.date}
              onChange={handleFieldChange}
            />
          </label>

          <label className="field">
            <span>Mode</span>
            <select
              name="mode"
              value={formValues.mode}
              onChange={handleFieldChange}
            >
              <option value="countdown">Count down from</option>
              <option value="countup">Count up since</option>
            </select>
          </label>

          <label className="field">
            <span>Timezone</span>
            <input
              type="text"
              name="timezone"
              value={formValues.timezone}
              onChange={handleFieldChange}
              list="timezone-options"
              placeholder="America/New_York"
            />
            <datalist id="timezone-options">
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone} />
              ))}
            </datalist>
          </label>

          {warnings.length > 0 && (
            <div className="message-block message-block--warning" role="status">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="message-block message-block--error" role="alert">
              <p>{errorMessage}</p>
            </div>
          )}

          {statusMessage && (
            <div className="message-block message-block--success" role="status">
              <p>{statusMessage}</p>
            </div>
          )}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Update countdown'}
          </button>
        </form>
      </section>

      <section className="panel panel--preview">
        <div className="panel-heading">
          <div>
            <h2>Preview</h2>
          </div>
        </div>

        <SplitFlapBoard
          name={nameValidation.sanitizedName || 'UNTITLED'}
          boardState={boardState}
        />
      </section>
    </div>
  );
}
