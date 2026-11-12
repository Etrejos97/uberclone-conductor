import { useEffect, useMemo, useRef, useState } from 'react';

// Un reloj por solicitud. `deadlines` es { id: hora límite en ms };
// devuelve { id: segundos que faltan } y llama `onExpire(id)` una sola vez
// cuando la hora límite de ese id pasa. Un solo setInterval sirve a todas, y
// solo corre mientras haya alguna. Calculo con la hora del teléfono en vez de
// restar 1 por tick, porque setInterval se atrasa con la app ocupada.
export default function useCountdown(deadlines, seconds, onExpire) {
  const [now, setNow] = useState(() => Date.now());
  const expire = useRef(onExpire);
  const expired = useRef(new Set());
  const active = Object.keys(deadlines).length > 0;

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!active) return undefined;
    // `now` viene de antes de que llegara la primera solicitud: lo pongo al día ya.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    // El intervalo se apaga cuando no quedan solicitudes o al salir.
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    for (const [id, deadline] of Object.entries(deadlines)) {
      if (deadline <= now && !expired.current.has(id)) {
        expired.current.add(id);
        expire.current?.(id);
      }
    }
  }, [deadlines, now]);

  // `now` puede venir de antes de que llegara la solicitud: el tope evita
  // mostrar más de `seconds` durante ese primer instante.
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(deadlines).map(([id, deadline]) => [
          id,
          Math.min(seconds, Math.max(0, Math.ceil((deadline - now) / 1000))),
        ])
      ),
    [deadlines, now, seconds]
  );
}