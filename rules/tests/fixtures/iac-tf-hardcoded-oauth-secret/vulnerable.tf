provider "okta" {
  org_name = "example"
  # ruleid: auth.iac.tf-hardcoded-oauth-secret
  api_token = "00aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdef"
  # ruleid: auth.iac.tf-hardcoded-oauth-secret
  client_secret = "s3cr3t-hardcoded-oauth-client-secret-value"
}
