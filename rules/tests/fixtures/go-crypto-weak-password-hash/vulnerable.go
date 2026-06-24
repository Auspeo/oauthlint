package main

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"fmt"
)

func hashWithMD5(password string) [16]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return md5.Sum([]byte(password))
}

func hashWithSHA1(password string) [20]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return sha1.Sum([]byte(password))
}

func hashWithSHA256(password string) [32]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return sha256.Sum256([]byte(password))
}

func hashWithWriter(password string) []byte {
	h := sha256.New()
	// ruleid: auth.go.crypto.weak-password-hash
	h.Write([]byte(password))
	return h.Sum(nil)
}

func main() {
	fmt.Println(
		hashWithMD5("hunter2"),
		hashWithSHA1("hunter2"),
		hashWithSHA256("hunter2"),
		hashWithWriter("hunter2"),
	)
}
