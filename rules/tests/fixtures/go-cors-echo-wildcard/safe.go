package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func setupSafe(e *echo.Echo) {
	// Explicit allowlist: not flagged.
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"https://app.example.com"},
		AllowCredentials: true,
	}))
}
