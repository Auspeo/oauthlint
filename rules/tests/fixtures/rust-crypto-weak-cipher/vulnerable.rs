use des::cipher::{BlockEncrypt, KeyInit};
use des::{Des, TdesEde3};
use rc4::{KeyInit as Rc4KeyInit, Rc4, StreamCipher};

fn encrypt_token_des(key: &[u8]) -> impl BlockEncrypt {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = Des::new(key.into());
    cipher
}

fn encrypt_secret_3des(key: &[u8]) -> impl BlockEncrypt {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = TdesEde3::new(key.into());
    cipher
}

fn encrypt_token_rc4(key: &[u8]) -> impl StreamCipher {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = Rc4::new(key.into());
    cipher
}
