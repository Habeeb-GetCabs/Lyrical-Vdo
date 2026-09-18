package com.ailyricvideomaker.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.ailyricvideomaker.app.data.model.AnimationConfig
import com.ailyricvideomaker.app.data.model.LyricAnimationStyle
import com.ailyricvideomaker.app.data.model.LyricLine
import com.ailyricvideomaker.app.data.model.ProjectData
import com.ailyricvideomaker.app.data.model.RhythmPreset
import com.ailyricvideomaker.app.data.model.TextAlignment
import com.ailyricvideomaker.app.data.model.TextStyleConfig
import com.ailyricvideomaker.app.data.model.VideoDurationOption
import org.json.JSONArray
import org.json.JSONObject

/**
 * Local persistence repository for project state across application launches.
 */
class ProjectPreferencesRepository(private val context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("ai_lyric_project_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_PROJECT_JSON = "current_project_state"
    }

    fun saveProject(project: ProjectData) {
        val root = JSONObject().apply {
            put("id", project.id)
            put("title", project.title)
            put("backgroundUri", project.backgroundUri ?: "")
            put("audioUri", project.audioUri ?: "")
            put("audioFileName", project.audioFileName ?: "")
            put("audioDurationMs", project.audioDurationMs)
            put("fontUri", project.fontUri ?: "")
            put("fontName", project.fontName ?: "")
            put("selectedFontId", project.selectedFontId ?: "")
            put("selectedFontPath", project.selectedFontPath ?: "")
            put("videoDuration", project.videoDuration.name)
            put("rawLyricsText", project.rawLyricsText)

            val linesArray = JSONArray()
            project.lyricLines.forEach { line ->
                val lineObj = JSONObject().apply {
                    put("id", line.id)
                    put("text", line.text)
                    put("startTimeMs", line.startTimeMs)
                    put("endTimeMs", line.endTimeMs)
                }
                linesArray.put(lineObj)
            }
            put("lyricLines", linesArray)

            val styleObj = JSONObject().apply {
                put("fontSizeSp", project.textStyle.fontSizeSp.toDouble())
                put("textColorHex", project.textStyle.textColorHex)
                put("textOpacity", project.textStyle.textOpacity.toDouble())
                put("alignment", project.textStyle.alignment.name)
                put("verticalBias", project.textStyle.verticalBias.toDouble())
                put("shadowEnabled", project.textStyle.shadowEnabled)
                put("shadowColorHex", project.textStyle.shadowColorHex)
                put("shadowRadius", project.textStyle.shadowRadius.toDouble())
                put("strokeEnabled", project.textStyle.strokeEnabled)
                put("strokeColorHex", project.textStyle.strokeColorHex)
                put("strokeWidthDp", project.textStyle.strokeWidthDp.toDouble())
                put("letterSpacingSp", project.textStyle.letterSpacingSp.toDouble())
                put("lineSpacingMultiplier", project.textStyle.lineSpacingMultiplier.toDouble())
            }
            put("textStyle", styleObj)

            val animObj = JSONObject().apply {
                put("style", project.animation.style.name)
                put("rhythmPreset", project.animation.rhythmPreset.name)
                put("durationMs", project.animation.durationMs)
                put("speedMultiplier", project.animation.speedMultiplier.toDouble())
                put("highlightColorHex", project.animation.highlightColorHex)
            }
            put("animation", animObj)
        }

        prefs.edit().putString(KEY_PROJECT_JSON, root.toString()).apply()
    }

    fun loadProject(): ProjectData {
        val raw = prefs.getString(KEY_PROJECT_JSON, null) ?: return ProjectData()
        return try {
            val root = JSONObject(raw)
            val linesList = mutableListOf<LyricLine>()
            val linesArray = root.optJSONArray("lyricLines")
            if (linesArray != null) {
                for (i in 0 until linesArray.length()) {
                    val item = linesArray.getJSONObject(i)
                    linesList.add(
                        LyricLine(
                            id = item.optString("id"),
                            text = item.optString("text"),
                            startTimeMs = item.optLong("startTimeMs", 0L),
                            endTimeMs = item.optLong("endTimeMs", 0L)
                        )
                    )
                }
            }

            val styleObj = root.optJSONObject("textStyle")
            val textStyle = if (styleObj != null) {
                TextStyleConfig(
                    fontSizeSp = styleObj.optDouble("fontSizeSp", 26.0).toFloat(),
                    textColorHex = styleObj.optString("textColorHex", "#FFFFFF"),
                    textOpacity = styleObj.optDouble("textOpacity", 1.0).toFloat(),
                    alignment = try {
                        TextAlignment.valueOf(styleObj.optString("alignment", "CENTER"))
                    } catch (e: Exception) {
                        TextAlignment.CENTER
                    },
                    verticalBias = styleObj.optDouble("verticalBias", 0.5).toFloat(),
                    shadowEnabled = styleObj.optBoolean("shadowEnabled", true),
                    shadowColorHex = styleObj.optString("shadowColorHex", "#000000"),
                    shadowRadius = styleObj.optDouble("shadowRadius", 8.0).toFloat(),
                    strokeEnabled = styleObj.optBoolean("strokeEnabled", true),
                    strokeColorHex = styleObj.optString("strokeColorHex", "#000000"),
                    strokeWidthDp = styleObj.optDouble("strokeWidthDp", 2.0).toFloat(),
                    letterSpacingSp = styleObj.optDouble("letterSpacingSp", 0.5).toFloat(),
                    lineSpacingMultiplier = styleObj.optDouble("lineSpacingMultiplier", 1.25).toFloat()
                )
            } else {
                TextStyleConfig()
            }

            val animObj = root.optJSONObject("animation")
            val animation = if (animObj != null) {
                AnimationConfig(
                    style = try {
                        LyricAnimationStyle.valueOf(animObj.optString("style", "FADE"))
                    } catch (e: Exception) {
                        LyricAnimationStyle.FADE
                    },
                    rhythmPreset = try {
                        RhythmPreset.valueOf(animObj.optString("rhythmPreset", "SMOOTH"))
                    } catch (e: Exception) {
                        RhythmPreset.SMOOTH
                    },
                    durationMs = animObj.optLong("durationMs", 350L),
                    speedMultiplier = animObj.optDouble("speedMultiplier", 1.0).toFloat(),
                    highlightColorHex = animObj.optString("highlightColorHex", "#F59E0B")
                )
            } else {
                AnimationConfig()
            }

            val videoDuration = try {
                VideoDurationOption.valueOf(root.optString("videoDuration", "FULL_SONG"))
            } catch (e: Exception) {
                VideoDurationOption.FULL_SONG
            }

            ProjectData(
                id = root.optString("id", "default_project"),
                title = root.optString("title", "My Lyric Video"),
                backgroundUri = root.optString("backgroundUri").ifEmpty { null },
                audioUri = root.optString("audioUri").ifEmpty { null },
                audioFileName = root.optString("audioFileName").ifEmpty { null },
                audioDurationMs = root.optLong("audioDurationMs", 0L),
                fontUri = root.optString("fontUri").ifEmpty { null },
                fontName = root.optString("fontName").ifEmpty { null },
                selectedFontId = root.optString("selectedFontId").ifEmpty { null },
                selectedFontPath = root.optString("selectedFontPath").ifEmpty { null },
                videoDuration = videoDuration,
                rawLyricsText = root.optString("rawLyricsText", ""),
                lyricLines = linesList,
                textStyle = textStyle,
                animation = animation
            )
        } catch (e: Exception) {
            ProjectData()
        }
    }
}

