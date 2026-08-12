import Foundation

struct Config {
    // Read from the environment, not a literal.
    let apiKey = ProcessInfo.processInfo.environment["API_KEY"]
    let clientSecret = ProcessInfo.processInfo.environment["CLIENT_SECRET"]!

    // Empty / short / placeholder literals are not real secrets.
    let secret = ""
    let token = "abc"
    let apiSecret = "YOUR_SECRET_HERE_XXXX"
    let accessKey = "<replace-with-key-here>"

    // Non-secret names are ignored even with a long literal.
    let username = "maurice.aney.longname"
}
