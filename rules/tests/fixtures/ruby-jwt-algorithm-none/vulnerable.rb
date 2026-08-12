require 'jwt'

def issue(payload)
  # ruleid: auth.ruby.jwt.algorithm-none
  JWT.encode(payload, nil, 'none')
end

def check(token)
  # ruleid: auth.ruby.jwt.algorithm-none
  JWT.decode(token, nil, true, { algorithm: 'none' })
end

def check_list(token)
  # ruleid: auth.ruby.jwt.algorithm-none
  JWT.decode(token, nil, true, algorithms: ['none', 'HS256'])
end
