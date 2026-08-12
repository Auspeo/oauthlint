# frozen_string_literal: true

Doorkeeper.configure do
  orm :active_record

  # HTTPS redirect URIs are enforced (the default).
  force_ssl_in_redirect_uri true

  # Authorization is skipped only for trusted first-party clients.
  skip_authorization do |resource_owner, client|
    client.application.superapp? || resource_owner.admin?
  end
end
