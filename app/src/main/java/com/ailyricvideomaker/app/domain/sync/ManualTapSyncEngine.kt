package com.ailyricvideomaker.app.domain.sync

import com.ailyricvideomaker.app.data.model.LyricLine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * State machine and engine for the interactive "Tap to Sync" rhythm recording workflow.
 */
class ManualTapSyncEngine {

    data class TapSyncState(
        val isSyncing: Boolean = false,
        val lines: List<String> = emptyList(),
        val currentLineIndex: Int = 0,
        val recordedStartTimes: List<Long> = emptyList(),
        val isComplete: Boolean = false
    )

    private val _state = MutableStateFlow(TapSyncState())
    val state: StateFlow<TapSyncState> = _state.asStateFlow()

    fun startSync(lines: List<String>) {
        val cleanLines = lines.filter { it.isNotBlank() }
        if (cleanLines.isEmpty()) return

        _state.value = TapSyncState(
            isSyncing = true,
            lines = cleanLines,
            currentLineIndex = 0,
            recordedStartTimes = emptyList(),
            isComplete = false
        )
    }

    /**
     * User taps when the current line begins being sung.
     * Records timestamp and advances to the next line.
     */
    fun recordTap(currentAudioPositionMs: Long): Boolean {
        val current = _state.value
        if (!current.isSyncing || current.currentLineIndex >= current.lines.size) {
            return false
        }

        val updatedStarts = current.recordedStartTimes + currentAudioPositionMs
        val nextIndex = current.currentLineIndex + 1
        val complete = nextIndex >= current.lines.size

        _state.value = current.copy(
            currentLineIndex = nextIndex,
            recordedStartTimes = updatedStarts,
            isComplete = complete,
            isSyncing = !complete
        )

        return complete
    }

    /**
     * Completes synchronization and generates final LyricLine objects,
     * assigning end times based on the start of subsequent lines or total audio duration.
     */
    fun finalizeSync(totalAudioDurationMs: Long): List<LyricLine> {
        val current = _state.value
        val result = mutableListOf<LyricLine>()
        val count = current.recordedStartTimes.size

        for (i in 0 until count) {
            val text = current.lines.getOrNull(i) ?: continue
            val start = current.recordedStartTimes[i]
            val end = if (i + 1 < count) {
                // Next line's start minus 150ms buffer
                (current.recordedStartTimes[i + 1] - 150L).coerceAtLeast(start + 500L)
            } else {
                // Final line: extend by 3.5 seconds or to the end of the audio track
                (start + 3500L).coerceAtMost(
                    if (totalAudioDurationMs > 0) totalAudioDurationMs else start + 3500L
                )
            }
            result.add(
                LyricLine(
                    text = text,
                    startTimeMs = start,
                    endTimeMs = end
                )
            )
        }

        cancelSync()
        return result
    }

    fun cancelSync() {
        _state.value = TapSyncState()
    }
}
