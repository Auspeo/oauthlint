require 'jwt'

def issue(payload)
  # ok: key read from the environment, not a literal
  JWT.encode(payload, ENV.fetch('JWT_SECRET'), 'HS256')
end

def verify(token)
  # ok: key read from Rails credentials
  JWT.decode(token, Rails.application.credentials.jwt_secret, true, { algorithm: 'HS256' })
end
