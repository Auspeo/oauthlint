require 'jwt'

def verify(token)
  key = ENV.fetch('JWT_SECRET')
  # ruleid: auth.ruby.jwt.missing-algorithm-allowlist
  payload, = JWT.decode(token, key, true)
  payload
end

def verify_rsa(token, public_key)
  # ruleid: auth.ruby.jwt.missing-algorithm-allowlist
  JWT.decode(token, public_key, true)
end
