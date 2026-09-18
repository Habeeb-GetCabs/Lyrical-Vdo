package com.ailyricvideomaker.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ailyricvideomaker.app.data.model.*
import com.ailyricvideomaker.app.ui.theme.*
import com.ailyricvideomaker.app.ui.viewmodel.LyricVideoViewModel
import kotlinx.coroutines.flow.collectLatest

enum class EditorTab(val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    PREVIEW("Preview", Icons.Default.PlayCircle),
    MEDIA("Assets", Icons.Default.Folder),
    LYRICS("Lyrics", Icons.Default.TextFields),
    TIMELINE("Timeline & Sync", Icons.Default.Timeline),
    STYLE("Style & FX", Icons.Default.Palette)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainEditorScreen(viewModel: LyricVideoViewModel) {
    val projectState by viewModel.projectState.collectAsState()
    val isPlaying by viewModel.audioEngine.isPlaying.collectAsState()
    val currentPositionMs by viewModel.audioEngine.currentPositionMs.collectAsState()
    val durationMs by viewModel.audioEngine.durationMs.collectAsState()
    val waveformPoints by viewModel.waveformPoints.collectAsState()
    val isAnalyzingAudio by viewModel.isAnalyzingAudio.collectAsState()
    val activeIndex by viewModel.activeLyricIndex.collectAsState()
    val customFont by viewModel.customFontFamily.collectAsState()
    val tapSyncState by viewModel.tapSyncEngine.state.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    var currentTab by remember { mutableStateOf(EditorTab.PREVIEW) }

    // Pickers
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.setBackgroundUri(it) }
    }

    val audioPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.setAudioUri(it, it.lastPathSegment) }
    }

    val fontPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.setFontUri(it) }
    }

    LaunchedEffect(Unit) {
        viewModel.userMessage.collectLatest { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Slate950,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = VioletPrimary.copy(alpha = 0.2f),
                            modifier = Modifier.padding(end = 10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MusicVideo,
                                contentDescription = null,
                                tint = VioletPrimary,
                                modifier = Modifier.padding(6.dp).size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "AI Lyric Video Maker",
                                style = MaterialTheme.typography.titleMedium,
                                color = Slate100,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (projectState.audioFileName != null) projectState.audioFileName!! else "Tamil & English Lyric Studio",
                                style = MaterialTheme.typography.labelSmall,
                                color = Slate400
                            )
                        }
                    }
                },
                actions = {
                    // Start Tap Sync shortcut
                    IconButton(
                        onClick = { viewModel.startTapToSync() },
                        enabled = projectState.audioUri != null && projectState.rawLyricsText.isNotBlank()
                    ) {
                        Icon(
                            imageVector = Icons.Default.TouchApp,
                            contentDescription = "Tap to Sync",
                            tint = if (projectState.audioUri != null) AmberAccent else Slate600
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate900
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Slate900,
                tonalElevation = 8.dp
            ) {
                EditorTab.values().forEach { tab ->
                    NavigationBarItem(
                        selected = currentTab == tab,
                        onClick = { currentTab = tab },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = VioletPrimary,
                            selectedTextColor = VioletPrimary,
                            indicatorColor = VioletPrimary.copy(alpha = 0.15f),
                            unselectedIconColor = Slate400,
                            unselectedTextColor = Slate400
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentTab) {
                EditorTab.PREVIEW -> {
                    PreviewTabContent(
                        projectState = projectState,
                        customFont = customFont,
                        currentPositionMs = currentPositionMs,
                        durationMs = durationMs,
                        isPlaying = isPlaying,
                        waveformPoints = waveformPoints,
                        activeIndex = activeIndex,
                        onPlayPause = { viewModel.audioEngine.togglePlayPause() },
                        onSeek = { viewModel.audioEngine.seekTo(it) },
                        onStartTapSync = { viewModel.startTapToSync() }
                    )
                }
                EditorTab.MEDIA -> {
                    MediaTabContent(
                        projectState = projectState,
                        onPickBackground = { imagePickerLauncher.launch("image/*") },
                        onPickAudio = { audioPickerLauncher.launch("audio/*") },
                        onPickFont = { fontPickerLauncher.launch("*/*") }
                    )
                }
                EditorTab.LYRICS -> {
                    LyricsTabContent(
                        rawLyrics = projectState.rawLyricsText,
                        onLyricsChanged = { viewModel.setLyricsRawText(it) }
                    )
                }
                EditorTab.TIMELINE -> {
                    TimelineTabContent(
                        projectState = projectState,
                        activeIndex = activeIndex,
                        currentPositionMs = currentPositionMs,
                        durationMs = durationMs,
                        isPlaying = isPlaying,
                        waveformPoints = waveformPoints,
                        onPlayPause = { viewModel.audioEngine.togglePlayPause() },
                        onSeek = { viewModel.audioEngine.seekTo(it) },
                        onStartTapSync = { viewModel.startTapToSync() },
                        onMoveEarlier = { viewModel.moveLineEarlier(it) },
                        onMoveLater = { viewModel.moveLineLater(it) },
                        onAdjustStart = { idx, delta -> viewModel.adjustLineStart(idx, delta) },
                        onAdjustEnd = { idx, delta -> viewModel.adjustLineEnd(idx, delta) },
                        onSplit = { viewModel.splitLine(it) },
                        onMerge = { viewModel.mergeWithNext(it) },
                        onUpdateText = { idx, text -> viewModel.updateLineText(idx, text) }
                    )
                }
                EditorTab.STYLE -> {
                    StyleTabContent(
                        projectState = projectState,
                        onUpdateStyle = { viewModel.updateTextStyle(it) },
                        onUpdateAnimation = { viewModel.updateAnimation(it) }
                    )
                }
            }

            // Tap-to-Sync Overlay Dialog
            if (tapSyncState.isSyncing) {
                TapToSyncOverlay(
                    syncState = tapSyncState,
                    currentPositionMs = currentPositionMs,
                    onTap = { viewModel.recordTap() },
                    onCancel = { viewModel.cancelTapSync() },
                    onFinish = { viewModel.completeTapSync() }
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// TAB 1: PREVIEW TAB (Live synchronized lyric video player)
// -----------------------------------------------------------------------------

@Composable
fun PreviewTabContent(
    projectState: ProjectData,
    customFont: FontFamily?,
    currentPositionMs: Long,
    durationMs: Long,
    isPlaying: Boolean,
    waveformPoints: List<Float>,
    activeIndex: Int,
    onPlayPause: () -> Unit,
    onSeek: (Long) -> Unit,
    onStartTapSync: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Video Preview Aspect Frame (9:16 portrait style, bounded)
        Card(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, Slate700, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = Slate900)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                // Layer 0: Background Image
                if (projectState.backgroundUri != null) {
                    AsyncImage(
                        model = projectState.backgroundUri,
                        contentDescription = "Background",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    // Dim overlay for high-contrast lyric legibility
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.35f))
                    )
                } else {
                    // Sleek gradient placeholder
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Slate900, Slate950)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No Background Uploaded\nTap Assets to choose an image",
                            color = Slate600,
                            textAlign = TextAlign.Center,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                // Layer 1: Synchronized Lyric Overlay with custom font & styling
                val activeLine = projectState.lyricLines.getOrNull(activeIndex)
                val activeText = activeLine?.text ?: if (projectState.lyricLines.isEmpty()) {
                    "Synchronized lyrics will appear here…"
                } else {
                    ""
                }

                if (activeText.isNotEmpty()) {
                    val style = projectState.textStyle
                    val anim = projectState.animation

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = when {
                            style.verticalBias < 0.35f -> Alignment.TopCenter
                            style.verticalBias > 0.65f -> Alignment.BottomCenter
                            else -> Alignment.Center
                        }
                    ) {
                        Text(
                            text = activeText,
                            fontFamily = customFont ?: FontFamily.Default,
                            fontSize = style.fontSizeSp.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = when (style.alignment) {
                                TextAlignment.LEFT -> TextAlign.Left
                                TextAlignment.CENTER -> TextAlign.Center
                                TextAlignment.RIGHT -> TextAlign.Right
                            },
                            color = try {
                                Color(android.graphics.Color.parseColor(style.textColorHex))
                                    .copy(alpha = style.textOpacity)
                            } catch (_: Exception) {
                                Color.White
                            },
                            style = androidx.compose.ui.text.TextStyle(
                                shadow = if (style.shadowEnabled) {
                                    Shadow(
                                        color = Color.Black,
                                        offset = Offset(2f, 4f),
                                        blurRadius = style.shadowRadius
                                    )
                                } else null,
                                letterSpacing = style.letterSpacingSp.sp,
                                lineHeight = (style.fontSizeSp * style.lineSpacingMultiplier).sp
                            ),
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Audio Playback & Waveform scrubbing bar
        WaveformScrubber(
            waveformPoints = waveformPoints,
            currentPositionMs = currentPositionMs,
            durationMs = durationMs,
            onSeek = onSeek
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Transport Controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = LyricLine.formatMs(currentPositionMs),
                color = VioletPrimary,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodyMedium
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { onSeek((currentPositionMs - 5000L).coerceAtLeast(0L)) }
                ) {
                    Icon(Icons.Default.Replay5, contentDescription = "Back 5s", tint = Slate300)
                }

                FloatingActionButton(
                    onClick = onPlayPause,
                    containerColor = VioletPrimary,
                    contentColor = Slate100,
                    shape = CircleShape,
                    modifier = Modifier.size(56.dp)
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Play/Pause",
                        modifier = Modifier.size(32.dp)
                    )
                }

                IconButton(
                    onClick = { onSeek((currentPositionMs + 5000L).coerceAtMost(durationMs)) }
                ) {
                    Icon(Icons.Default.Forward5, contentDescription = "Forward 5s", tint = Slate300)
                }
            }

            Text(
                text = LyricLine.formatMs(durationMs),
                color = Slate400,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

// -----------------------------------------------------------------------------
// TAB 2: ASSETS & MEDIA TAB
// -----------------------------------------------------------------------------

@Composable
fun MediaTabContent(
    projectState: ProjectData,
    onPickBackground: () -> Unit,
    onPickAudio: () -> Unit,
    onPickFont: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Media & Typography Assets",
                style = MaterialTheme.typography.titleLarge,
                color = Slate100,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Upload the building blocks for your lyric video.",
                style = MaterialTheme.typography.bodyMedium,
                color = Slate400
            )
        }

        // 1. Background Image Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Image, contentDescription = null, tint = VioletPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("1. Background Image", fontWeight = FontWeight.SemiBold, color = Slate100)
                        }
                        if (projectState.backgroundUri != null) {
                            Text("Selected", color = EmeraldSuccess, fontSize = 12.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onPickBackground,
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null, tint = VioletPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (projectState.backgroundUri != null) "Change Background" else "Upload Background")
                    }
                }
            }
        }

        // 2. Audio Track Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AudioFile, contentDescription = null, tint = VioletPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("2. Audio Track", fontWeight = FontWeight.SemiBold, color = Slate100)
                        }
                        if (projectState.audioUri != null) {
                            Text("Loaded", color = EmeraldSuccess, fontSize = 12.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = projectState.audioFileName ?: "Supports MP3, WAV, M4A",
                        color = Slate400,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onPickAudio,
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null, tint = VioletPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (projectState.audioUri != null) "Replace Audio" else "Upload Audio")
                    }
                }
            }
        }

        // 3. Custom Font Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.FontDownload, contentDescription = null, tint = VioletPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("3. Custom Font (TTF / OTF)", fontWeight = FontWeight.SemiBold, color = Slate100)
                        }
                        if (projectState.fontName != null) {
                            Text("Loaded", color = EmeraldSuccess, fontSize = 12.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = projectState.fontName ?: "Upload custom Tamil or English .ttf or .otf file",
                        color = Slate400,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onPickFont,
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null, tint = VioletPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (projectState.fontName != null) "Change Font" else "Upload Font (.TTF / .OTF)")
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// TAB 3: LYRICS EDITOR TAB
// -----------------------------------------------------------------------------

@Composable
fun LyricsTabContent(
    rawLyrics: String,
    onLyricsChanged: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Authoritative Lyrics",
            style = MaterialTheme.typography.titleLarge,
            color = Slate100,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Supports Tamil, English, and mixed Unicode text. Exact line breaks are strictly preserved.",
            style = MaterialTheme.typography.bodyMedium,
            color = Slate400
        )
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = rawLyrics,
            onValueChange = onLyricsChanged,
            placeholder = {
                Text(
                    text = "Paste or type lyrics here...\n\nExample:\nகண்ணே கலைமானே\nகன்னி மயிலென கண்டேன் உனை நானே\nSweet melody in the night\nLove shining bright",
                    color = Slate600
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VioletPrimary,
                unfocusedBorderColor = Slate700,
                focusedTextColor = Slate100,
                unfocusedTextColor = Slate100,
                cursorColor = VioletPrimary
            ),
            shape = RoundedCornerShape(12.dp)
        )
    }
}

// -----------------------------------------------------------------------------
// TAB 4: TIMELINE & SYNC TAB
// -----------------------------------------------------------------------------

@Composable
fun TimelineTabContent(
    projectState: ProjectData,
    activeIndex: Int,
    currentPositionMs: Long,
    durationMs: Long,
    isPlaying: Boolean,
    waveformPoints: List<Float>,
    onPlayPause: () -> Unit,
    onSeek: (Long) -> Unit,
    onStartTapSync: () -> Unit,
    onMoveEarlier: (Int) -> Unit,
    onMoveLater: (Int) -> Unit,
    onAdjustStart: (Int, Long) -> Unit,
    onAdjustEnd: (Int, Long) -> Unit,
    onSplit: (Int) -> Unit,
    onMerge: (Int) -> Unit,
    onUpdateText: (Int, String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Lyric Timeline",
                    style = MaterialTheme.typography.titleLarge,
                    color = Slate100,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${projectState.lyricLines.size} lines synchronized",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate400
                )
            }

            Button(
                onClick = onStartTapSync,
                colors = ButtonDefaults.buttonColors(containerColor = AmberAccent, contentColor = Slate950)
            ) {
                Icon(Icons.Default.TouchApp, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Tap to Sync", fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Mini scrubber bar
        WaveformScrubber(
            waveformPoints = waveformPoints,
            currentPositionMs = currentPositionMs,
            durationMs = durationMs,
            onSeek = onSeek
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (projectState.lyricLines.isEmpty()) {
            Box(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No lyrics added yet.\nGo to the Lyrics tab to paste your text.",
                    color = Slate600,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                itemsIndexed(projectState.lyricLines) { index, line ->
                    val isActive = index == activeIndex

                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isActive) VioletPrimary.copy(alpha = 0.15f) else Slate900
                        ),
                        shape = RoundedCornerShape(10.dp),
                        border = if (isActive) CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(VioletPrimary, VioletSecondary))) else null
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Line ${index + 1} • ${line.formatTimeRange()}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isActive) AmberAccent else VioletPrimary,
                                    fontWeight = FontWeight.Bold
                                )

                                Row {
                                    IconButton(
                                        onClick = { onMoveEarlier(index) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.FastRewind, contentDescription = "Move earlier", tint = Slate400, modifier = Modifier.size(16.dp))
                                    }
                                    IconButton(
                                        onClick = { onMoveLater(index) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.FastForward, contentDescription = "Move later", tint = Slate400, modifier = Modifier.size(16.dp))
                                    }
                                    IconButton(
                                        onClick = { onSplit(index) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.CallSplit, contentDescription = "Split", tint = Slate400, modifier = Modifier.size(16.dp))
                                    }
                                    if (index < projectState.lyricLines.size - 1) {
                                        IconButton(
                                            onClick = { onMerge(index) },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(Icons.Default.CallMerge, contentDescription = "Merge with next", tint = Slate400, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = line.text,
                                style = MaterialTheme.typography.bodyLarge,
                                color = Slate100,
                                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            // Micro adjustments
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AssistChip(
                                    onClick = { onAdjustStart(index, -150L) },
                                    label = { Text("Start -150ms", fontSize = 10.sp) }
                                )
                                AssistChip(
                                    onClick = { onAdjustStart(index, 150L) },
                                    label = { Text("Start +150ms", fontSize = 10.sp) }
                                )
                                AssistChip(
                                    onClick = { onAdjustEnd(index, -200L) },
                                    label = { Text("End -200ms", fontSize = 10.sp) }
                                )
                                AssistChip(
                                    onClick = { onAdjustEnd(index, 200L) },
                                    label = { Text("End +200ms", fontSize = 10.sp) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// TAB 5: STYLE & ANIMATION TAB
// -----------------------------------------------------------------------------

@Composable
fun StyleTabContent(
    projectState: ProjectData,
    onUpdateStyle: ((TextStyleConfig) -> TextStyleConfig) -> Unit,
    onUpdateAnimation: ((AnimationConfig) -> AnimationConfig) -> Unit
) {
    val style = projectState.textStyle
    val anim = projectState.animation

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Typography & Visual Effects",
                style = MaterialTheme.typography.titleLarge,
                color = Slate100,
                fontWeight = FontWeight.Bold
            )
        }

        // Animation Style Selector
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Animation Style", fontWeight = FontWeight.SemiBold, color = Slate100)
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        LyricAnimationStyle.values().forEach { itemStyle ->
                            val isSelected = anim.style == itemStyle
                            FilterChip(
                                selected = isSelected,
                                onClick = { onUpdateAnimation { it.copy(style = itemStyle) } },
                                label = { Text(itemStyle.name, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = VioletPrimary,
                                    selectedLabelColor = Slate100
                                )
                            )
                        }
                    }
                }
            }
        }

        // Font Size Slider
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Font Size", color = Slate100)
                        Text("${style.fontSizeSp.toInt()} sp", color = VioletPrimary, fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = style.fontSizeSp,
                        onValueChange = { size -> onUpdateStyle { it.copy(fontSizeSp = size) } },
                        valueRange = 16f..48f,
                        colors = SliderDefaults.colors(
                            thumbColor = VioletPrimary,
                            activeTrackColor = VioletPrimary
                        )
                    )
                }
            }
        }

        // Vertical Alignment / Bias
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Vertical Position", color = Slate100)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Button(
                            onClick = { onUpdateStyle { it.copy(verticalBias = 0.2f) } },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (style.verticalBias < 0.35f) VioletPrimary else Slate800
                            )
                        ) {
                            Text("Top")
                        }
                        Button(
                            onClick = { onUpdateStyle { it.copy(verticalBias = 0.5f) } },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (style.verticalBias in 0.35f..0.65f) VioletPrimary else Slate800
                            )
                        ) {
                            Text("Center")
                        }
                        Button(
                            onClick = { onUpdateStyle { it.copy(verticalBias = 0.8f) } },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (style.verticalBias > 0.65f) VioletPrimary else Slate800
                            )
                        ) {
                            Text("Bottom")
                        }
                    }
                }
            }
        }

        // Shadow & Stroke Toggles
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Drop Shadow", color = Slate100)
                        Switch(
                            checked = style.shadowEnabled,
                            onCheckedChange = { en -> onUpdateStyle { it.copy(shadowEnabled = en) } }
                        )
                    }
                    Divider(color = Slate800, modifier = Modifier.padding(vertical = 8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Text Outline Stroke", color = Slate100)
                        Switch(
                            checked = style.strokeEnabled,
                            onCheckedChange = { en -> onUpdateStyle { it.copy(strokeEnabled = en) } }
                        )
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// TAP TO SYNC FULLSCREEN MODAL OVERLAY
// -----------------------------------------------------------------------------

@Composable
fun TapToSyncOverlay(
    syncState: ManualTapSyncEngine.TapSyncState,
    currentPositionMs: Long,
    onTap: () -> Unit,
    onCancel: () -> Unit,
    onFinish: () -> Unit
) {
    val currentLine = syncState.lines.getOrNull(syncState.currentLineIndex) ?: ""
    val nextLine = syncState.lines.getOrNull(syncState.currentLineIndex + 1)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950.copy(alpha = 0.96f))
            .pointerInput(Unit) {
                detectTapGestures { onTap() }
            },
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TAP TO SYNC",
                    style = MaterialTheme.typography.titleMedium,
                    color = AmberAccent,
                    fontWeight = FontWeight.Bold
                )

                TextButton(onClick = onCancel) {
                    Text("Cancel", color = Slate400)
                }
            }

            // Central Tap Target & Current Line Display
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(horizontal = 16.dp)
            ) {
                Text(
                    text = "Line ${syncState.currentLineIndex + 1} of ${syncState.lines.size}",
                    color = Slate400,
                    style = MaterialTheme.typography.labelSmall
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = currentLine,
                    color = Slate100,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (nextLine != null) {
                    Text(
                        text = "Up next: $nextLine",
                        color = Slate600,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(36.dp))

                // Big Pulse Tap Button
                Surface(
                    shape = CircleShape,
                    color = AmberAccent,
                    modifier = Modifier
                        .size(130.dp)
                        .clickable { onTap() }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.TouchApp, contentDescription = null, tint = Slate950, modifier = Modifier.size(40.dp))
                            Text("TAP NOW", color = Slate950, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Tap anywhere as soon as this line is sung!",
                    color = Slate400,
                    fontSize = 12.sp
                )
            }

            // Bottom action
            Button(
                onClick = onFinish,
                colors = ButtonDefaults.buttonColors(containerColor = Slate800)
            ) {
                Text("Finish & Save Sync")
            }
        }
    }
}

// -----------------------------------------------------------------------------
// REUSABLE WAVEFORM SCRUBBER COMPONENT
// -----------------------------------------------------------------------------

@Composable
fun WaveformScrubber(
    waveformPoints: List<Float>,
    currentPositionMs: Long,
    durationMs: Long,
    onSeek: (Long) -> Unit
) {
    val progress = if (durationMs > 0) (currentPositionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f) else 0f

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Slate900)
            .pointerInput(durationMs) {
                detectTapGestures { offset ->
                    if (durationMs > 0) {
                        val fraction = (offset.x / size.width).coerceIn(0f, 1f)
                        onSeek((fraction * durationMs).toLong())
                    }
                }
            }
            .pointerInput(durationMs) {
                detectDragGestures { change, _ ->
                    if (durationMs > 0) {
                        val fraction = (change.position.x / size.width).coerceIn(0f, 1f)
                        onSeek((fraction * durationMs).toLong())
                    }
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 6.dp)) {
            val count = if (waveformPoints.isNotEmpty()) waveformPoints.size else 60
            val barWidth = size.width / count.toFloat()
            val centerY = size.height / 2f

            for (i in 0 until count) {
                val peak = waveformPoints.getOrNull(i) ?: 0.35f
                val barHeight = (peak * (size.height * 0.8f)).coerceAtLeast(4f)
                val x = i * barWidth + (barWidth * 0.2f)

                val barFraction = i.toFloat() / count.toFloat()
                val isPlayed = barFraction <= progress

                drawLine(
                    color = if (isPlayed) VioletPrimary else Slate700,
                    start = Offset(x, centerY - barHeight / 2),
                    end = Offset(x, centerY + barHeight / 2),
                    strokeWidth = (barWidth * 0.6f).coerceAtLeast(2f)
                )
            }

            // Draw Playhead
            val playheadX = progress * size.width
            drawLine(
                color = AmberAccent,
                start = Offset(playheadX, 0f),
                end = Offset(playheadX, size.height),
                strokeWidth = 3.dp.toPx()
            )
        }
    }
}
