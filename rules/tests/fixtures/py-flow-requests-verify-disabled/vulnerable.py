import requests


def fetch_token(url: str):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.get(url, verify=False)


def post_credentials(url: str, data: dict):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.post(url, data=data, verify=False, timeout=10)


def exchange_via_session(url: str, payload: dict):
    session = requests.Session()
    # ruleid: auth.py.flow.requests-verify-disabled
    return session.get(url, params=payload, verify=False)


def generic_request(url: str):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.request("GET", url, verify=False)


def session_post(session, url: str, body: dict):
    # ruleid: auth.py.flow.requests-verify-disabled
    return session.post(url, json=body, verify=False)
