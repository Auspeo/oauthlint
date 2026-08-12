import Vapor
import JWTKit

func configureJWT(_ app: Application) async throws {
    // ruleid: auth.swift.jwt.hardcoded-hmac-key
    await app.jwt.keys.add(hmac: "my-super-secret-signing-key", digestAlgorithm: .sha256)

    let keys = JWTKeyCollection()
    // ruleid: auth.swift.jwt.hardcoded-hmac-key
    await keys.add(hmac: "another-inline-secret", digestAlgorithm: .sha256, kid: "v1")
}
