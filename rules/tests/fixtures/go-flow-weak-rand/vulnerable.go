package main

import (
	"fmt"
	"math/rand"
)

func makeToken() int64 {
	// ruleid: auth.go.flow.weak-rand
	token := rand.Int63()
	return token
}

func makeSecret() int {
	// ruleid: auth.go.flow.weak-rand
	secret := rand.Intn(1000000)
	return secret
}

func makeOTP() int {
	var otp int
	// ruleid: auth.go.flow.weak-rand
	otp = rand.Intn(999999)
	return otp
}

func makeSessionKey() float64 {
	// ruleid: auth.go.flow.weak-rand
	sessionKey := rand.Float64()
	return sessionKey
}

func main() {
	fmt.Println(makeToken(), makeSecret(), makeOTP(), makeSessionKey())
}
