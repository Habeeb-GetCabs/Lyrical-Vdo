package com.ailyricvideomaker.app.domain.font

import android.content.Context
import android.graphics.Typeface
import android.net.Uri
import android.provider.OpenableColumns
import androidx.compose.ui.text.font.FontFamily
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/**
 * Handles persistent import, library storage, and loading of user-provided TTF/OTF font files
 * into native Typeface and Compose FontFamily, ensuring full support for complex Tamil & English
 * Unicode ligatures across app restarts and multiple projects.
 */
class DynamicFontManager(private val context: Context) {

    private val fontsDir: File
        get() = File(context.filesDir, "fonts").apply { if (!exists()) mkdirs() }

    private val libraryMetadataFile: File
        get() = File(context.filesDir, "font_library.json")

    /**
     * Loads the complete persistent list of fonts available in the Font Library.
     */
    suspend fun getFontLibrary(): List<FontItem> = withContext(Dispatchers.IO) {
        val list = mutableListOf<FontItem>()
        if (!libraryMetadataFile.exists()) {
            // Check if any font files already exist in directory and index them
            scanExistingFontFiles(list)
            saveFontLibrary(list)
            return@withContext list
        }

        try {
            val jsonStr = libraryMetadataFile.readText()
            val array = JSONArray(jsonStr)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val item = FontItem(
                    id = obj.optString("id", UUID.randomUUID().toString()),
                    name = obj.optString("name", "Custom Font"),
                    fileName = obj.optString("fileName", ""),
                    filePath = obj.optString("filePath", ""),
                    dateAdded = obj.optLong("dateAdded", System.currentTimeMillis())
                )
                // Ensure the font file still exists on disk
                if (File(item.filePath).exists()) {
                    list.add(item)
                }
            }
        } catch (e: Exception) {
            scanExistingFontFiles(list)
        }
        return@withContext list
    }

    private fun scanExistingFontFiles(list: MutableList<FontItem>) {
        fontsDir.listFiles()?.forEach { file ->
            if (file.isFile && (file.name.endsWith(".ttf", true) || file.name.endsWith(".otf", true))) {
                val cleanName = cleanFontDisplayName(file.name)
                list.add(
                    FontItem(
                        id = UUID.randomUUID().toString(),
                        name = cleanName,
                        fileName = file.name,
                        filePath = file.absolutePath,
                        dateAdded = file.lastModified()
                    )
                )
            }
        }
    }

    private fun saveFontLibrary(list: List<FontItem>) {
        try {
            val array = JSONArray()
            list.forEach { item ->
                val obj = JSONObject().apply {
                    put("id", item.id)
                    put("name", item.name)
                    put("fileName", item.fileName)
                    put("filePath", item.filePath)
                    put("dateAdded", item.dateAdded)
                }
                array.put(obj)
            }
            libraryMetadataFile.writeText(array.toString(2))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Imports a single font file into persistent app storage and adds it to the Font Library.
     */
    suspend fun importFont(uri: Uri): FontItem = withContext(Dispatchers.IO) {
        val originalName = getFileName(uri) ?: "font_${System.currentTimeMillis()}.ttf"
        val safeFileName = sanitizeFileName(originalName)
        val destinationFile = File(fontsDir, safeFileName)

        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(destinationFile).use { output ->
                input.copyTo(output)
            }
        } ?: throw IllegalArgumentException("Could not read font stream from URI: $uri")

        // Verify font validity
        val testTypeface = Typeface.createFromFile(destinationFile)
            ?: throw IllegalStateException("Invalid font file: $originalName")

        val cleanName = cleanFontDisplayName(originalName)
        val fontItem = FontItem(
            id = UUID.randomUUID().toString(),
            name = cleanName,
            fileName = safeFileName,
            filePath = destinationFile.absolutePath,
            dateAdded = System.currentTimeMillis()
        )

        val currentList = getFontLibrary().toMutableList()
        // Replace existing item if matching fileName to prevent duplicates
        val existingIndex = currentList.indexOfFirst { it.fileName.equals(safeFileName, ignoreCase = true) }
        if (existingIndex >= 0) {
            currentList[existingIndex] = fontItem
        } else {
            currentList.add(0, fontItem)
        }
        saveFontLibrary(currentList)

        return@withContext fontItem
    }

    /**
     * Imports multiple font files at once, ignoring duplicates or invalid files safely.
     */
    suspend fun importMultipleFonts(uris: List<Uri>): List<FontItem> = withContext(Dispatchers.IO) {
        val importedItems = mutableListOf<FontItem>()
        for (uri in uris) {
            try {
                val item = importFont(uri)
                importedItems.add(item)
            } catch (e: Exception) {
                // Ignore individual invalid font files safely
            }
        }
        return@withContext importedItems
    }

    /**
     * Deletes a font from the library and disk.
     */
    suspend fun deleteFont(fontId: String): Boolean = withContext(Dispatchers.IO) {
        val currentList = getFontLibrary().toMutableList()
        val item = currentList.find { it.id == fontId } ?: return@withContext false
        currentList.remove(item)
        saveFontLibrary(currentList)

        // Delete file from disk
        val file = File(item.filePath)
        if (file.exists()) {
            file.delete()
        }
        return@withContext true
    }

    /**
     * Loads Compose FontFamily directly from persistent file path.
     */
    fun loadFontFamilyFromFile(filePath: String): FontFamily? {
        val file = File(filePath)
        if (!file.exists()) return null
        return try {
            val typeface = Typeface.createFromFile(file)
            FontFamily(typeface)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Finds and loads a font by its fileName or name, searching persistent filesDir first, then cacheDir fallback.
     */
    fun loadFromLocalFile(fileName: String): FontFamily? {
        val persistentFile = File(fontsDir, fileName)
        if (persistentFile.exists()) {
            return loadFontFamilyFromFile(persistentFile.absolutePath)
        }
        val cacheFile = File(File(context.cacheDir, "fonts"), fileName)
        if (cacheFile.exists()) {
            return loadFontFamilyFromFile(cacheFile.absolutePath)
        }
        return null
    }

    /**
     * Legacy single-load helper for backward compatibility.
     */
    suspend fun loadCustomFont(uri: Uri): Pair<FontFamily, String?> = withContext(Dispatchers.IO) {
        val item = importFont(uri)
        val family = loadFontFamilyFromFile(item.filePath)
            ?: throw IllegalStateException("Failed to instantiate FontFamily for ${item.name}")
        return@withContext Pair(family, item.name)
    }

    private fun cleanFontDisplayName(fileName: String): String {
        var base = fileName
        val extIndex = base.lastIndexOf('.')
        if (extIndex > 0) {
            base = base.substring(0, extIndex)
        }
        return base.replace('-', ' ')
            .replace('_', ' ')
            .replace(Regex("(?<=[a-z])(?=[A-Z])"), " ")
            .trim()
            .split(" ")
            .filter { it.isNotBlank() }
            .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
    }

    private fun sanitizeFileName(fileName: String): String {
        return fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
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
