object Endpoints {
    // TLS: safe
    const val authorizeUrl = "https://accounts.example.com/oauth/authorize"

    // TLS token endpoint: safe
    const val tokenUrl = "https://api.example.com/oauth/token"

    // loopback dev host: safe
    const val devToken = "http://localhost:8080/oauth/token"

    // android emulator loopback: safe
    const val emuLogin = "http://10.0.2.2:8080/login"

    // cleartext but non-auth resource: safe
    const val imageUrl = "http://cdn.example.com/logo.png"
}
