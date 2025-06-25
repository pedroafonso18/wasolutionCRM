package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Config struct {
	DbUrl    string
	JWT      string
	WaSolKey string
	RabbitMQ string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro carregando arquivo .env!")
	}

	return &Config{
		DbUrl:    os.Getenv("DB_URL"),
		JWT:      os.Getenv("JWT_KEY"),
		WaSolKey: os.Getenv("WASOLUTION_KEY"),
		RabbitMQ: os.Getenv("RABBITMQ_URL"),
	}
}
