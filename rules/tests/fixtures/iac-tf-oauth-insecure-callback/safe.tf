resource "auth0_client" "ok" {
  name          = "https callbacks only"
  callbacks     = ["https://app.example.com/callback", "http://localhost:3000"]
  callback_urls = ["https://app.example.com/cb"]
  redirect_uris = ["https://app.example.com/oauth/callback"]
}
