import { get, onValue, ref, set } from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from './firebase';
import {
  normalizeCountdownRecord,
  sanitizeEventName,
} from '../utils/validation';

const STORAGE_KEY = 'project-countdown.current';
const COUNTDOWN_PATH = 'countdown/current';

function buildDefaultDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function buildDefaultCountdown() {
  return normalizeCountdownRecord({
    name: 'PROJECT COUNT',
    date: buildDefaultDateString(),
    mode: 'countdown',
    updatedAt: Date.now(),
  });
}

function getLocalCountdown() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return normalizeCountdownRecord(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

function setLocalCountdown(countdown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(countdown));
}

function getFallbackCountdown(localCountdown = getLocalCountdown()) {
  return localCountdown || buildDefaultCountdown();
}

function prepareCountdownForSave(countdown) {
  return normalizeCountdownRecord({
    ...countdown,
    name: sanitizeEventName(countdown?.name || ''),
    updatedAt: Date.now(),
  });
}

export async function fetchCurrentCountdown() {
  const localCountdown = getLocalCountdown();

  if (!isFirebaseConfigured()) {
    return {
      countdown: getFallbackCountdown(localCountdown),
      storageMode: 'local',
    };
  }

  try {
    const database = getFirebaseDatabase();
    const snapshot = await get(ref(database, COUNTDOWN_PATH));

    if (!snapshot.exists()) {
      return {
        countdown: getFallbackCountdown(localCountdown),
        storageMode: 'firebase',
      };
    }

    const countdown = normalizeCountdownRecord(snapshot.val());
    setLocalCountdown(countdown);

    return {
      countdown,
      storageMode: 'firebase',
    };
  } catch {
    return {
      countdown: getFallbackCountdown(localCountdown),
      storageMode: 'local',
    };
  }
}

export async function saveCurrentCountdown(countdown) {
  const preparedCountdown = prepareCountdownForSave(countdown);
  setLocalCountdown(preparedCountdown);

  if (!isFirebaseConfigured()) {
    return {
      countdown: preparedCountdown,
      storageMode: 'local',
    };
  }

  try {
    const database = getFirebaseDatabase();
    await set(ref(database, COUNTDOWN_PATH), preparedCountdown);

    return {
      countdown: preparedCountdown,
      storageMode: 'firebase',
    };
  } catch {
    return {
      countdown: preparedCountdown,
      storageMode: 'local',
    };
  }
}

export function subscribeToCurrentCountdown({ onCountdown, onError } = {}) {
  if (typeof window === 'undefined' || typeof onCountdown !== 'function') {
    return () => {};
  }

  if (!isFirebaseConfigured()) {
    function handleStorage(event) {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      onCountdown({
        countdown: getFallbackCountdown(),
        storageMode: 'local',
      });
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }

  const database = getFirebaseDatabase();
  const countdownRef = ref(database, COUNTDOWN_PATH);

  return onValue(
    countdownRef,
    (snapshot) => {
      const countdown = snapshot.exists()
        ? normalizeCountdownRecord(snapshot.val())
        : getFallbackCountdown();

      setLocalCountdown(countdown);
      onCountdown({
        countdown,
        storageMode: 'firebase',
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}
