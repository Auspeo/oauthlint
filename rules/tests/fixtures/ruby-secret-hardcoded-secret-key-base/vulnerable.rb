# frozen_string_literal: true

# ruleid: auth.ruby.secret.hardcoded-secret-key-base
Rails.application.config.secret_key_base = "3f9a8c1e0b7d4a2f6c5e8d1b9a0f7c3e"

# ruleid: auth.ruby.secret.hardcoded-secret-key-base
MyApp::Application.config.secret_key = "s3cr3t-development-key"
