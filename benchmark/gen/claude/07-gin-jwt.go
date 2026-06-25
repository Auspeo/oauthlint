// Package main demonstrates JWT authentication middleware for a Gin web API.
//
// Run:
//
//	go mod init jwtdemo
//	go get github.com/gin-gonic/gin github.com/golang-jwt/jwt/v5
//	JWT_SECRET=super-secret-change-me go run 07-gin-jwt.go
//
// Try it:
//
//	curl -s -X POST localhost:8080/login \
//	  -H 'Content-Type: application/json' \
//	  -d '{"username":"alice","password":"password123"}'
//
//	TOKEN=... # paste the token from the response
//	curl -s localhost:8080/api/me -H "Authorization: Bearer $TOKEN"
package main

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// jwtSecret is the HMAC signing key. In production load this from a secret
// manager / env var and never hard-code it.
var jwtSecret = func() []byte {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s)
	}
	// Dev fallback so the demo runs out of the box. DO NOT use in production.
	return []byte("dev-insecure-secret-change-me")
}()

const (
	tokenIssuer = "jwtdemo"
	tokenTTL    = time.Hour
)

// Claims is the custom JWT payload. RegisteredClaims provides the standard
// fields (exp, iat, iss, sub, ...) and built-in validation for them.
type Claims struct {
	UserID   string `json:"uid"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// user is a stand-in for a real user record from a database.
type user struct {
	ID           string
	Username     string
	PasswordHash string // demo only; use bcrypt-hashed values in real code
	Role         string
}

// userStore is a trivial in-memory "database". Replace with a real lookup.
// Passwords are plaintext here purely to keep the example runnable; in real
// code store a bcrypt hash and compare with bcrypt.CompareHashAndPassword.
var userStore = map[string]user{
	"alice": {ID: "1", Username: "alice", PasswordHash: "password123", Role: "admin"},
	"bob":   {ID: "2", Username: "bob", PasswordHash: "hunter2", Role: "user"},
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Token     string `json:"token"`
	TokenType string `json:"token_type"`
	ExpiresIn int    `json:"expires_in"` // seconds
}

func main() {
	r := gin.Default()

	r.POST("/login", loginHandler)

	// Protected route group. Every route under /api requires a valid token.
	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		api.GET("/me", meHandler)
		// Example of an additional role-gated route.
		api.GET("/admin", RequireRole("admin"), adminHandler)
	}

	// Default :8080
	if err := r.Run(); err != nil {
		panic(err)
	}
}

// loginHandler validates credentials and, on success, issues a signed JWT.
func loginHandler(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	u, ok := userStore[req.Username]
	// NOTE: replace this plaintext check with bcrypt.CompareHashAndPassword.
	if !ok || u.PasswordHash != req.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := generateToken(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, loginResponse{
		Token:     token,
		TokenType: "Bearer",
		ExpiresIn: int(tokenTTL.Seconds()),
	})
}

// generateToken builds and signs a JWT for the given user.
func generateToken(u user) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:   u.ID,
		Username: u.Username,
		Role:     u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    tokenIssuer,
			Subject:   u.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthMiddleware parses and validates the Bearer token on incoming requests.
// On success it stores the parsed claims in the Gin context for handlers to use.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := extractBearerToken(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(
			tokenString,
			claims,
			func(t *jwt.Token) (interface{}, error) {
				// Enforce the expected signing algorithm to prevent alg-swap attacks.
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, errors.New("unexpected signing method")
				}
				return jwtSecret, nil
			},
			jwt.WithIssuer(tokenIssuer),
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
		)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		// Make claims available to downstream handlers.
		c.Set("claims", claims)
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RequireRole returns middleware that allows the request only if the
// authenticated user has the given role. Must run after AuthMiddleware.
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("role") != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			return
		}
		c.Next()
	}
}

// extractBearerToken pulls the raw token out of the Authorization header.
func extractBearerToken(c *gin.Context) (string, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return "", errors.New("authorization header required")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", errors.New("authorization header must be 'Bearer <token>'")
	}
	return strings.TrimSpace(parts[1]), nil
}

// meHandler returns the authenticated user's identity from the token claims.
func meHandler(c *gin.Context) {
	claims, _ := c.Get("claims")
	c.JSON(http.StatusOK, gin.H{
		"user_id":  c.GetString("userID"),
		"username": c.GetString("username"),
		"role":     c.GetString("role"),
		"claims":   claims,
	})
}

// adminHandler is an example of a route gated behind RequireRole("admin").
func adminHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "welcome, admin " + c.GetString("username"),
	})
}
