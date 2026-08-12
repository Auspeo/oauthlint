import Security

func storeToken(_ data: Data) {
    // ruleid: auth.swift.keychain.insecure-accessible
    let query1: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccessible as String: kSecAttrAccessibleAlways,
        kSecValueData as String: data,
    ]
    SecItemAdd(query1 as CFDictionary, nil)

    // ruleid: auth.swift.keychain.insecure-accessible
    let query2: [String: Any] = [
        kSecAttrAccessible as String: kSecAttrAccessibleAlwaysThisDeviceOnly,
        kSecValueData as String: data,
    ]
    SecItemAdd(query2 as CFDictionary, nil)
}
