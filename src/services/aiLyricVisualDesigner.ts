import {
  ProjectData,
  LyricLine,
  WordTiming,
  AILyricDesignStyle,
  MusicVisualizerType,
  ColorPalettePreset,
  COLOR_PALETTE_PRESETS,
  AILyricDesignerConfig,
  LineVisualDesign,
  WordVisualDesign,
  WordSizeTier,
  WordAnimation,
  FontItem,
  BUILTIN_TAMIL_FONTS,
  DEFAULT_AI_DESIGNER_CONFIG,
} from '../types/project';

/**
 * List of emotionally resonant Tamil and English keywords to emphasize
 */
const HIGH_EMPHASIS_TAMIL_WORDS = new Set([
  'உயிரே',
  'காதலே',
  'காதல்',
  'கண்ணே',
  'கலைமானே',
  'அன்பே',
  'இதயம்',
  'தாய்ப்பால்',
  'அம்மா',
  'உயிர்',
  'நெஞ்சில்',
  'வாழும்',
  'ரோஜா',
  'கண்டேன்',
  'மலரே',
  'நினைவுகள்',
  'காதலிக்கிறேன்',
  'என்றும்',
  'வானம்',
  'நிலவே',
  'தேவதை',
  'கண்ணீர்',
  'மூச்சு',
]);

const HIGH_EMPHASIS_ENGLISH_WORDS = new Set([
  'love',
  'loving',
  'sweet',
  'heart',
  'melody',
  'forever',
  'memories',
  'bright',
  'soul',
  'breathe',
  'magic',
  'dream',
  'shine',
  'night',
  'calm',
  'life',
]);

const LOW_EMPHASIS_WORDS = new Set([
  'நான்',
  'நீ',
  'என்',
  'உன்',
  'ஒரு',
  'இல்',
  'க்கு',
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'so',
  'and',
  'or',
]);

export class AILyricVisualDesigner {
  /**
   * Generates a complete AI Visual Design layer for the project while strictly
   * preserving all existing Gemini synchronization timing.
   */
  public static generateDesign(
    project: ProjectData,
    styleOverride?: AILyricDesignStyle,
    paletteOverride?: ColorPalettePreset
  ): AILyricDesignerConfig {
    const activeStyle: AILyricDesignStyle =
      styleOverride || project.aiDesignerConfig?.activeStyle || 'AI_AUTO';

    const colorPalette: ColorPalettePreset =
      paletteOverride || project.aiDesignerConfig?.colorPalette || 'WHITE_GOLD';

    const palette = COLOR_PALETTE_PRESETS[colorPalette] || COLOR_PALETTE_PRESETS.WHITE_GOLD;

    // Available fonts
    const fontLibrary = project.aiDesignerConfig?.fontLibrary || BUILTIN_TAMIL_FONTS;

    // Select primary, secondary and decorative fonts based on style
    const { primaryFont, secondaryFont, decorativeFont } = this.selectFontsForStyle(
      activeStyle,
      fontLibrary
    );

    // Select visualizer type based on style & energy
    const activeVisualizer = this.selectVisualizerForStyle(activeStyle);

    // Compute visual energy (0 - 100)
    const visualEnergy = this.computeVisualEnergy(activeStyle);

    // Background camera motion
    const backgroundMotion = this.selectBackgroundMotion(activeStyle, visualEnergy);

    // Generate individual line & word designs
    const lines: Record<string, LineVisualDesign> = {};

    project.lyrics.forEach((line, lineIndex) => {
      lines[line.id] = this.designLine(
        line,
        lineIndex,
        project.lyrics.length,
        activeStyle,
        palette,
        primaryFont,
        secondaryFont,
        decorativeFont,
        visualEnergy
      );
    });

    return {
      activeStyle,
      activeVisualizer,
      visualizerPosition: activeStyle === 'CINEMATIC_FLOAT' ? 'center' : 'bottom',
      colorPalette,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      secondaryColor: palette.secondary,
      glowColor: palette.glow,
      shadowColor: palette.shadow,
      visualEnergy,
      backgroundMotion,
      primaryFontFamily: primaryFont.family,
      primaryFontName: primaryFont.name,
      secondaryFontFamily: secondaryFont.family,
      secondaryFontName: secondaryFont.name,
      decorativeFontFamily: decorativeFont.family,
      decorativeFontName: decorativeFont.name,
      lines,
      fontLibrary,
    };
  }

  /**
   * Regenerates ONLY the color palette and word color accents.
   * Preserves all typography, layouts, animations, and timing.
   */
  public static regenerateColors(
    currentConfig: AILyricDesignerConfig,
    newPalette: ColorPalettePreset
  ): AILyricDesignerConfig {
    const palette = COLOR_PALETTE_PRESETS[newPalette] || COLOR_PALETTE_PRESETS.WHITE_GOLD;
    const updatedLines: Record<string, LineVisualDesign> = {};

    Object.entries(currentConfig.lines).forEach(([lineId, lineDesign]) => {
      const updatedWords: WordVisualDesign[] = lineDesign.words.map((w) => {
        let newColor = palette.primary;
        if (w.colorRole === 'accent') newColor = palette.accent;
        else if (w.colorRole === 'secondary') newColor = palette.secondary;
        return { ...w, color: newColor };
      });
      updatedLines[lineId] = { ...lineDesign, words: updatedWords };
    });

    return {
      ...currentConfig,
      colorPalette: newPalette,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      secondaryColor: palette.secondary,
      glowColor: palette.glow,
      shadowColor: palette.shadow,
      lines: updatedLines,
    };
  }

  /**
   * Regenerates ONLY typography (font families & sizes) without altering timing.
   */
  public static regenerateTypography(
    project: ProjectData,
    currentConfig: AILyricDesignerConfig
  ): AILyricDesignerConfig {
    const fontLibrary = currentConfig.fontLibrary || BUILTIN_TAMIL_FONTS;
    const shuffled = [...fontLibrary].sort(() => Math.random() - 0.5);
    const primary = shuffled[0] || BUILTIN_TAMIL_FONTS[0];
    const secondary = shuffled[1] || BUILTIN_TAMIL_FONTS[1];
    const decorative = shuffled[2] || BUILTIN_TAMIL_FONTS[3];

    const updatedLines: Record<string, LineVisualDesign> = {};
    Object.entries(currentConfig.lines).forEach(([lineId, lineDesign]) => {
      const updatedWords = lineDesign.words.map((w, idx) => {
        const isDecorative = w.sizeTier === 'very_large' || idx % 3 === 0;
        const chosenFamily = isDecorative
          ? decorative.family
          : w.colorRole === 'accent'
          ? secondary.family
          : primary.family;
        return { ...w, fontFamily: chosenFamily };
      });
      updatedLines[lineId] = { ...lineDesign, words: updatedWords };
    });

    return {
      ...currentConfig,
      primaryFontFamily: primary.family,
      primaryFontName: primary.name,
      secondaryFontFamily: secondary.family,
      secondaryFontName: secondary.name,
      decorativeFontFamily: decorative.family,
      decorativeFontName: decorative.name,
      lines: updatedLines,
    };
  }

  /**
   * Regenerates ONLY animation transitions with fresh anti-repetition patterns.
   */
  public static regenerateAnimations(
    currentConfig: AILyricDesignerConfig
  ): AILyricDesignerConfig {
    const animationPool: WordAnimation[] = [
      'scale_pop',
      'slide_left',
      'slide_right',
      'fade_zoom',
      'rise_bottom',
      'blur_reveal',
      'beat_impact',
      'kinetic_drift',
      'float',
      'letter_reveal',
      'wipe',
    ];

    const updatedLines: Record<string, LineVisualDesign> = {};
    Object.entries(currentConfig.lines).forEach(([lineId, lineDesign]) => {
      const updatedWords = lineDesign.words.map((w, idx) => {
        const anim = animationPool[(idx + Math.floor(Math.random() * 5)) % animationPool.length];
        return { ...w, animation: anim };
      });
      updatedLines[lineId] = { ...lineDesign, words: updatedWords };
    });

    return {
      ...currentConfig,
      lines: updatedLines,
    };
  }

  /**
   * Regenerates ONLY the music visualizer type.
   */
  public static regenerateVisualizer(
    currentConfig: AILyricDesignerConfig,
    newType?: MusicVisualizerType
  ): AILyricDesignerConfig {
    const allTypes: MusicVisualizerType[] = [
      'AUDIO_EQUALIZER',
      'CIRCULAR_EQUALIZER',
      'WAVEFORM',
      'AUDIO_RINGS',
      'PARTICLE_PULSE',
      'GLOW_PULSE',
      'BASS_PULSE',
      'EDGE_VISUALIZER',
      'WAVE_LINES',
      'MINIMAL_DOT_VISUALIZER',
    ];

    const nextType =
      newType ||
      allTypes[(allTypes.indexOf(currentConfig.activeVisualizer) + 1) % allTypes.length];

    return {
      ...currentConfig,
      activeVisualizer: nextType,
    };
  }

  /**
   * Adjusts the overall visual energy (e.g. Make It More Dynamic or Cinematic).
   */
  public static setVisualEnergy(
    currentConfig: AILyricDesignerConfig,
    energy: number
  ): AILyricDesignerConfig {
    const clamped = Math.max(10, Math.min(100, energy));
    return {
      ...currentConfig,
      visualEnergy: clamped,
      backgroundMotion: {
        ...currentConfig.backgroundMotion,
        intensity: clamped > 70 ? 1.3 : clamped < 40 ? 0.7 : 1.0,
        beatPulseScale: clamped > 70 ? 1.04 : 1.02,
      },
    };
  }

  /**
   * Changes the dynamic layout and positions.
   */
  public static regenerateLayout(
    currentConfig: AILyricDesignerConfig
  ): AILyricDesignerConfig {
    const layouts: LineVisualDesign['layoutType'][] = [
      'centered',
      'scattered',
      'staggered_diagonal',
      'upper_emphasis',
      'lower_floating',
      'stacked_contrast',
    ];

    const updatedLines: Record<string, LineVisualDesign> = {};
    Object.entries(currentConfig.lines).forEach(([lineId, lineDesign], idx) => {
      const nextLayout = layouts[(idx + 1) % layouts.length];
      const nextVertical =
        nextLayout === 'upper_emphasis'
          ? 28
          : nextLayout === 'lower_floating'
          ? 72
          : 45 + ((idx % 3) - 1) * 12;

      updatedLines[lineId] = {
        ...lineDesign,
        layoutType: nextLayout,
        verticalPositionPercent: nextVertical,
      };
    });

    return {
      ...currentConfig,
      lines: updatedLines,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Heuristic & Rule Engine
  // ---------------------------------------------------------------------------

  private static selectFontsForStyle(
    style: AILyricDesignStyle,
    library: FontItem[]
  ): { primaryFont: FontItem; secondaryFont: FontItem; decorativeFont: FontItem } {
    const getByCategory = (cat: FontItem['category']) =>
      library.find((f) => f.category === cat) || library[0] || BUILTIN_TAMIL_FONTS[0];

    switch (style) {
      case 'HANDWRITTEN':
      case 'CINEMATIC_FLOAT':
        return {
          primaryFont: getByCategory('handwritten'),
          secondaryFont: getByCategory('decorative'),
          decorativeFont: getByCategory('cinematic'),
        };
      case 'DYNAMIC_POP':
      case 'BEAT_POP':
      case 'CINEMATIC_CHAOS':
        return {
          primaryFont: getByCategory('bold'),
          secondaryFont: getByCategory('modern'),
          decorativeFont: getByCategory('decorative'),
        };
      case 'MODERN_MINIMAL':
      case 'WORD_REVEAL':
        return {
          primaryFont: getByCategory('modern'),
          secondaryFont: getByCategory('cinematic'),
          decorativeFont: getByCategory('unicode'),
        };
      case 'SCATTERED_WORDS':
      case 'BIG_SMALL':
      case 'KINETIC_TYPOGRAPHY':
      default:
        return {
          primaryFont: getByCategory('unicode'),
          secondaryFont: getByCategory('decorative'),
          decorativeFont: getByCategory('bold'),
        };
    }
  }

  private static selectVisualizerForStyle(style: AILyricDesignStyle): MusicVisualizerType {
    switch (style) {
      case 'CINEMATIC_FLOAT':
      case 'HANDWRITTEN':
        return 'WAVE_LINES';
      case 'BEAT_POP':
      case 'DYNAMIC_POP':
        return 'AUDIO_EQUALIZER';
      case 'CINEMATIC_CHAOS':
        return 'PARTICLE_PULSE';
      case 'MODERN_MINIMAL':
        return 'MINIMAL_DOT_VISUALIZER';
      case 'KINETIC_TYPOGRAPHY':
        return 'CIRCULAR_EQUALIZER';
      case 'BIG_SMALL':
        return 'AUDIO_RINGS';
      case 'SCATTERED_WORDS':
        return 'EDGE_VISUALIZER';
      case 'WORD_REVEAL':
        return 'GLOW_PULSE';
      case 'AI_AUTO':
      case 'AI_MIX':
      default:
        return 'WAVEFORM';
    }
  }

  private static computeVisualEnergy(style: AILyricDesignStyle): number {
    switch (style) {
      case 'CINEMATIC_CHAOS':
        return 95;
      case 'DYNAMIC_POP':
      case 'BEAT_POP':
        return 85;
      case 'KINETIC_TYPOGRAPHY':
      case 'BIG_SMALL':
        return 75;
      case 'SCATTERED_WORDS':
        return 65;
      case 'WORD_REVEAL':
        return 55;
      case 'CINEMATIC_FLOAT':
      case 'HANDWRITTEN':
        return 40;
      case 'MODERN_MINIMAL':
        return 30;
      case 'AI_AUTO':
      case 'AI_MIX':
      default:
        return 65;
    }
  }

  private static selectBackgroundMotion(
    style: AILyricDesignStyle,
    energy: number
  ): AILyricDesignerConfig['backgroundMotion'] {
    if (style === 'CINEMATIC_CHAOS' || energy >= 85) {
      return {
        type: 'BEAT_SCALE_PULSE',
        intensity: 1.25,
        beatPulseScale: 1.035,
      };
    }
    if (style === 'CINEMATIC_FLOAT' || style === 'HANDWRITTEN') {
      return {
        type: 'SLOW_ZOOM_IN',
        intensity: 0.8,
        beatPulseScale: 1.015,
      };
    }
    if (style === 'KINETIC_TYPOGRAPHY') {
      return {
        type: 'PAN_HORIZONTAL',
        intensity: 1.0,
        beatPulseScale: 1.02,
      };
    }
    return {
      type: 'SLOW_ZOOM_IN',
      intensity: 1.0,
      beatPulseScale: 1.02,
    };
  }

  /**
   * Designs a single lyric line with word-level sizes, positions, animations, and typography.
   */
  private static designLine(
    line: LyricLine,
    lineIndex: number,
    totalLines: number,
    style: AILyricDesignStyle,
    palette: { primary: string; accent: string; secondary: string; glow: string; shadow: string },
    primaryFont: FontItem,
    secondaryFont: FontItem,
    decorativeFont: FontItem,
    energy: number
  ): LineVisualDesign {
    // 1. Determine line layout and positions
    let layoutType: LineVisualDesign['layoutType'] = 'centered';
    let verticalPercent = 50;

    switch (style) {
      case 'SCATTERED_WORDS':
        layoutType = 'scattered';
        verticalPercent = 38 + ((lineIndex % 4) * 8);
        break;
      case 'BIG_SMALL':
        layoutType = 'stacked_contrast';
        verticalPercent = lineIndex % 2 === 0 ? 44 : 54;
        break;
      case 'DYNAMIC_POP':
      case 'BEAT_POP':
      case 'CINEMATIC_CHAOS':
        layoutType = lineIndex % 3 === 0 ? 'staggered_diagonal' : 'centered';
        verticalPercent = 42 + ((lineIndex % 3) * 6);
        break;
      case 'MODERN_MINIMAL':
        layoutType = 'centered';
        verticalPercent = 58;
        break;
      case 'CINEMATIC_FLOAT':
      case 'HANDWRITTEN':
        layoutType = 'lower_floating';
        verticalPercent = 64;
        break;
      case 'AI_AUTO':
      case 'AI_MIX':
      default:
        // Smart alternation across song phases: verse -> upper/lower, chorus -> centered/diagonal
        if (lineIndex < totalLines * 0.3) {
          layoutType = 'lower_floating';
          verticalPercent = 62;
        } else if (lineIndex < totalLines * 0.7) {
          layoutType = lineIndex % 2 === 0 ? 'centered' : 'staggered_diagonal';
          verticalPercent = 48;
        } else {
          layoutType = 'stacked_contrast';
          verticalPercent = 45;
        }
    }

    // 2. Break down into words with variable word sizes & anti-repetition animations
    const rawWords = line.words && line.words.length > 0
      ? line.words.map((w) => ({ id: w.id, text: w.word }))
      : line.text.split(/\s+/).filter(Boolean).map((t, i) => ({ id: `${line.id}_w${i}`, text: t }));

    const animationSequence: WordAnimation[] = [
      'scale_pop',
      'slide_left',
      'fade_zoom',
      'rise_bottom',
      'blur_reveal',
      'beat_impact',
      'kinetic_drift',
      'float',
      'letter_reveal',
      'wipe',
    ];

    const wordsDesign: WordVisualDesign[] = rawWords.map((w, wIndex) => {
      const cleanWord = w.text.trim().replace(/[.,!?:;❤️]/g, '');
      const isTamilHigh = HIGH_EMPHASIS_TAMIL_WORDS.has(cleanWord);
      const isEnglishHigh = HIGH_EMPHASIS_ENGLISH_WORDS.has(cleanWord.toLowerCase());
      const isLow = LOW_EMPHASIS_WORDS.has(cleanWord.toLowerCase());

      // Word size tier calculation
      let sizeTier: WordSizeTier = 'medium';
      let fontSize = 32;

      if (style === 'BIG_SMALL' || style === 'DYNAMIC_POP' || style === 'CINEMATIC_CHAOS') {
        if (isTamilHigh || isEnglishHigh || cleanWord.length > 8) {
          sizeTier = 'very_large';
          fontSize = 56;
        } else if (isLow) {
          sizeTier = 'small';
          fontSize = 24;
        } else if (wIndex === rawWords.length - 1) {
          sizeTier = 'large';
          fontSize = 44;
        } else {
          sizeTier = 'medium';
          fontSize = 32;
        }
      } else if (style === 'MODERN_MINIMAL') {
        if (isTamilHigh || isEnglishHigh) {
          sizeTier = 'large';
          fontSize = 40;
        } else {
          sizeTier = 'medium';
          fontSize = 28;
        }
      } else {
        // Standard adaptive scaling
        if (isTamilHigh || isEnglishHigh) {
          sizeTier = 'large';
          fontSize = 46;
        } else if (isLow) {
          sizeTier = 'small';
          fontSize = 26;
        } else {
          sizeTier = 'medium';
          fontSize = 34;
        }
      }

      // Color role: important words get gold/accent, others primary
      const isAccent = isTamilHigh || isEnglishHigh || (wIndex === rawWords.length - 1 && rawWords.length > 2);
      const colorRole: WordVisualDesign['colorRole'] = isAccent ? 'accent' : 'primary';
      const color = isAccent ? palette.accent : palette.primary;

      // Font selection
      const chosenFont =
        sizeTier === 'very_large'
          ? decorativeFont.family
          : isAccent
          ? secondaryFont.family
          : primaryFont.family;

      // Anti-repetition animation assignment
      const animIndex = (lineIndex * 3 + wIndex) % animationSequence.length;
      let anim = animationSequence[animIndex];

      // Style specific overrides
      if (style === 'CINEMATIC_FLOAT') anim = 'float';
      else if (style === 'WORD_REVEAL') anim = 'blur_reveal';
      else if (style === 'BEAT_POP' && isAccent) anim = 'beat_impact';

      // Slight organic rotation for dynamic styles
      let rotationDeg = 0;
      if (style === 'DYNAMIC_POP' || style === 'CINEMATIC_CHAOS') {
        rotationDeg = ((wIndex % 3) - 1) * (sizeTier === 'very_large' ? 3.5 : 2.0);
      }

      // Effects
      const effect: WordVisualDesign['effect'] =
        isAccent && energy > 50
          ? 'glow'
          : style === 'MODERN_MINIMAL'
          ? 'none'
          : 'shadow';

      // Micro offsets for scattered layout
      const offsetX = layoutType === 'scattered' ? ((wIndex % 4) - 1.5) * 22 : 0;
      const offsetY = layoutType === 'scattered' ? ((wIndex % 2) - 0.5) * 16 : 0;

      return {
        wordId: w.id,
        word: w.text,
        sizeTier,
        fontSize,
        colorRole,
        color,
        fontFamily: chosenFont,
        animation: anim,
        rotationDeg,
        effect,
        offsetX,
        offsetY,
      };
    });

    return {
      lineId: line.id,
      layoutType,
      verticalPositionPercent: verticalPercent,
      horizontalPositionPercent: 50,
      entranceAnimation:
        style === 'CINEMATIC_FLOAT' ? 'blur_in' : lineIndex % 2 === 0 ? 'slide_up' : 'scale_pop',
      exitAnimation: style === 'CINEMATIC_FLOAT' ? 'fade_out' : 'zoom_out',
      words: wordsDesign,
    };
  }
}
