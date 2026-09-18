package com.ailyricvideomaker.app.data.model

import java.util.Locale
import java.util.UUID

/**
 * Represents a single synchronized lyric line with millisecond-precision timestamps.
 */
data class LyricLine(
    val id: String = UUID.randomUUID().toString(),
    val text: String,
    val startTimeMs: Long = 0L,
    val endTimeMs: Long = 0L
) {
    val durationMs: Long
        get() = (endTimeMs - startTimeMs).coerceAtLeast(0L)

    fun formatTimeRange(): String {
        return "${formatMs(startTimeMs)} → ${formatMs(endTimeMs)}"
    }

    companion object {
        fun formatMs(ms: Long): String {
            val clamped = ms.coerceAtLeast(0L)
            val totalSec = clamped / 1000
            val minutes = totalSec / 60
            val seconds = totalSec % 60
            val centis = (clamped % 1000) / 10
            return String.format(Locale.US, "%02d:%02d.%02d", minutes, seconds, centis)
        }
    }
}
