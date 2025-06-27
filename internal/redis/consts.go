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
	InstanceID *string `json:"instance_id"`
	Number     string  `json:"number"`
}

type ChatPreview struct {
	ID          string  `json:"id"`
	Situation   string  `json:"situation"`
	IsActive    bool    `json:"is_active"`
	AgentID     *string `json:"agent_id"`
	Number      string  `json:"number"`
	LastMessage Message `json:"last_message,omitempty"`
}

type Contact struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Number    string `json:"number"`
	CreatedAt string `json:"created_at"`
}
