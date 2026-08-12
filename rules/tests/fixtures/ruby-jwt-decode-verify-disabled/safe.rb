require 'jwt'

class SessionController < ApplicationController
  def current_user_id
    token = request.headers['Authorization'].to_s.split(' ').last
    # ok: verification is on and the algorithm is pinned
    payload, = JWT.decode(token, ENV.fetch('JWT_SECRET'), true, { algorithm: 'HS256' })
    payload['sub']
  end
end
