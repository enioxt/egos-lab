package com.egoslab.cortex

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.util.Log

class CortexAccessibilityService : AccessibilityService() {

    private val TAG = "CortexEye"
    private val TARGET_PACKAGES = setOf(
        "com.whatsapp",
        "com.openai.chatgpt",
        "com.google.android.gm" // Gmail
    )

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "🧠 Cortex Eye Connected! Ready to capture context.")
        
        // Configure service to fetch content
        val info = serviceInfo
        info.packageNames = TARGET_PACKAGES.toTypedArray()
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or AccessibilityEvent.TYPE_VIEW_SCROLLED
        info.feedbackType = android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_GENERIC
        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        val packageName = event.packageName?.toString() ?: return
        if (!TARGET_PACKAGES.contains(packageName)) return

        val rootNode = rootInActiveWindow ?: return
        extractTextRecursively(rootNode, packageName)
    }

    private val MAX_DEPTH = 50

    private fun extractTextRecursively(node: AccessibilityNodeInfo, appSource: String, depth: Int = 0) {
        if (depth > MAX_DEPTH) {
            Log.w(TAG, "⚠️ Max recursion depth reached for $appSource")
            return
        }

        if (node.text != null && node.text.isNotEmpty()) {
            val content = node.text.toString()
            
            // 🚀 HERE IS THE MAGIC
            // In a real app, send this to the Local Vector DB
            Log.d(TAG, "[$appSource] Captured: $content")
            
            // TODO: Vectorize(content) -> DB.insert(vector)
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                extractTextRecursively(child, appSource, depth + 1)
                child.recycle()
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Cortex Service Interrupted")
    }
}
