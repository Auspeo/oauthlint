package main

import (
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
)

func setup(e *echo.Echo) {
	// ruleid: auth.go.jwt.echojwt-hardcoded-key
	e.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey: []byte("hardcoded-echo-jwt-secret"),
	}))

	// ruleid: auth.go.jwt.echojwt-hardcoded-key
	e.Use(echojwt.WithConfig(echojwt.Config{SigningKey: []byte("")}))
}
