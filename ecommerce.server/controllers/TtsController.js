const { Router } = require('express');
const axios = require('axios');

const ttsRouter = Router();
const TTS_BASE_URL = process.env.TTS_BASE_URL || 'http://localhost:8091';

/**
 * POST /api/v1/ecommerce/tts
 * Proxy text-to-speech generation to local Piper TTS server (Amy / Nepali Google 2)
 */
ttsRouter.post('/', async (req, res) => {
  try {
    const { text, lang = 'auto', voice, speed = 1.0 } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required for TTS' });
    }

    const ttsRes = await axios.post(
      `${TTS_BASE_URL}/api/v1/tts`,
      {
        text: text.trim(),
        lang,
        voice,
        speed,
      },
      {
        responseType: 'arraybuffer',
        timeout: 10000,
      }
    );

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', ttsRes.data.length);
    return res.send(Buffer.from(ttsRes.data));
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Local Piper TTS service offline. Run "npm run dev:tts" to start it.',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/ecommerce/tts/health
 */
ttsRouter.get('/health', async (req, res) => {
  try {
    const healthRes = await axios.get(`${TTS_BASE_URL}/api/health`, { timeout: 2000 });
    return res.json({ success: true, tts: healthRes.data });
  } catch (error) {
    return res.json({ success: false, status: 'offline', error: error.message });
  }
});

module.exports = { ttsRouter };
