package com.ailyricvideomaker.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalContext
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
import com.ailyricvideomaker.app.domain.font.FontItem
import com.ailyricvideomaker.app.ui.theme.*
import com.ailyricvideomaker.app.ui.viewmodel.LyricVideoViewModel
import kotlinx.coroutines.flow.collectLatest
import android.graphics.Typeface
import java.io.File

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
    val fontLibrary by viewModel.fontLibrary.collectAsState()
    val selectedFontItem by viewModel.selectedFontItem.collectAsState()
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

    val singleFontPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let { viewModel.importSingleFont(it) }
    }

    val multiFontPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            viewModel.importMultipleFonts(uris)
        }
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
                        onPickSingleFont = { singleFontPickerLauncher.launch(arrayOf("*/*")) },
                        onPickMultipleFonts = { multiFontPickerLauncher.launch(arrayOf("*/*")) },
                        onNavigateToStyleFonts = { currentTab = EditorTab.STYLE }
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
                        fontLibrary = fontLibrary,
                        selectedFontItem = selectedFontItem,
                        onSelectFont = { viewModel.selectFont(it) },
                        onDeleteFont = { viewModel.deleteFontFromLibrary(it) },
                        onPickSingleFont = { singleFontPickerLauncher.launch(arrayOf("*/*")) },
                        onPickMultipleFonts = { multiFontPickerLauncher.launch(arrayOf("*/*")) },
                        onUpdateStyle = { viewModel.updateTextStyle(it) },
                        onUpdateAnimation = { viewModel.updateAnimation(it) },
                        onSetRhythmPreset = { viewModel.setRhythmPreset(it) },
                        onSetVideoDuration = { viewModel.setVideoDuration(it) }
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
                            } catch (e: Exception) {
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
    onPickSingleFont: () -> Unit,
    onPickMultipleFonts: () -> Unit,
    onNavigateToStyleFonts: () -> Unit
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
                            Text("3. Persistent Font Library", fontWeight = FontWeight.SemiBold, color = Slate100)
                        }
                        if (projectState.fontName != null) {
                            Text("Active: ${projectState.fontName}", color = AmberAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Upload Tamil or English .ttf or .otf fonts. Fonts are stored persistently in app storage and stay available across sessions.",
                        color = Slate400,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onPickSingleFont,
                            colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = VioletPrimary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add Font", fontSize = 12.sp)
                        }
                        Button(
                            onClick = onPickMultipleFonts,
                            colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.LibraryAdd, contentDescription = null, tint = VioletPrimary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Bulk Add", fontSize = 12.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = onNavigateToStyleFonts,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = VioletPrimary)
                    ) {
                        Icon(Icons.Default.Palette, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Manage Library & Styles", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
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

// -----------------------------------------------------------------------------
// TAB 5: STYLE & ANIMATION TAB (ORGANIZED INTO 4 SECTIONS: FONT, TEXT, ANIMATION, VIDEO)
// -----------------------------------------------------------------------------

enum class StyleSubTab(val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    FONT("Font", Icons.Default.FontDownload),
    TEXT("Text", Icons.Default.TextFields),
    ANIMATION("Animation", Icons.Default.AutoAwesome),
    VIDEO("Video", Icons.Default.Videocam)
}

@Composable
fun StyleTabContent(
    projectState: ProjectData,
    fontLibrary: List<FontItem>,
    selectedFontItem: FontItem?,
    onSelectFont: (FontItem) -> Unit,
    onDeleteFont: (FontItem) -> Unit,
    onPickSingleFont: () -> Unit,
    onPickMultipleFonts: () -> Unit,
    onUpdateStyle: ((TextStyleConfig) -> TextStyleConfig) -> Unit,
    onUpdateAnimation: ((AnimationConfig) -> AnimationConfig) -> Unit,
    onSetRhythmPreset: (RhythmPreset) -> Unit,
    onSetVideoDuration: (VideoDurationOption) -> Unit
) {
    var activeSubTab by remember { mutableStateOf(StyleSubTab.FONT) }
    val style = projectState.textStyle
    val anim = projectState.animation

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Sub-Tab Navigation Bar
        TabRow(
            selectedTabIndex = activeSubTab.ordinal,
            containerColor = Slate900,
            contentColor = Slate100,
            indicator = { tabPositions ->
                TabRowDefaults.Indicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[activeSubTab.ordinal]),
                    color = VioletPrimary,
                    height = 3.dp
                )
            },
            divider = { Divider(color = Slate800) },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
        ) {
            StyleSubTab.values().forEach { subTab ->
                Tab(
                    selected = activeSubTab == subTab,
                    onClick = { activeSubTab = subTab },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(subTab.icon, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(subTab.label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    },
                    selectedContentColor = VioletPrimary,
                    unselectedContentColor = Slate400
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Sub-Tab Contents
        when (activeSubTab) {
            StyleSubTab.FONT -> {
                FontSectionContent(
                    projectState = projectState,
                    fontLibrary = fontLibrary,
                    selectedFontItem = selectedFontItem,
                    onSelectFont = onSelectFont,
                    onDeleteFont = onDeleteFont,
                    onPickSingleFont = onPickSingleFont,
                    onPickMultipleFonts = onPickMultipleFonts
                )
            }
            StyleSubTab.TEXT -> {
                TextSectionContent(
                    style = style,
                    onUpdateStyle = onUpdateStyle
                )
            }
            StyleSubTab.ANIMATION -> {
                AnimationSectionContent(
                    anim = anim,
                    onUpdateAnimation = onUpdateAnimation,
                    onSetRhythmPreset = onSetRhythmPreset
                )
            }
            StyleSubTab.VIDEO -> {
                VideoSectionContent(
                    projectState = projectState,
                    onSetVideoDuration = onSetVideoDuration
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// SECTION 1: FONT LIBRARY & PREVIEWS
// -----------------------------------------------------------------------------

@Composable
fun FontSectionContent(
    projectState: ProjectData,
    fontLibrary: List<FontItem>,
    selectedFontItem: FontItem?,
    onSelectFont: (FontItem) -> Unit,
    onDeleteFont: (FontItem) -> Unit,
    onPickSingleFont: () -> Unit,
    onPickMultipleFonts: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
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
                        Column {
                            Text("Persistent Font Library", fontWeight = FontWeight.Bold, color = Slate100, fontSize = 16.sp)
                            Text("${fontLibrary.size} custom fonts stored in app storage", color = Slate400, fontSize = 12.sp)
                        }
                        if (projectState.fontName != null) {
                            Badge(containerColor = AmberAccent) {
                                Text(
                                    "Active: ${projectState.fontName}",
                                    color = Slate950,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onPickSingleFont,
                            colors = ButtonDefaults.buttonColors(containerColor = VioletPrimary),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add Font", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = onPickMultipleFonts,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = VioletPrimary),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.LibraryAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Bulk Add", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        if (fontLibrary.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.FontDownload, contentDescription = null, tint = Slate600, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No custom fonts uploaded yet", color = Slate300, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Upload .ttf or .otf files (Tamil, English, or mixed Unicode) to use them in your lyric video.",
                            color = Slate500,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        } else {
            items(fontLibrary) { fontItem ->
                val isSelected = fontItem.id == selectedFontItem?.id || fontItem.name == projectState.fontName
                FontPreviewCard(
                    fontItem = fontItem,
                    isSelected = isSelected,
                    onSelect = { onSelectFont(fontItem) },
                    onDelete = { onDeleteFont(fontItem) }
                )
            }
        }
    }
}

@Composable
fun FontPreviewCard(
    fontItem: FontItem,
    isSelected: Boolean,
    onSelect: () -> Unit,
    onDelete: () -> Unit
) {
    val customFamily = remember(fontItem.filePath) {
        try {
            val file = File(fontItem.filePath)
            if (file.exists()) {
                FontFamily(androidx.compose.ui.text.font.Typeface(Typeface.createFromFile(file)))
            } else {
                FontFamily.Default
            }
        } catch (e: Exception) {
            FontFamily.Default
        }
    }

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Slate850 else Slate900
        ),
        border = if (isSelected) BorderStroke(2.dp, VioletPrimary) else BorderStroke(1.dp, Slate800),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Icon(
                        imageVector = if (isSelected) Icons.Default.CheckCircle else Icons.Default.FontDownload,
                        contentDescription = null,
                        tint = if (isSelected) EmeraldSuccess else VioletPrimary,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = fontItem.name,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Slate100 else Slate200,
                            fontSize = 14.sp
                        )
                        Text(
                            text = if (isSelected) "Active Project Font (Click to reapply)" else "Tap to apply to video",
                            color = if (isSelected) EmeraldSuccess else Slate400,
                            fontSize = 11.sp
                        )
                    }
                }
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        Icons.Default.DeleteOutline,
                        contentDescription = "Delete font",
                        tint = Slate400,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Real Unicode rendering preview box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Slate950, RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "அம்மா என் உயிர் ❤️ தாய்ப்பால்",
                        fontFamily = customFamily,
                        color = Slate100,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Beautiful Lyric Sync • Tamil & English",
                        fontFamily = customFamily,
                        color = AmberAccent,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// SECTION 2: TEXT STYLES, COLOURS, ALIGNMENT
// -----------------------------------------------------------------------------

@Composable
fun TextSectionContent(
    style: TextStyleConfig,
    onUpdateStyle: ((TextStyleConfig) -> TextStyleConfig) -> Unit
) {
    var hexInput by remember(style.textColor) {
        mutableStateOf(String.format("#%06X", (0xFFFFFF and style.textColor)))
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
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
                        Text("Font Size", color = Slate100, fontWeight = FontWeight.SemiBold)
                        Text("${style.fontSizeSp.toInt()} sp", color = VioletPrimary, fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = style.fontSizeSp,
                        onValueChange = { size -> onUpdateStyle { it.copy(fontSizeSp = size) } },
                        valueRange = 14f..52f,
                        colors = SliderDefaults.colors(
                            thumbColor = VioletPrimary,
                            activeTrackColor = VioletPrimary
                        )
                    )
                }
            }
        }

        // Text Color Palette (24 Preset Colors)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Lyric Text Colour", color = Slate100, fontWeight = FontWeight.SemiBold)
                    Text("Select from vibrant color presets or type a custom hex code", color = Slate400, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(12.dp))

                    // Preset Color Swatches Grid (6 columns)
                    val chunks = TextStyleConfig.PRESET_COLORS.chunked(6)
                    chunks.forEach { rowColors ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            rowColors.forEach { colorValue ->
                                val colorInt = colorValue.toInt()
                                val isSelected = style.textColor == colorInt
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(colorValue))
                                        .border(
                                            width = if (isSelected) 3.dp else 1.dp,
                                            color = if (isSelected) VioletPrimary else Slate700,
                                            shape = CircleShape
                                        )
                                        .clickable {
                                            onUpdateStyle { it.copy(textColor = colorInt) }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (isSelected) {
                                        Icon(
                                            Icons.Default.Check,
                                            contentDescription = null,
                                            tint = if (colorInt == android.graphics.Color.WHITE) Color.Black else Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Divider(color = Slate800)
                    Spacer(modifier = Modifier.height(10.dp))

                    // Custom Hex Color Input
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(style.textColor))
                                .border(1.dp, Slate700, CircleShape)
                        )
                        OutlinedTextField(
                            value = hexInput,
                            onValueChange = { input ->
                                hexInput = input
                                try {
                                    val clean = input.removePrefix("#").trim()
                                    if (clean.length == 6) {
                                        val colorInt = android.graphics.Color.parseColor("#$clean")
                                        onUpdateStyle { it.copy(textColor = colorInt) }
                                    }
                                } catch (_: Exception) {}
                            },
                            label = { Text("Custom Hex Color (#RRGGBB)", fontSize = 11.sp) },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = VioletPrimary,
                                unfocusedBorderColor = Slate700,
                                focusedTextColor = Slate100,
                                unfocusedTextColor = Slate200
                            )
                        )
                    }
                }
            }
        }

        // Alignment & Position
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Vertical Position", color = Slate100, fontWeight = FontWeight.SemiBold)
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
// SECTION 3: ANIMATION STYLES & RHYTHM PRESETS
// -----------------------------------------------------------------------------

@Composable
fun AnimationSectionContent(
    anim: AnimationConfig,
    onUpdateAnimation: ((AnimationConfig) -> AnimationConfig) -> Unit,
    onSetRhythmPreset: (RhythmPreset) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Animation Style Selector Chips (19 styles)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Animation Style (19 Modes)", fontWeight = FontWeight.SemiBold, color = Slate100)
                    Text("Visual entrance, kinetic transition, and exit effect for each line", color = Slate400, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    val chunks = LyricAnimationStyle.values().toList().chunked(3)
                    chunks.forEach { chunk ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            chunk.forEach { itemStyle ->
                                val isSelected = anim.style == itemStyle
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { onUpdateAnimation { it.copy(style = itemStyle) } },
                                    label = { Text(itemStyle.name.replace("_", " "), fontSize = 10.sp) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = VioletPrimary,
                                        selectedLabelColor = Slate100
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Animated Rhythm Presets (15 Presets)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Animated Rhythm Presets (15 Styles)", fontWeight = FontWeight.SemiBold, color = Slate100)
                    Text("Pre-tuned kinetic speed and rhythm matching musical moods", color = Slate400, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    RhythmPreset.values().forEach { preset ->
                        val isSelected = anim.rhythmPreset == preset
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) Slate850 else Slate950
                            ),
                            border = if (isSelected) BorderStroke(1.5.dp, VioletPrimary) else BorderStroke(1.dp, Slate800),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { onSetRhythmPreset(preset) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = preset.displayName,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) VioletPrimary else Slate100,
                                            fontSize = 13.sp
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Badge(containerColor = if (isSelected) VioletPrimary else Slate800) {
                                            Text("${preset.speedMultiplier}x", fontSize = 10.sp, color = Slate100)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = preset.description,
                                        color = Slate400,
                                        fontSize = 11.sp
                                    )
                                }
                                if (isSelected) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = VioletPrimary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Animation Speed Multiplier
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
                        Text("Custom Animation Speed", color = Slate100, fontWeight = FontWeight.SemiBold)
                        Text(String.format("%.1fx", anim.speedMultiplier), color = VioletPrimary, fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = anim.speedMultiplier,
                        onValueChange = { spd -> onUpdateAnimation { it.copy(speedMultiplier = spd) } },
                        valueRange = 0.5f..2.5f,
                        colors = SliderDefaults.colors(
                            thumbColor = VioletPrimary,
                            activeTrackColor = VioletPrimary
                        )
                    )
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// SECTION 4: VIDEO DURATION & INSTRUMENTAL GAP SETTINGS
// -----------------------------------------------------------------------------

@Composable
fun VideoSectionContent(
    projectState: ProjectData,
    onSetVideoDuration: (VideoDurationOption) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Target Video Duration", fontWeight = FontWeight.Bold, color = Slate100, fontSize = 16.sp)
                    Text("Select how long the final lyric video preview and MP4 export will be.", color = Slate400, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(14.dp))

                    VideoDurationOption.values().forEach { option ->
                        val isSelected = projectState.videoDuration == option
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) Slate850 else Slate950
                            ),
                            border = if (isSelected) BorderStroke(2.dp, if (isSelected) VioletPrimary else Slate800),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { onSetVideoDuration(option) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = { onSetVideoDuration(option) },
                                        colors = RadioButtonDefaults.colors(selectedColor = VioletPrimary)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = option.label,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate100,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = when (option) {
                                                VideoDurationOption.SECONDS_30 -> "Ideal for Instagram Reels, Shorts, and TikTok (30s limit)"
                                                VideoDurationOption.SECONDS_60 -> "Standard format for 1-minute social stories and reels"
                                                VideoDurationOption.FULL_SONG -> "Renders full audio duration without cutting off"
                                            },
                                            color = Slate400,
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Instrumental Gap & Export Fidelity Explanation Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = EmeraldSuccess, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Instrumental Gap & Preview Fidelity", fontWeight = FontWeight.Bold, color = Slate100)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• During instrumental gaps or sections with no active lyric, the screen displays only the background visuals with no lyric text.\n• The MP4 export strictly matches the live preview layout, selected font, font size, text colors, and duration cutoff.",
                        color = Slate300,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
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
