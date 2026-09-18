package com.ailyricvideomaker.app.domain.sync

import android.net.Uri
import com.ailyricvideomaker.app.data.model.LyricLine

/**
 * Modular interface for lyric synchronization providers (Manual Tap-to-Sync, Gemini AI Audio Sync, etc.).
 */
interface LyricSyncProvider {
    val providerName: String

    suspend fun synchronize(
        audioUri: Uri,
        audioDurationMs: Long,
        rawLyrics: List<String>
    ): Result<List<LyricLine>>
}
