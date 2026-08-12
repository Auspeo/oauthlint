package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func setupSafe(app *fiber.App) {
	// Explicit allowlist: not flagged.
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://app.example.com",
		AllowCredentials: true,
	}))

	app.Use(cors.New(cors.Config{AllowOrigins: "https://a.example.com,https://b.example.com"}))
}
