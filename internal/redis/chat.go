package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
)

func GetChats(rdb *redis.Client) ([]ChatPreview, error) {
	ctx := context.Background()

	chatIDs, err := rdb.SMembers(ctx, "chats").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch chat IDs: %w", err)
	}

	var chats []ChatPreview

	for _, chatID := range chatIDs {
		key := fmt.Sprintf("chat:%s:messages", chatID)
		msgJSON, err := rdb.LIndex(ctx, key, -1).Result()
		if err == redis.Nil {
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch message for chat %s: %w", chatID, err)
		}

		var msg Message
		if err := json.Unmarshal([]byte(msgJSON), &msg); err != nil {
			return nil, fmt.Errorf("failed to decode message for chat %s: %w", chatID, err)
		}

		chats = append(chats, ChatPreview{
			ChatID:      chatID,
			LastMessage: msg,
		})
	}

	return chats, nil
}

func GetMessages(rdb *redis.Client, chatID string) ([]Message, error) {
	ctx := context.Background()

	key := fmt.Sprintf("chat:%s:messages", chatID)

	rawMessages, err := rdb.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages for chat %s: %w", chatID, err)
	}

	var messages []Message

	for _, raw := range rawMessages {
		var msg Message
		if err := json.Unmarshal([]byte(raw), &msg); err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
