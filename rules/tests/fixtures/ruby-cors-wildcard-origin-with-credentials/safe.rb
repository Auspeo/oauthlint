# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Wildcard origin but no credentials -> allowed by the spec.
  allow do
    origins '*'
    resource '*', headers: :any, methods: [:get, :post]
  end
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Credentials but scoped to an explicit origin allow-list.
  allow do
    origins 'https://app.example.com', 'https://admin.example.com'
    resource '*', headers: :any, methods: [:any], credentials: true
  end
end
