# frozen_string_literal: true

# Options omitted -> Rails' secure defaults apply.
Rails.application.config.session_store :cookie_store, key: '_app_session'

# secure is gated on the environment, not disabled.
Rails.application.config.session_store :cookie_store, key: '_app_session', secure: Rails.env.production?

# Explicitly hardened.
Rails.application.config.session_store :cookie_store, key: '_app_session', secure: true, httponly: true
