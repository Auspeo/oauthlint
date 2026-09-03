package dev.oauthlint.annotator

import com.intellij.openapi.util.IconLoader
import javax.swing.Icon

/** OAuthLint icons loaded from plugin resources. */
object OAuthLintIcons {
    /** 12x12 gutter marker placed on lines that carry a finding. */
    @JvmField
    val GUTTER: Icon = IconLoader.getIcon("/icons/oauthlintGutter.svg", OAuthLintIcons::class.java)
}
