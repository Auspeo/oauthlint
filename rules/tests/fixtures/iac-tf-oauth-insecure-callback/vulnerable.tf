# ruleid: auth.iac.tf-oauth-insecure-callback
resource "auth0_client" "http_cb" {
  name      = "plaintext callback"
  callbacks = ["https://app.example.com/cb", "http://app.example.com/cb"]
}

# ruleid: auth.iac.tf-oauth-insecure-callback
resource "auth0_client" "wildcard_cb" {
  name          = "wildcard callback"
  callback_urls = ["https://*.example.com/cb"]
}
