# frozen_string_literal: true

Doorkeeper.configure do
  orm :active_record

  # ruleid: auth.ruby.oauth.doorkeeper-insecure-config
  force_ssl_in_redirect_uri false

  # ruleid: auth.ruby.oauth.doorkeeper-insecure-config
  allow_blank_redirect_uri true

  # ruleid: auth.ruby.oauth.doorkeeper-insecure-config
  skip_authorization do
    true
  end
end
