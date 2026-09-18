package com.ailyricvideomaker.app.ui.viewmodel

import android.app.Application
import android.net.Uri
import androidx.compose.ui.text.font.FontFamily
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ailyricvideomaker.app.data.model.AnimationConfig
import com.ailyricvideomaker.app.data.model.LyricAnimationStyle
import com.ailyricvideomaker.app.data.model.LyricLine
import com.ailyricvideomaker.app.data.model.ProjectData
import com.ailyricvideomaker.app.data.model.TextAlignment
import com.ailyricvideomaker.app.data.model.TextStyleConfig
import com.ailyricvideomaker.app.data.repository.ProjectPreferencesRepository
import com.ailyricvideomaker.app.domain.audio.AudioEngine
import com.ailyricvideomaker.app.domain.font.DynamicFontManager
import com.ailyricvideomaker.app.domain.sync.ManualTapSyncEngine
import com.ailyricvideomaker.app.domain.waveform.WaveformExtractor
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LyricVideoViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = ProjectPreferencesRepository(application)
    val audioEngine = AudioEngine(application)
    private val fontManager = DynamicFontManager(application)
    private val waveformExtractor = WaveformExtractor(application)
    val tapSyncEngine = ManualTapSyncEngine()

    private val _projectState = MutableStateFlow(ProjectData())
    val projectState: StateFlow<ProjectData> = _projectState.asStateFlow()

    private val _customFontFamily = MutableStateFlow<FontFamily?>(null)
    val customFontFamily: StateFlow<FontFamily?> = _customFontFamily.asStateFlow()

    private val _waveformPoints = MutableStateFlow<List<Float>>(emptyList())
    val waveformPoints: StateFlow<List<Float>> = _waveformPoints.asStateFlow()

    private val _isAnalyzingAudio = MutableStateFlow(false)
    val isAnalyzingAudio: StateFlow<Boolean> = _isAnalyzingAudio.asStateFlow()

    private val _activeLyricIndex = MutableStateFlow(-1)
    val activeLyricIndex: StateFlow<Int> = _activeLyricIndex.asStateFlow()

    private val _userMessage = MutableSharedFlow<String>()
    val userMessage: SharedFlow<String> = _userMessage.asSharedFlow()

    init {
        loadSavedProject()
        observePlaybackPosition()
    }

    private fun loadSavedProject() {
        val saved = repository.loadProject()
        _projectState.value = saved

        // Restore custom font if present
        saved.fontName?.let { name ->
            fontManager.loadFromLocalFile(name)?.let { font ->
                _customFontFamily.value = font
            }
        }

        // Restore audio if present
        saved.audioUri?.let { uriString ->
            try {
                val uri = Uri.parse(uriString)
                audioEngine.initializePlayer(uri)
                extractWaveform(uri)
            } catch (_: Exception) {
                // Graceful fallback if permission expired
            }
        }
    }

    private fun observePlaybackPosition() {
        viewModelScope.launch {
            audioEngine.currentPositionMs.collect { pos ->
                val lines = _projectState.value.lyricLines
                val index = lines.indexOfFirst { line ->
                    pos in line.startTimeMs..line.endTimeMs
                }
                _activeLyricIndex.value = index
            }
        }
    }

    fun setBackgroundUri(uri: Uri) {
        _projectState.value = _projectState.value.copy(backgroundUri = uri.toString())
        persistProject()
    }

    fun setLyricsRawText(text: String) {
        val currentLines = _projectState.value.lyricLines
        // Split by lines, preserving exact characters
        val rawList = text.lines().map { it.trim() }.filter { it.isNotEmpty() }

        // If user already synced lines with same count, update texts while keeping timestamps
        val updatedLines = if (currentLines.isNotEmpty() && currentLines.size == rawList.size) {
            currentLines.mapIndexed { idx, oldLine ->
                oldLine.copy(text = rawList[idx])
            }
        } else {
            // Fresh lines initialized with sequential default spacing if not synced yet
            rawList.mapIndexed { idx, lineText ->
                val start = idx * 4000L
                LyricLine(
                    text = lineText,
                    startTimeMs = start,
                    endTimeMs = start + 3500L
                )
            }
        }

        _projectState.value = _projectState.value.copy(
            rawLyricsText = text,
            lyricLines = updatedLines
        )
        persistProject()
    }

    fun setAudioUri(uri: Uri, displayName: String?) {
        viewModelScope.launch {
            try {
                audioEngine.initializePlayer(uri)
                _projectState.value = _projectState.value.copy(
                    audioUri = uri.toString(),
                    audioFileName = displayName ?: "Audio Track"
                )
                persistProject()
                extractWaveform(uri)
            } catch (e: Exception) {
                _userMessage.emit("Failed to load audio: ${e.message}")
            }
        }
    }

    private fun extractWaveform(uri: Uri) {
        viewModelScope.launch {
            _isAnalyzingAudio.value = true
            try {
                val points = waveformExtractor.extractWaveform(uri)
                _waveformPoints.value = points
            } catch (e: Exception) {
                _userMessage.emit("Waveform generation fallback used.")
            } finally {
                _isAnalyzingAudio.value = false
            }
        }
    }

    fun setFontUri(uri: Uri) {
        viewModelScope.launch {
            try {
                val (fontFamily, fontFileName) = fontManager.loadCustomFont(uri)
                _customFontFamily.value = fontFamily
                _projectState.value = _projectState.value.copy(
                    fontUri = uri.toString(),
                    fontName = fontFileName
                )
                persistProject()
                _userMessage.emit("Custom font '$fontFileName' loaded successfully!")
            } catch (e: Exception) {
                _userMessage.emit("Could not load font: ${e.message}")
            }
        }
    }

    // --- Tap to Sync Actions ---

    fun startTapToSync() {
        val lines = _projectState.value.rawLyricsText.lines().map { it.trim() }.filter { it.isNotEmpty() }
        if (lines.isEmpty()) {
            viewModelScope.launch { _userMessage.emit("Please enter or paste lyrics before syncing.") }
            return
        }
        tapSyncEngine.startSync(lines)
        audioEngine.seekTo(0L)
        audioEngine.play()
    }

    fun recordTap() {
        val pos = audioEngine.currentPositionMs.value
        val finished = tapSyncEngine.recordTap(pos)
        if (finished) {
            completeTapSync()
        }
    }

    fun completeTapSync() {
        val duration = audioEngine.durationMs.value
        val syncedLines = tapSyncEngine.finalizeSync(duration)
        _projectState.value = _projectState.value.copy(lyricLines = syncedLines)
        persistProject()
        viewModelScope.launch {
            _userMessage.emit("Synchronization complete! ${syncedLines.size} lines synchronized.")
        }
    }

    fun cancelTapSync() {
        tapSyncEngine.cancelSync()
        audioEngine.pause()
    }

    // --- Timeline Correction Actions ---

    fun moveLineEarlier(index: Int, deltaMs: Long = 250L) {
        updateLineAt(index) { line ->
            val newStart = (line.startTimeMs - deltaMs).coerceAtLeast(0L)
            val newEnd = (line.endTimeMs - deltaMs).coerceAtLeast(newStart + 300L)
            line.copy(startTimeMs = newStart, endTimeMs = newEnd)
        }
    }

    fun moveLineLater(index: Int, deltaMs: Long = 250L) {
        updateLineAt(index) { line ->
            val newStart = line.startTimeMs + deltaMs
            val newEnd = line.endTimeMs + deltaMs
            line.copy(startTimeMs = newStart, endTimeMs = newEnd)
        }
    }

    fun adjustLineStart(index: Int, deltaMs: Long) {
        updateLineAt(index) { line ->
            val newStart = (line.startTimeMs + deltaMs).coerceIn(0L, line.endTimeMs - 200L)
            line.copy(startTimeMs = newStart)
        }
    }

    fun adjustLineEnd(index: Int, deltaMs: Long) {
        updateLineAt(index) { line ->
            val newEnd = (line.endTimeMs + deltaMs).coerceAtLeast(line.startTimeMs + 200L)
            line.copy(endTimeMs = newEnd)
        }
    }

    fun splitLine(index: Int) {
        val currentLines = _projectState.value.lyricLines.toMutableList()
        if (index !in currentLines.indices) return

        val target = currentLines[index]
        val words = target.text.split(" ").filter { it.isNotBlank() }
        if (words.size <= 1) return

        val midWord = words.size / 2
        val firstHalfText = words.subList(0, midWord).joinToString(" ")
        val secondHalfText = words.subList(midWord, words.size).joinToString(" ")

        val midTime = (target.startTimeMs + target.endTimeMs) / 2

        val firstLine = target.copy(text = firstHalfText, endTimeMs = midTime)
        val secondLine = LyricLine(text = secondHalfText, startTimeMs = midTime, endTimeMs = target.endTimeMs)

        currentLines[index] = firstLine
        currentLines.add(index + 1, secondLine)

        _projectState.value = _projectState.value.copy(lyricLines = currentLines)
        persistProject()
    }

    fun mergeWithNext(index: Int) {
        val currentLines = _projectState.value.lyricLines.toMutableList()
        if (index !in 0 until currentLines.size - 1) return

        val first = currentLines[index]
        val second = currentLines[index + 1]

        val merged = first.copy(
            text = "${first.text} ${second.text}",
            endTimeMs = second.endTimeMs
        )

        currentLines[index] = merged
        currentLines.removeAt(index + 1)

        _projectState.value = _projectState.value.copy(lyricLines = currentLines)
        persistProject()
    }

    fun updateLineText(index: Int, newText: String) {
        updateLineAt(index) { it.copy(text = newText) }
    }

    private fun updateLineAt(index: Int, transform: (LyricLine) -> LyricLine) {
        val currentLines = _projectState.value.lyricLines.toMutableList()
        if (index in currentLines.indices) {
            currentLines[index] = transform(currentLines[index])
            _projectState.value = _projectState.value.copy(lyricLines = currentLines)
            persistProject()
        }
    }

    // --- Styling & Animation Controls ---

    fun updateTextStyle(transform: (TextStyleConfig) -> TextStyleConfig) {
        val updated = transform(_projectState.value.textStyle)
        _projectState.value = _projectState.value.copy(textStyle = updated)
        persistProject()
    }

    fun updateAnimation(transform: (AnimationConfig) -> AnimationConfig) {
        val updated = transform(_projectState.value.animation)
        _projectState.value = _projectState.value.copy(animation = updated)
        persistProject()
    }

    private fun persistProject() {
        repository.saveProject(_projectState.value)
    }

    override fun onCleared() {
        super.onCleared()
        audioEngine.release()
    }
}
