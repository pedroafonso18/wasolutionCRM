package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DbUrl         string
	JWT           string
	WaSolKey      string
	WaSolUrl      string
	RabbitMQ      string
	RedisUrl      string
	RedisPassword string
	SSLCert       string
	SSLKey        string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro carregando arquivo .env!")
	}

	return &Config{
		DbUrl:         os.Getenv("DB_URL"),
		JWT:           os.Getenv("JWT_KEY"),
		WaSolKey:      os.Getenv("WASOLUTION_KEY"),
		RabbitMQ:      os.Getenv("RABBITMQ_URL"),
		RedisUrl:      os.Getenv("REDIS_URL"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		WaSolUrl:      os.Getenv("WASOLUTION_URL"),
		SSLCert:       os.Getenv("SSL_CERT"),
		SSLKey:        os.Getenv("SSL_KEY"),
	}
}
