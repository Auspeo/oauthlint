# frozen_string_literal: true

# POST-only request phase is the safe default.
OmniAuth.config.allowed_request_methods = [:post]

# The GET warning is left enabled.
OmniAuth.config.silence_get_warning = false
