# frozen_string_literal: true

class ApiController < ApplicationController
  # ruleid: auth.ruby.session.skip-verify-authenticity-token
  skip_before_action :verify_authenticity_token

  # ruleid: auth.ruby.session.skip-verify-authenticity-token
  skip_before_action :verify_authenticity_token, only: [:create, :update]

  # ruleid: auth.ruby.session.skip-verify-authenticity-token
  skip_before_action :verify_authenticity_token, if: :json_request?

  def create
    head :created
  end
end
