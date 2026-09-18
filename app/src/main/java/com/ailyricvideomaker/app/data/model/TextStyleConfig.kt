package com.ailyricvideomaker.app.data.model

/**
 * Styling controls for lyric video typography.
 */
data class TextStyleConfig(
    val fontSizeSp: Float = 26f,
    val textColorHex: String = "#FFFFFF",
    val textOpacity: Float = 1.0f,
    val alignment: TextAlignment = TextAlignment.CENTER,
    val verticalBias: Float = 0.5f, // 0.0 top, 0.5 center, 1.0 bottom
    val shadowEnabled: Boolean = true,
    val shadowColorHex: String = "#000000",
    val shadowRadius: Float = 8f,
    val strokeEnabled: Boolean = true,
    val strokeColorHex: String = "#000000",
    val strokeWidthDp: Float = 2f,
    val letterSpacingSp: Float = 0.5f,
    val lineSpacingMultiplier: Float = 1.25f
) {
    companion object {
        val PRESET_COLORS = listOf(
            "#FFFFFF", // White
            "#CBD5E1", // Silver
            "#94A3B8", // Slate
            "#000000", // Black
            "#EF4444", // Red
            "#F87171", // Coral
            "#F43F5E", // Rose
            "#EC4899", // Pink
            "#A855F7", // Purple
            "#8B5CF6", // Violet
            "#6366F1", // Indigo
            "#3B82F6", // Blue
            "#0EA5E9", // Sky
            "#06B6D4", // Cyan
            "#14B8A6", // Teal
            "#10B981", // Emerald
            "#22C55E", // Green
            "#84CC16", // Lime
            "#EAB308", // Yellow
            "#F59E0B", // Gold
            "#D97706", // Amber
            "#F97316", // Orange
            "#B45309", // Bronze
            "#FEF3C7"  // Warm Cream
        )
    }
}

enum class TextAlignment {
    LEFT,
    CENTER,
    RIGHT
}

