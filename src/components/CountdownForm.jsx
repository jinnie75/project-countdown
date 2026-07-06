import { useEffect, useMemo, useState } from 'react';
import {
  BOARD_COUNT_VALUE_MAX,
  buildBoardState,
  getDayDifference,
} from '../utils/countdownMath';
import {
  getEventNameValidation,
  isValidDateString,
} from '../utils/validation';

function getModeForDate(date, fallbackMode = 'countdown') {
  const dayDifference = getDayDifference(date);

  if (dayDifference === null) {
    return fallbackMode;
  }

  return dayDifference >= 1 ? 'countdown' : 'countup';
}

export default function CountdownForm({
  initialCountdown,
  onSave,
  onFormChange,
}) {
  const [formValues, setFormValues] = useState(initialCountdown);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormValues({
      ...initialCountdown,
      mode: getModeForDate(initialCountdown.date, initialCountdown.mode),
    });
  }, [initialCountdown]);

  const nameValidation = useMemo(
    () => getEventNameValidation(formValues.name),
    [formValues.name],
  );
  const displayedNameCharacterCount = formValues.name.length;
  const decidedModeLabel = formValues.mode === 'countup'
    ? 'count up from'
    : 'count down from';
  const dateLooksValid = isValidDateString(formValues.date);
  const previewCountdown = {
    ...formValues,
    name: nameValidation.sanitizedName || 'UNTITLED',
  };
  const boardState = buildBoardState(previewCountdown);

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

  if (nameValidation.unsupportedCharacters.length > 0) {
    warnings.push(
      `Unsupported characters will be removed on save: ${nameValidation.unsupportedCharacters.join(
        ' ',
      )}`,
    );
  }

  if (boardState.isFutureCountup) {
    warnings.push('Count-up mode is pointing at a future date, so the countdown will show D - until that day arrives.');
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
        mode: getModeForDate(formValues.date, formValues.mode),
      });
      setFormValues(result.countdown);
      setStatusMessage(
        result.storageMode === 'firebase'
          ? 'Countdown updated.'
          : 'Countdown updated locally. Set up Firebase to make the updates live online.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save right now.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    const nextValue = name === 'name' ? value.toUpperCase() : value;

    if (name === 'name' && nextValue.length > nameValidation.maxLength) {
      return;
    }

    onFormChange?.();
    setStatusMessage('');
    setErrorMessage('');
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: nextValue,
      mode:
        name === 'date'
          ? getModeForDate(nextValue, currentValues.mode)
          : currentValues.mode,
    }));
  }

  return (
    <form className="countdown-form countdown-form--popup" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          type="text"
          name="name"
          value={formValues.name}
          onChange={handleFieldChange}
          maxLength={nameValidation.maxLength}
          autoComplete="off"
        />
        <small
          className={
            displayedNameCharacterCount >= nameValidation.maxLength
              ? 'field-counter field-counter--limit'
              : 'field-counter'
          }
        >
          {displayedNameCharacterCount} / {nameValidation.maxLength} characters
        </small>
      </label>

      <label className="field">
        <span>Date</span>
        <small>{decidedModeLabel}</small>
        <input
          type="date"
          name="date"
          value={formValues.date}
          onChange={handleFieldChange}
        />
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
        {isSaving ? 'Saving...' : 'Update'}
      </button>
    </form>
  );
}
