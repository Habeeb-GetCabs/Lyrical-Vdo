import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.use(express.json({ limit: '10mb' }));

// Premium background mapping for templates & visual themes
const THEME_IMAGES: Record<string, string[]> = {
  islamic_elegant: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80', // Elegant Golden
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80', // Beautiful mosque interior
  ],
  masjid_cinematic: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80', // Mosque silhouette
    'https://images.unsplash.com/photo-1590076215667-873d6f009090?auto=format&fit=crop&w=1080&q=80', // Majestic Islamic architecture
  ],
  makkah_madinah: [
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1080&q=80', // Madinah
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80', // Kaaba atmosphere
  ],
  moon_night: [
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80', // Starry starry night
    'https://images.unsplash.com/photo-1532798369041-b33eb576ef16?auto=format&fit=crop&w=1080&q=80', // Crescent moon & stars
  ],
  golden_mosque: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80', // Gold lit mosque
  ],
  desert_sunset: [
    'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1080&q=80', // Desert Dunes
  ],
  nature_mountains: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', // Epic mountain range
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1080&q=80', // Serene forest
  ],
  rain_peace: [
    'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1080&q=80', // Soft rain on green nature
  ],
  ramadan: [
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80', // Lantern/festive vibes
  ],
};

// API Route for AI Image Generation
app.post('/api/gemini/generate-image', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Gemini AI client not initialized. Check GEMINI_API_KEY.' });
  }

  const { prompt, aspectRatio = '9:16' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required for image generation.' });
  }

  try {
    // Keep prompts respectful and suited for Quranic themes
    const decoratedPrompt = `A respectful, beautiful, and peaceful background for Quranic verses recitation. Theme: ${prompt}. Photorealistic, serene, high quality, soft cinematic lighting, sacred atmosphere, negative space for text overlays.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: decoratedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    let base64Image = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error('No image binary returned in the model response.');
    }

    const dataUrl = `data:image/png;base64,${base64Image}`;
    res.json({ url: dataUrl });
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed.' });
  }
});

// API Route for AI Auto Create & Smart Styling
app.post('/api/gemini/auto-create', async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Gemini AI client not initialized.' });
  }

  const { verses, durationMs = 30000, theme = 'auto' } = req.body;

  try {
    const prompt = `
      You are an expert Islamic video producer. Create a beautiful, respectful visual design for a Quranic video containing these verses:
      ${JSON.stringify(verses)}
      
      Total audio duration is ${durationMs}ms.
      Suggested visual theme is: "${theme}".
      
      Plan:
      1. Choose the most appropriate color palette preset (choices: WHITE_GOLD, WARM_CINEMATIC, COOL_CINEMATIC, WHITE_YELLOW, MONOCHROME).
      2. Choose the background motion style (choices: SLOW_ZOOM_IN, SLOW_ZOOM_OUT, PAN_HORIZONTAL, PAN_VERTICAL, BEAT_SCALE_PULSE).
      3. Distribute background images over the timeline: partition the total duration of ${durationMs}ms into 3-5 segments, each assigned a specific visual motif matching the theme (such as "masjid silhouette", "clouds and heaven", "night sky", "elegant golden patterns").
      4. Suggest a suitable music visualizer preset (choices: WAVEFORM, AUDIO_EQUALIZER, CIRCULAR_EQUALIZER, AUDIO_RINGS, GLOW_PULSE, MINIMAL_DOT_VISUALIZER).
      5. Recommend a typography family suitable for Quranic display (choices: 'Playfair Display', serif or 'Mukta Malar', sans-serif).
      
      Provide your response strictly in JSON format. Do NOT alter, rewrite, or modify the text of any Quran verses. Under no circumstances change any start or end timestamps of the verses.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colorPalette: { type: Type.STRING, description: 'Selected ColorPalettePreset' },
            backgroundMotionType: { type: Type.STRING, description: 'Selected CinematicBackgroundMotion type' },
            activeVisualizer: { type: Type.STRING, description: 'Selected MusicVisualizerType' },
            fontFamily: { type: Type.STRING, description: 'Font family selector' },
            fontName: { type: Type.STRING, description: 'Sleek Font Name label' },
            themeSelected: { type: Type.STRING, description: 'Islamic theme category picked' },
            timelineMotifs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  motif: { type: Type.STRING, description: 'Unsplash or category description (e.g. night, mosque, mountains)' },
                  startTimeMs: { type: Type.INTEGER },
                  endTimeMs: { type: Type.INTEGER },
                  transition: { type: Type.STRING, description: 'fade, zoom, none' },
                  zoom: { type: Type.STRING, description: 'slow_in, slow_out, none' },
                  pan: { type: Type.STRING, description: 'left, right, none' },
                },
                required: ['motif', 'startTimeMs', 'endTimeMs'],
              },
            },
          },
          required: ['colorPalette', 'backgroundMotionType', 'activeVisualizer', 'fontFamily', 'timelineMotifs'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    
    // Map selected motifs to beautiful Unsplash assets automatically
    const defaultMotifUrls: Record<string, string> = {
      masjid: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80',
      mosque: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80',
      night: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80',
      moon: 'https://images.unsplash.com/photo-1532798369041-b33eb576ef16?auto=format&fit=crop&w=1080&q=80',
      mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80',
      desert: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1080&q=80',
      nature: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1080&q=80',
      sky: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1080&q=80',
      elegant: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    };

    const timelineImages = parsedData.timelineMotifs?.map((motifItem: any, index: number) => {
      const lowerMotif = (motifItem.motif || '').toLowerCase();
      let matchedUrl = defaultMotifUrls.elegant; // fallback

      for (const [key, value] of Object.entries(defaultMotifUrls)) {
        if (lowerMotif.includes(key)) {
          matchedUrl = value;
          break;
        }
      }

      // Add variation if multiple matches have the same motif
      if (matchedUrl === defaultMotifUrls.elegant && index === 1) {
        matchedUrl = defaultMotifUrls.sky;
      } else if (matchedUrl === defaultMotifUrls.elegant && index === 2) {
        matchedUrl = defaultMotifUrls.night;
      }

      return {
        id: `img_${index}_${Date.now()}`,
        url: matchedUrl,
        startTimeMs: motifItem.startTimeMs,
        endTimeMs: motifItem.endTimeMs,
        durationMs: motifItem.endTimeMs - motifItem.startTimeMs,
        zoom: motifItem.zoom || 'slow_in',
        pan: motifItem.pan || 'none',
        transition: motifItem.transition || 'fade',
        positionX: 50,
        positionY: 50,
        scale: 1,
      };
    });

    res.json({
      designConfig: {
        colorPalette: parsedData.colorPalette || 'WHITE_GOLD',
        backgroundMotionType: parsedData.backgroundMotionType || 'SLOW_ZOOM_IN',
        activeVisualizer: parsedData.activeVisualizer || 'WAVEFORM',
        fontFamily: parsedData.fontFamily || "'Playfair Display', serif",
        fontName: parsedData.fontName || 'Playfair Display (Serif)',
      },
      timelineImages,
    });
  } catch (error: any) {
    console.error('AI Auto Create Error:', error);
    res.status(500).json({ error: error.message || 'Auto Create generation failed.' });
  }
});

// Serve frontend SPA
const startExpress = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startExpress();
