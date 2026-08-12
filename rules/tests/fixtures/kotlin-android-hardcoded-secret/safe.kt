object AuthConfig {
    // injected from build config: safe
    val clientSecret = BuildConfig.CLIENT_SECRET

    // read from environment: safe
    val apiKey = System.getenv("API_KEY")

    // non-credential name: safe
    const val userName = "a_very_long_username_value_here"

    // documentation placeholder: safe
    const val secret = "your-client-secret-here"
}
