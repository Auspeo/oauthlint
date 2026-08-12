package main

import "github.com/gin-gonic/gin"

func setSecure(c *gin.Context) {
	// Both flags true on an auth cookie: not flagged.
	c.SetCookie("session_id", "tok", 3600, "/", "", true, true)

	// Non-sensitive cookie name: outside the auth-cookie scope.
	c.SetCookie("theme", "dark", 3600, "/", "", false, false)

	// Flags supplied as variables (e.g. from config), not literal false.
	secure := true
	httpOnly := true
	c.SetCookie("access_token", "tok", 3600, "/", "", secure, httpOnly)
}
