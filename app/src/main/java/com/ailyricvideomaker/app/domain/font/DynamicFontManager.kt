package com.ailyricvideomaker.app.domain.font

import android.content.Context
import android.graphics.Typeface
import android.net.Uri
import android.provider.OpenableColumns
import androidx.compose.ui.text.font.FontFamily
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

/**
 * Handles dynamic import and loading of user-provided TTF/OTF font files into native Typeface
 * and Compose FontFamily, ensuring full support for complex Tamil Unicode ligatures.
 */
class DynamicFontManager(private val context: Context) {

    suspend fun loadCustomFont(uri: Uri): Pair<FontFamily, String?> = withContext(Dispatchers.IO) {
        val fileName = getFileName(uri) ?: "custom_font.ttf"
        val fontDir = File(context.cacheDir, "fonts").apply { if (!exists()) mkdirs() }
        val destinationFile = File(fontDir, fileName)

        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(destinationFile).use { output ->
                input.copyTo(output)
            }
        } ?: throw IllegalArgumentException("Could not read font stream from URI: $uri")

        val typeface = Typeface.createFromFile(destinationFile)
            ?: throw IllegalStateException("Failed to parse font file: $fileName")

        val composeFontFamily = FontFamily(typeface)
        return@withContext Pair(composeFontFamily, fileName)
    }

    fun loadFromLocalFile(fileName: String): FontFamily? {
        val fontDir = File(context.cacheDir, "fonts")
        val file = File(fontDir, fileName)
        if (!file.exists()) return null
        return try {
            val typeface = Typeface.createFromFile(file)
            FontFamily(typeface)
        } catch (_: Exception) {
            null
        }
    }

    private fun getFileName(uri: Uri): String? {
        var name: String? = null
        if (uri.scheme == "content") {
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (index != -1) {
                        name = it.getString(index)
                    }
                }
            }
        }
        if (name == null) {
            name = uri.path?.let {
                val cut = it.lastIndexOf('/')
                if (cut != -1) it.substring(cut + 1) else it
            }
        }
        return name
    }
}
