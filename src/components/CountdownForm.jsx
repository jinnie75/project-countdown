import { useEffect, useMemo, useState } from 'react';
import {
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
  const [nameInputWarning, setNameInputWarning] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormValues({
      ...initialCountdown,
      mode: getModeForDate(initialCountdown.date),
    });
    setNameInputWarning('');
  }, [initialCountdown]);

  const nameValidation = useMemo(
    () => getEventNameValidation(formValues.name),
    [formValues.name],
  );
  const displayedNameCharacterCount = formValues.name.length;
  const dateLooksValid = isValidDateString(formValues.date);
  const isCountup = dateLooksValid && formValues.mode === 'countup';
  const previewCountdown = {
    ...formValues,
    name: nameValidation.sanitizedName || 'UNTITLED',
  };
  const boardState = buildBoardState(previewCountdown);

  const blockingErrors = [];

  if (nameValidation.isEmpty) {
    blockingErrors.push('Add an event name before saving.');
  }

  if (!dateLooksValid) {
    blockingErrors.push('Choose a target date.');
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
        mode: getModeForDate(formValues.date),
      });
      setFormValues(result.countdown);
      setStatusMessage(
        result.storageMode === 'firebase'
          ? 'Updated successfully!'
          : 'Updated locally. Set up Firebase to make the updates live online.',
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

    if (name === 'name') {
      const nextNameValidation = getEventNameValidation(nextValue);

      if (nextValue.length > nameValidation.maxLength) {
        return;
      }

      if (nextNameValidation.unsupportedCharacters.length > 0) {
        setNameInputWarning('Only supports: A-Z, 0-9, spaces, and : . - ? !');
        return;
      }

      if (nameInputWarning) {
        setNameInputWarning('');
      }
    }

    onFormChange?.();
    setStatusMessage('');
    setErrorMessage('');
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: nextValue,
      mode:
        name === 'date'
          ? getModeForDate(nextValue)
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
        {nameInputWarning && (
          <small className="field-hint field-hint--warning">{nameInputWarning}</small>
        )}
      </label>

      <label className="field">
        <span>Date</span>
        <small><strong>{isCountup ? 'count up' : 'count down'}</strong> from</small>
        <input
          type="date"
          name="date"
          value={formValues.date}
          onChange={handleFieldChange}
        />
      </label>

      {errorMessage && (
        <small className="countdown-form-message countdown-form-message--error" role="alert">
          {errorMessage}
        </small>
      )}

      {statusMessage && (
        <small className="countdown-form-message countdown-form-message--success" role="status">
          {statusMessage}
        </small>
      )}

      <button type="submit" className="primary-button" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Update'}
      </button>
    </form>
  );
}
