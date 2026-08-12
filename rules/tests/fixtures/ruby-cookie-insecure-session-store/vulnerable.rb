# frozen_string_literal: true

# ruleid: auth.ruby.cookie.insecure-session-store
Rails.application.config.session_store :cookie_store, key: '_app_session', secure: false

# ruleid: auth.ruby.cookie.insecure-session-store
Rails.application.config.session_store :cookie_store, key: '_app_session', httponly: false
