provider "okta" {
  org_name      = "example"
  api_token     = var.okta_api_token
  client_secret = var.okta_client_secret
}
