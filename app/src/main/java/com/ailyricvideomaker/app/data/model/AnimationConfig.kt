package com.ailyricvideomaker.app.data.model

enum class LyricAnimationStyle {
    FADE,
    SLIDE,
    HIGHLIGHT,
    ZOOM,
    TYPEWRITER
}

data class AnimationConfig(
    val style: LyricAnimationStyle = LyricAnimationStyle.FADE,
    val durationMs: Long = 350L,
    val highlightColorHex: String = "#F59E0B"
)
