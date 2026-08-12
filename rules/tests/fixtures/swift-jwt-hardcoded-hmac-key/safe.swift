import Vapor
import JWTKit

func configureJWT(_ app: Application) async throws {
    // Key comes from the environment, not a literal.
    await app.jwt.keys.add(hmac: HMACKey(from: Environment.get("JWT_KEY")!), digestAlgorithm: .sha256)

    let keys = JWTKeyCollection()
    let key = HMACKey(from: Environment.get("SIGNING_KEY")!)
    await keys.add(hmac: key, digestAlgorithm: .sha256)
}
