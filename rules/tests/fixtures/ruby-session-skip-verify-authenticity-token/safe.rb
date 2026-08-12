# frozen_string_literal: true

class ApplicationController < ActionController::Base
  # CSRF protection stays on for browser-facing controllers.
  protect_from_forgery with: :exception

  # Skipping a different callback is unrelated to CSRF.
  skip_before_action :require_login, only: [:index]
end
