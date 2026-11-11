// Un error que el cliente puede entender: lleva el código HTTP y una clave estable
// que la app traduce. Todo lo demás sale como 500, sin detalles internos.
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFound(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Esa ruta no existe.'));
}

// Express reconoce el manejador de errores porque recibe cuatro parámetros.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  // express.json() marca así un cuerpo que no es JSON (400) o que pesa demasiado (413).
  // Conservo el código HTTP que trae y dejo un solo código para que la app lo traduzca.
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    res.status(error.status).json({ error: { code: 'INVALID_REQUEST', message: 'La solicitud no es válida.' } });
    return;
  }
  console.error(`${req.method} ${req.path} falló:`, error.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'El servidor falló.' } });
}

module.exports = { ApiError, errorHandler, notFound };