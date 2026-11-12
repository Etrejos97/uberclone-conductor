const { Router } = require('express');

const router = Router();

// La app llama aquí al abrirse para despertar el servicio de Render.
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;