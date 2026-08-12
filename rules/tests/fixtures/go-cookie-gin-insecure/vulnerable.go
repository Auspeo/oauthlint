package main

import "github.com/gin-gonic/gin"

func setInsecure(c *gin.Context) {
	// ruleid: auth.go.cookie.gin-insecure
	c.SetCookie("session_id", "tok", 3600, "/", "", false, false)

	// ruleid: auth.go.cookie.gin-insecure
	c.SetCookie("auth_token", "tok", 3600, "/", "example.com", false, true)

	// ruleid: auth.go.cookie.gin-insecure
	c.SetCookie("refresh_token", "tok", 3600, "/", "", true, false)
}
