package com.ailyricvideomaker.app.data.model

/**
 * Encapsulates the entire editable project state for persistence and rendering.
 */
data class ProjectData(
    val id: String = "default_project",
    val title: String = "My Lyric Video",
    val backgroundUri: String? = null,
    val audioUri: String? = null,
    val audioFileName: String? = null,
    val audioDurationMs: Long = 0L,
    val fontUri: String? = null,
    val fontName: String? = null,
    val selectedFontId: String? = null,
    val selectedFontPath: String? = null,
    val videoDuration: VideoDurationOption = VideoDurationOption.FULL_SONG,
    val rawLyricsText: String = "",
    val lyricLines: List<LyricLine> = emptyList(),
    val textStyle: TextStyleConfig = TextStyleConfig(),
    val animation: AnimationConfig = AnimationConfig()
)

