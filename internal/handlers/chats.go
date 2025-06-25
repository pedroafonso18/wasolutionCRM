package api

import (
	"WaSolCRM/config"
	waRedis "WaSolCRM/internal/redis"
	"encoding/json"
	"net/http"
)

func GetChatsHandler(w http.ResponseWriter, r *http.Request) {
	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}
	chats, err := waRedis.GetChats(rdb)
	if err != nil {
		http.Error(w, "Failed to get chats", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chats)
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}
	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		http.Error(w, "Missing chatID", 400)
		return
	}
	messages, err := waRedis.GetMessages(rdb, chatID)
	if err != nil {
		http.Error(w, "Failed to get messages", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
