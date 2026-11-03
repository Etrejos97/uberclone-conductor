// los únicos caminos que puede seguir un viaje.

export const TRIP_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

const S = TRIP_STATUS;

export const TRANSITIONS = {
  [S.REQUESTED]: [S.ACCEPTED, S.REJECTED],
  [S.ACCEPTED]: [S.DRIVER_ARRIVING, S.CANCELLED],
  [S.DRIVER_ARRIVING]: [S.IN_PROGRESS, S.CANCELLED],
  [S.IN_PROGRESS]: [S.COMPLETED],
  [S.COMPLETED]: [S.PAID],
  [S.REJECTED]: [],
  [S.CANCELLED]: [],
  [S.PAID]: [],
};

// Estados en los que el conductor tiene un viaje abierto: la app abre el TripStack.
export const ACTIVE_STATUSES = [S.ACCEPTED, S.DRIVER_ARRIVING, S.IN_PROGRESS, S.COMPLETED];

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function isActive(status) {
  return ACTIVE_STATUSES.includes(status);
}

export function isFinal(status) {
  return status in TRANSITIONS && TRANSITIONS[status].length === 0;
}