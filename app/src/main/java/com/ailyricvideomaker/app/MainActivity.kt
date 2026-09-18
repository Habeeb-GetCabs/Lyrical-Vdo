package com.ailyricvideomaker.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.ailyricvideomaker.app.ui.screens.MainEditorScreen
import com.ailyricvideomaker.app.ui.theme.AILyricVideoMakerTheme
import com.ailyricvideomaker.app.ui.viewmodel.LyricVideoViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: LyricVideoViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AILyricVideoMakerTheme {
                MainEditorScreen(viewModel = viewModel)
            }
        }
    }
}
