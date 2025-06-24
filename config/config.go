package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Config struct {
	DbUrl string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro carregando arquivo .env!")
	}

	return &Config{
		DbUrl: os.Getenv("DB_HOST"),
	}
}
