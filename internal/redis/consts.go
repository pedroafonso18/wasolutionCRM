package redis

type Message struct {
	ID        string `json:"id"`
	From      string `json:"from"`
	To        string `json:"to"`
	Text      string `json:"text"`
	Timestamp string `json:"timestamp"`
}

type ChatPreview struct {
	ChatID      string  `json:"chat_id"`
	LastMessage Message `json:"last_message"`
}
