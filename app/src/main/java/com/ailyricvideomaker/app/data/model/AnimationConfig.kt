package com.ailyricvideomaker.app.data.model

enum class LyricAnimationStyle {
    FADE,
    SLIDE,
    HIGHLIGHT,
    ZOOM,
    TYPEWRITER,
    POP,
    BOUNCE,
    BLUR_IN,
    SCALE_IN,
    ROTATE_IN,
    WORD_BY_WORD,
    LETTER_REVEAL,
    GLOW_PULSE,
    SHAKE,
    ELASTIC,
    RISE_UP,
    DROP_DOWN,
    WIPE_LEFT,
    WIPE_RIGHT
}

enum class RhythmPreset(val displayName: String, val speedMultiplier: Float, val scaleIntensity: Float) {
    SMOOTH("Smooth", 0.9f, 1.05f),
    CINEMATIC("Cinematic", 0.75f, 1.08f),
    BEAT("Beat", 1.15f, 1.15f),
    FAST_BEAT("Fast Beat", 1.4f, 1.22f),
    SLOW_BEAT("Slow Beat", 0.85f, 1.10f),
    POP("Pop", 1.25f, 1.25f),
    BOUNCE_BEAT("Bounce Beat", 1.3f, 1.20f),
    PULSE("Pulse", 1.1f, 1.12f),
    KARAOKE("Karaoke", 1.0f, 1.05f),
    DYNAMIC("Dynamic", 1.2f, 1.18f),
    ENERGETIC("Energetic", 1.35f, 1.24f),
    EMOTIONAL("Emotional", 0.8f, 1.06f),
    MINIMAL("Minimal", 0.95f, 1.02f),
    DANCE("Dance", 1.45f, 1.26f),
    DRAMATIC("Dramatic", 0.7f, 1.16f)
}

enum class VideoDurationOption(val label: String, val maxSeconds: Int) {
    THIRTY_SECONDS("30 Seconds", 30),
    SIXTY_SECONDS("60 Seconds", 60),
    FULL_SONG("Full Song", Int.MAX_VALUE)
}

data class AnimationConfig(
    val style: LyricAnimationStyle = LyricAnimationStyle.FADE,
    val rhythmPreset: RhythmPreset = RhythmPreset.SMOOTH,
    val durationMs: Long = 350L,
    val speedMultiplier: Float = 1.0f,
    val highlightColorHex: String = "#F59E0B"
)

