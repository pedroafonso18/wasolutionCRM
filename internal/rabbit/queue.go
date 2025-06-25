package rabbit

import (
	"WaSolCRM/internal/api"
	"encoding/json"
	"github.com/streadway/amqp"
	"log"
)

func SendToQueue(channel *amqp.Channel, request api.DetailedRequest) error {
	args := amqp.Table{"x-queue-type": "quorum"}
	_, err := channel.QueueDeclare("outgoing_requests", true, false, false, false, args)
	if err != nil {
		log.Fatalf("Error: Couldn't declare queue on RabbitMq: %s", err)
		return err
	}

	body, err := json.Marshal(request)
	if err != nil {
		log.Printf("Error marshalling request: %s", err)
		return err
	}

	err = channel.Publish(
		"",
		"outgoing_requests",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
	if err != nil {
		log.Printf("Error publishing to queue: %s", err)
		return err
	}

	return nil
}
