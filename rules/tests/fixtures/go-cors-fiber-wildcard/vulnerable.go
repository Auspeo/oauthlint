package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func setup(app *fiber.App) {
	// ruleid: auth.go.cors.fiber-wildcard
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowCredentials: true,
	}))

	// ruleid: auth.go.cors.fiber-wildcard
	app.Use(cors.New(cors.Config{AllowOrigins: "https://app.example.com, *"}))
}
