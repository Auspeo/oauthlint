import SwiftUI

struct SettingsView: View {
    // Non-sensitive UI preferences are the intended use of @AppStorage.
    @AppStorage("username") var username: String = ""
    @AppStorage("prefersDark") var prefersDark = false
    @AppStorage("launchCount") private var launchCount = 0

    var body: some View {
        Text(username)
    }
}
