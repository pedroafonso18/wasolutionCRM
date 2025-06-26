package redis

type Message struct {
	ID        string `json:"id"`
	From      string `json:"from"`
	To        string `json:"to"`
	Text      string `json:"text"`
	Timestamp string `json:"timestamp"`
}

type Chat struct {
	ID         string  `json:"id"`
	Situation  string  `json:"situation"`
	IsActive   bool    `json:"is_active"`
	AgentID    *string `json:"agent_id"`
	Tabulation *string `json:"tabulation"`
}

type ChatPreview struct {
	ID          string  `json:"id"`
	Situation   string  `json:"situation"`
	IsActive    bool    `json:"is_active"`
	AgentID     *string `json:"agent_id"`
	LastMessage Message `json:"last_message,omitempty"`
}
