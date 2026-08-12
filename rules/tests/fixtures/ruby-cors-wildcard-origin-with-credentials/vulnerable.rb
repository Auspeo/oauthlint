# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    # ruleid: auth.ruby.cors.wildcard-origin-with-credentials
    resource '*', headers: :any, methods: [:get, :post], credentials: true
  end
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # ruleid: auth.ruby.cors.wildcard-origin-with-credentials
    resource '/api/*', headers: :any, methods: [:any], credentials: true
    origins "*"
  end
end
