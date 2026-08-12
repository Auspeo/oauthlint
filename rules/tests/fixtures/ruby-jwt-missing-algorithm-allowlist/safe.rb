require 'jwt'

def verify(token)
  key = ENV.fetch('JWT_SECRET')
  # ok: algorithm allow-list pinned via the options hash
  payload, = JWT.decode(token, key, true, { algorithm: 'HS256' })
  payload
end

def verify_rsa(token, public_key)
  # ok: asymmetric allow-list pinned
  JWT.decode(token, public_key, true, algorithms: ['RS256'])
end
