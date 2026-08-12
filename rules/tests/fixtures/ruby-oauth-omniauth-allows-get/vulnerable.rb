# frozen_string_literal: true

# ruleid: auth.ruby.oauth.omniauth-allows-get
OmniAuth.config.allowed_request_methods = [:get, :post]

# ruleid: auth.ruby.oauth.omniauth-allows-get
OmniAuth.config.allowed_request_methods = [:post, :get]

# ruleid: auth.ruby.oauth.omniauth-allows-get
OmniAuth.config.allowed_request_methods = [:get]

# ruleid: auth.ruby.oauth.omniauth-allows-get
OmniAuth.config.silence_get_warning = true
