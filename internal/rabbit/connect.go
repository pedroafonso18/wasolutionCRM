package rabbit

import (
	"github.com/streadway/amqp"
)

func ConnectRabbit(url string) (*amqp.Channel, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	return ch, nil
}
