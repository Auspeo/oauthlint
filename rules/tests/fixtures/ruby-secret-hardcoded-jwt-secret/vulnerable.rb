require 'jwt'

def issue(payload)
  # ruleid: auth.ruby.secret.hardcoded-jwt-secret
  JWT.encode(payload, 'sup3r-s3cret-signing-key', 'HS256')
end

def verify(token)
  # ruleid: auth.ruby.secret.hardcoded-jwt-secret
  JWT.decode(token, 'sup3r-s3cret-signing-key', true, { algorithm: 'HS256' })
end
