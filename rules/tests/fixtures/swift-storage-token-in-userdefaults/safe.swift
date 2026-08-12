import Foundation

func persistPreferences(isDark: Bool, launchCount: Int) {
    // Non-sensitive UI preferences are fine in UserDefaults.
    UserDefaults.standard.set(isDark, forKey: "prefersDark")
    UserDefaults.standard.set(launchCount, forKey: "launchCount")
    UserDefaults.standard.set("en_US", forKey: "locale")
}

func persistToken(token: String) {
    // Secrets belong in the Keychain, not UserDefaults.
    keychain.set(token, key: "authToken")
}
