package com.ailyricvideomaker.app.domain.font

/**
 * Represents a persistent font in the user's global Font Library.
 */
data class FontItem(
    val id: String,
    val name: String,
    val fileName: String,
    val filePath: String,
    val dateAdded: Long = System.currentTimeMillis()
)
