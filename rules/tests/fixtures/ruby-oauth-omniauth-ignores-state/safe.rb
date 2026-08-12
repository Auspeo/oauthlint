# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  # State is validated (the default): the flag is explicitly false.
  provider :developer, provider_ignores_state: false
end

OMNIAUTH_OPTIONS = { 'provider_ignores_state' => false }.freeze
