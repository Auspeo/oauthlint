import Security

func storeToken(_ data: Data) {
    // Restrictive accessibility: only when unlocked, never off-device.
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        kSecValueData as String: data,
    ]
    SecItemAdd(query as CFDictionary, nil)
}
