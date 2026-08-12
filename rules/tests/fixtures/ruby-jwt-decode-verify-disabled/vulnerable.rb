require 'jwt'

class SessionController < ApplicationController
  def current_user_id
    token = request.headers['Authorization'].to_s.split(' ').last
    # ruleid: auth.ruby.jwt.decode-verify-disabled
    payload, = JWT.decode(token, nil, false)
    payload['sub']
  end

  def admin?
    token = cookies[:jwt]
    # ruleid: auth.ruby.jwt.decode-verify-disabled
    decoded = JWT.decode(token, ENV['JWT_SECRET'], false, { algorithm: 'HS256' })
    decoded.first['role'] == 'admin'
  end
end
