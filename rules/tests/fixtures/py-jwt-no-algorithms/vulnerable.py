import jwt


def verify_no_algorithms(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key)


def verify_with_audience(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, audience="my-api")


def verify_with_issuer_and_audience(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, audience="my-api", issuer="https://issuer.example")


def verify_with_leeway(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, leeway=10)
