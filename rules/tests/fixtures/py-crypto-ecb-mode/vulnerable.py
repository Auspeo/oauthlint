from Crypto.Cipher import AES

def encrypt(key, data):
    # ruleid: auth.py.crypto.ecb-mode
    cipher = AES.new(key, AES.MODE_ECB)
    return cipher.encrypt(data)
