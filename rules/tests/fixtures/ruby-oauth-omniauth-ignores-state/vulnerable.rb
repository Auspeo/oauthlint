# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  # ruleid: auth.ruby.oauth.omniauth-ignores-state
  provider :developer, provider_ignores_state: true
end

# ruleid: auth.ruby.oauth.omniauth-ignores-state
OMNIAUTH_OPTIONS = { 'provider_ignores_state' => true }.freeze
