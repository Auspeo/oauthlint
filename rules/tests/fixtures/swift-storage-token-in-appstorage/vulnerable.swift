import SwiftUI

struct SettingsView: View {
    // ruleid: auth.swift.storage.token-in-appstorage
    @AppStorage("accessToken") var accessToken: String = ""

    // ruleid: auth.swift.storage.token-in-appstorage
    @AppStorage("refresh_token") private var refreshToken = ""

    // ruleid: auth.swift.storage.token-in-appstorage
    @AppStorage("apiSecret") var apiSecret = ""

    var body: some View {
        Text(accessToken)
    }
}
