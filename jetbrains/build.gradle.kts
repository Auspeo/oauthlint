import org.jetbrains.intellij.platform.gradle.IntelliJPlatformType
import java.io.File

plugins {
    id("java")
    // Kotlin JVM + the serialization compiler plugin for kotlinx-serialization.
    kotlin("jvm") version "2.0.20"
    kotlin("plugin.serialization") version "2.0.20"
    // IntelliJ Platform Gradle Plugin 2.x.
    id("org.jetbrains.intellij.platform") version "2.1.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    // Adds the JetBrains-hosted repositories (releases, snapshots, marketplace)
    // the IntelliJ Platform Gradle Plugin needs to resolve the IDE and plugins.
    intellijPlatform {
        defaultRepositories()
        // Needed to resolve the code-instrumentation compiler (instrumentCode).
        intellijDependencies()
    }
}

dependencies {
    intellijPlatform {
        // IntelliJ IDEA Community 2024.2 as the compile/test target.
        intellijIdeaCommunity(providers.gradleProperty("platformVersion").get())

        // Bundled plugins we only depend on optionally at runtime (registered via
        // separate optional config files in plugin.xml). Declared here so the
        // annotator extension points compile and the plugin verifier is happy.
        // Python and Go/Rust live in their own IDEs / plugins and are wired purely
        // through optional <depends> config files, so they are not listed here.
        bundledPlugin("com.intellij.java")

        pluginVerifier()
        zipSigner()
        // Provides the Java compiler used by the instrumentCode task.
        instrumentationTools()
    }

    // JSON parsing of the Opengrep (Semgrep-compatible) --json output.
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

intellijPlatform {
    pluginConfiguration {
        name = providers.gradleProperty("pluginName")
        version = providers.gradleProperty("pluginVersion")
        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
            untilBuild = providers.gradleProperty("pluginUntilBuild")
        }
    }
    pluginVerification {
        ides {
            ide(IntelliJPlatformType.IntellijIdeaCommunity, "2024.2")
        }
    }
}

kotlin {
    jvmToolchain(21)
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

// --- Bundle the OAuthLint rule pack into the plugin jar -----------------------
//
// The YAML rule tree lives at <repoRoot>/rules/rules. We stage a copy under
// build/ inside a top-level `oauthlint-rules/` directory, generate a flat
// `index.txt` of every rule file (so the runtime can enumerate + extract them
// from the jar without directory listing), then fold the staged tree into
// processResources so it ships at the root of the plugin jar.
val rulesSource: File = rootProject.rootDir.resolve("../rules/rules")
val rulesStagingRoot = layout.buildDirectory.dir("oauthlint-rules-staging")
val rulesVersion = providers.gradleProperty("rulesVersion").get()

val bundleRules = tasks.register<Copy>("bundleRules") {
    description = "Stage the OAuthLint YAML rule pack for bundling into the plugin jar."
    from(rulesSource)
    into(rulesStagingRoot.map { it.dir("oauthlint-rules") })
    // Only the rule definitions; no stray dotfiles.
    include("**/*.yml", "**/*.yaml")
}

val indexRules = tasks.register("indexRules") {
    description = "Write index.txt + VERSION next to the staged rule pack."
    dependsOn(bundleRules)
    val stagedDir = rulesStagingRoot.map { it.dir("oauthlint-rules") }
    // Declare the version as an input so a bump regenerates VERSION (which keys
    // the runtime extraction cache), instead of staying UP-TO-DATE.
    inputs.property("rulesVersion", rulesVersion)
    outputs.dir(stagedDir)
    doLast {
        val dir = stagedDir.get().asFile
        val files = dir.walkTopDown()
            .filter { it.isFile && it.name != "index.txt" && it.name != "VERSION" }
            .map { it.relativeTo(dir).path.replace(File.separatorChar, '/') }
            .sorted()
            .toList()
        dir.resolve("index.txt").writeText(files.joinToString("\n"))
        dir.resolve("VERSION").writeText(rulesVersion)
    }
}

tasks.processResources {
    dependsOn(indexRules)
    // Fold the staged `oauthlint-rules/` tree into the resources root so it lands
    // at `/oauthlint-rules/...` inside the plugin jar.
    from(rulesStagingRoot)
}
