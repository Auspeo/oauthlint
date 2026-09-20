# ruleid: auth.iac.tf-oauth-implicit-grant
resource "auth0_client" "web" {
  name        = "My SPA"
  app_type    = "spa"
  grant_types = ["implicit", "authorization_code"]
}

# ruleid: auth.iac.tf-oauth-implicit-grant
resource "aws_cognito_user_pool_client" "app" {
  name                = "app-client"
  user_pool_id        = aws_cognito_user_pool.main.id
  allowed_oauth_flows = ["implicit", "code"]
}
