"""OAuth token requests using the forbidden ROPC (password) grant."""

import requests
import httpx

TOKEN_URL = "https://idp.example.com/oauth/token"


def login_requests(username: str, password: str):
    # ruleid: auth.py.oauth.ropc-grant
    return requests.post(
        TOKEN_URL,
        data={"grant_type": "password", "username": username, "password": password},
    )


def login_httpx(username: str, password: str):
    # ruleid: auth.py.oauth.ropc-grant
    return httpx.post(TOKEN_URL, data={'grant_type': 'password', 'username': username})


def login_body_string(username: str, password: str):
    # ruleid: auth.py.oauth.ropc-grant
    body = "grant_type=password&username=alice&password=secret"
    return requests.post(TOKEN_URL, data=body)


def login_pairs(username: str, password: str):
    # ruleid: auth.py.oauth.ropc-grant
    return requests.post(TOKEN_URL, data=[("grant_type", "password"), ("username", username)])
