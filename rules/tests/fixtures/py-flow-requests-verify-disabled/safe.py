import requests


def fetch_token(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.get(url)


def fetch_token_explicit(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.get(url, verify=True)


def post_with_custom_ca(url: str, data: dict):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.post(url, data=data, verify="/etc/ssl/ca.pem")


def exchange_via_session(url: str, payload: dict):
    session = requests.Session()
    # ok: auth.py.flow.requests-verify-disabled
    return session.get(url, params=payload, verify="/etc/ssl/certs/ca-bundle.crt")


def generic_request(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.request("GET", url, verify=True)
