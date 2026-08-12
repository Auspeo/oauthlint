# frozen_string_literal: true

# Read from the environment, not a literal.
Rails.application.config.secret_key_base = ENV["SECRET_KEY_BASE"]

Rails.application.config.secret_key_base = ENV.fetch("SECRET_KEY_BASE")

# Encrypted Rails credentials.
Rails.application.config.secret_key_base = Rails.application.credentials.secret_key_base
