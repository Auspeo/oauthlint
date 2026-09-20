resource "auth0_client" "web" {
  name        = "My SPA"
  app_type    = "spa"
  grant_types = ["authorization_code", "refresh_token"]
}

resource "aws_cognito_user_pool_client" "app" {
  name                = "app-client"
  user_pool_id        = aws_cognito_user_pool.main.id
  allowed_oauth_flows = ["code"]
}
