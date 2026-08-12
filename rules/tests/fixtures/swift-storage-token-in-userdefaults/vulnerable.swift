import Foundation

func persistSession(accessToken: String, refreshToken: String, userName: String) {
    // ruleid: auth.swift.storage.token-in-userdefaults
    UserDefaults.standard.set(accessToken, forKey: "accessToken")

    // ruleid: auth.swift.storage.token-in-userdefaults
    UserDefaults.standard.set(refreshToken, forKey: "userRefresh")

    // ruleid: auth.swift.storage.token-in-userdefaults
    UserDefaults(suiteName: "group.app")!.set("Bearer abc", forKey: "authorization")

    // ruleid: auth.swift.storage.token-in-userdefaults
    UserDefaults.standard.set(apiKeyValue, forKey: "endpointName")
}
