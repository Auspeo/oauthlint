package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func setup(e *echo.Echo) {
	// ruleid: auth.go.cors.echo-wildcard
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowCredentials: true,
	}))

	// ruleid: auth.go.cors.echo-wildcard
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"https://app.example.com", "*"},
	}))
}
