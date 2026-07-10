rootProject.name = "oauthlint-jetbrains"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        // The IntelliJ Platform Gradle Plugin 2.x resolves the platform artifacts
        // from the JetBrains-hosted releases repository declared in the build's
        // intellijPlatform repositories block; this only needs the plugin portal.
    }
}
