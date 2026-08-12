import os
from Crypto.Cipher import AES

def encrypt(key, data):
    nonce = os.urandom(12)
    # ok: authenticated GCM mode with a random nonce
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.encrypt(data)
