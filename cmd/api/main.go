package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gabehf/koito/engine"
)

const defaultVersion = "v0.4.0"

var Version = defaultVersion

func main() {
	version := Version
	if version == "" {
		version = defaultVersion
	}
	if !strings.HasSuffix(version, "-miicat") {
		version += "-miicat"
	}

	if len(os.Args) > 1 && os.Args[1] == "reset-password" {
		if err := engine.ResetPassword(readEnvOrFile, os.Stdout, version); err != nil {
			fmt.Fprintf(os.Stderr, "%s\n", err)
			os.Exit(1)
		}
		return
	}
	if err := engine.Run(readEnvOrFile, os.Stdout, version); err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

func readEnvOrFile(envName string) string {
	envContent := os.Getenv(envName)

	if envContent == "" {
		filename := os.Getenv(envName + "_FILE")

		if filename != "" {
			b, err := os.ReadFile(filename)

			if err != nil {
				log.Fatalf("Failed to load file for %s_FILE (%s): %s", envName, filename, err)
			}

			envContent = strings.TrimSpace(string(b))
		}
	}

	return envContent
}
