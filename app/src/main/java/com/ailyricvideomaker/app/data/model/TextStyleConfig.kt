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
)

enum class TextAlignment {
    LEFT,
    CENTER,
    RIGHT
}
