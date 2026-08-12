package main

import (
	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
)

func setup(app *fiber.App) {
	// ruleid: auth.go.jwt.fiber-hardcoded-key
	app.Use(jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte("hardcoded-fiber-jwt-secret")},
	}))
}
