import { SAVE_TIMEOUT_MS } from '../config/app';

// Sin red, el SDK de Firestore deja la escritura en cola y la promesa queda
// pendiente hasta que vuelve la conexión. Después de SAVE_TIMEOUT_MS dejo de
// esperar y lanzo un error con code 'timeout', igual que uploadService.
// No cancelo la escritura: puede llegar al servidor después, así que quien
// llama le pregunta al servidor si llegó antes de dar el fallo por bueno.
export function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`Firestore no respondió en ${SAVE_TIMEOUT_MS / 1000} s`);
      error.code = 'timeout';
      reject(error);
    }, SAVE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}