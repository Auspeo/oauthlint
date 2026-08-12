require 'jwt'

def issue(payload)
  # ok: signed with a real algorithm and a key from the environment
  JWT.encode(payload, ENV.fetch('JWT_SECRET'), 'HS256')
end

def check(token)
  # ok: real algorithm pinned
  JWT.decode(token, ENV.fetch('JWT_SECRET'), true, { algorithm: 'HS256' })
end
