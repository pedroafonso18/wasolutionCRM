package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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
		chatKey := fmt.Sprintf("chat:%s", chatID)
		chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
		if err == redis.Nil {
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
		}

		var chat Chat
		if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
			return nil, fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
		}

		msgList, err := rdb.LRange(ctx, fmt.Sprintf("chat:%s:messages", chatID), 0, -1).Result()
		if err == redis.Nil || len(msgList) == 0 {
			chats = append(chats, ChatPreview{
				ID:        chat.ID,
				Situation: chat.Situation,
				IsActive:  chat.IsActive,
				AgentID:   chat.AgentID,
				Number:    chat.Number,
			})
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch message for chat %s: %w", chatID, err)
		}

		var msg Message
		lastMsgJSON := msgList[len(msgList)-1]
		if err := json.Unmarshal([]byte(lastMsgJSON), &msg); err != nil {
			return nil, fmt.Errorf("failed to decode message for chat %s: %w", chatID, err)
		}

		chats = append(chats, ChatPreview{
			ID:          chat.ID,
			Situation:   chat.Situation,
			IsActive:    chat.IsActive,
			AgentID:     chat.AgentID,
			Number:      chat.Number,
			LastMessage: msg,
		})
	}

	return chats, nil
}

func GetQueuedChats(rdb *redis.Client) ([]ChatPreview, error) {
	ctx := context.Background()

	chatIDs, err := rdb.SMembers(ctx, "chats").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch chat IDs: %w", err)
	}

	fmt.Printf("Found %d chat IDs: %v\n", len(chatIDs), chatIDs)

	var queuedChats []ChatPreview

	for _, chatID := range chatIDs {
		chatKey := fmt.Sprintf("chat:%s", chatID)
		chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
		if err == redis.Nil {
			fmt.Printf("Chat %s not found in Redis\n", chatID)
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
		}

		fmt.Printf("Chat %s JSON: %s\n", chatID, chatJSON)

		var chat Chat
		if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
			return nil, fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
		}

		fmt.Printf("Chat %s parsed: ID=%s, Situation=%s, IsActive=%v, AgentID=%v\n",
			chatID, chat.ID, chat.Situation, chat.IsActive, chat.AgentID)

		isQueued := chat.IsActive && chat.Situation == "queued" && chat.AgentID == nil
		fmt.Printf("Chat %s queue check: IsActive=%v, Situation='%s'=='queued'=%v, AgentID==nil=%v, IsQueued=%v\n",
			chatID, chat.IsActive, chat.Situation, chat.Situation == "queued", chat.AgentID == nil, isQueued)

		if isQueued {
			msgKey := fmt.Sprintf("chat:%s:messages", chatID)
			msgJSON, err := rdb.LIndex(ctx, msgKey, -1).Result()
			if err == redis.Nil {
				fmt.Printf("Chat %s has no messages\n", chatID)
				queuedChats = append(queuedChats, ChatPreview{
					ID:        chat.ID,
					Situation: chat.Situation,
					IsActive:  chat.IsActive,
					AgentID:   chat.AgentID,
					Number:    chat.Number,
				})
				continue
			} else if err != nil {
				return nil, fmt.Errorf("failed to fetch message for chat %s: %w", chatID, err)
			}

			var msg Message
			if err := json.Unmarshal([]byte(msgJSON), &msg); err != nil {
				return nil, fmt.Errorf("failed to decode message for chat %s: %w", chatID, err)
			}

			queuedChats = append(queuedChats, ChatPreview{
				ID:          chat.ID,
				Situation:   chat.Situation,
				IsActive:    chat.IsActive,
				AgentID:     chat.AgentID,
				Number:      chat.Number,
				LastMessage: msg,
			})
			fmt.Printf("Added chat %s to queue\n", chatID)
		}
	}

	fmt.Printf("Returning %d queued chats\n", len(queuedChats))
	return queuedChats, nil
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

func GetMyChats(rdb *redis.Client, userID string) ([]ChatPreview, error) {
	ctx := context.Background()

	chatIDs, err := rdb.SMembers(ctx, "chats").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch chat IDs: %w", err)
	}

	var myChats []ChatPreview

	for _, chatID := range chatIDs {
		chatKey := fmt.Sprintf("chat:%s", chatID)
		chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
		if err == redis.Nil {
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
		}

		var chat Chat
		if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
			return nil, fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
		}

		if chat.AgentID != nil && *chat.AgentID == userID && chat.IsActive {
			msgList, err := rdb.LRange(ctx, fmt.Sprintf("chat:%s:messages", chatID), 0, -1).Result()
			if err == redis.Nil || len(msgList) == 0 {
				myChats = append(myChats, ChatPreview{
					ID:        chat.ID,
					Situation: chat.Situation,
					IsActive:  chat.IsActive,
					AgentID:   chat.AgentID,
					Number:    chat.Number,
				})
				continue
			} else if err != nil {
				return nil, fmt.Errorf("failed to fetch message for chat %s: %w", chatID, err)
			}

			var msg Message
			lastMsgJSON := msgList[len(msgList)-1]
			if err := json.Unmarshal([]byte(lastMsgJSON), &msg); err != nil {
				return nil, fmt.Errorf("failed to decode message for chat %s: %w", chatID, err)
			}

			myChats = append(myChats, ChatPreview{
				ID:          chat.ID,
				Situation:   chat.Situation,
				IsActive:    chat.IsActive,
				AgentID:     chat.AgentID,
				Number:      chat.Number,
				LastMessage: msg,
			})
		}
	}

	return myChats, nil
}

func TransferChat(rdb *redis.Client, chatID, agentID string) error {
	ctx := context.Background()

	chatKey := fmt.Sprintf("chat:%s", chatID)
	chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
	if err == redis.Nil {
		return fmt.Errorf("chat %s not found", chatID)
	} else if err != nil {
		return fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
	}

	var chat Chat
	if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
		return fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
	}

	chat.AgentID = &agentID
	chat.Situation = "active"

	updatedChatJSON, err := json.Marshal(chat)
	if err != nil {
		return fmt.Errorf("failed to encode updated chat data: %w", err)
	}

	err = rdb.LSet(ctx, chatKey, 0, updatedChatJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to update chat in Redis: %w", err)
	}

	transferMsg := Message{
		ID:        fmt.Sprintf("transfer_%d", time.Now().Unix()),
		From:      "system",
		To:        chatID,
		Text:      fmt.Sprintf("Chat transferido para o agente %s", agentID),
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	transferMsgJSON, err := json.Marshal(transferMsg)
	if err != nil {
		return fmt.Errorf("failed to encode transfer message: %w", err)
	}

	msgKey := fmt.Sprintf("chat:%s:messages", chatID)
	err = rdb.RPush(ctx, msgKey, transferMsgJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to add transfer message: %w", err)
	}

	return nil
}

func StartChat(rdb *redis.Client, chatID, agentID, instanceID string) error {
	ctx := context.Background()

	chatKey := fmt.Sprintf("chat:%s", chatID)
	chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
	if err == redis.Nil {
		return fmt.Errorf("chat %s not found", chatID)
	} else if err != nil {
		return fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
	}

	var chat Chat
	if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
		return fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
	}

	chat.AgentID = &agentID
	chat.InstanceID = &instanceID
	chat.Situation = "active"
	chat.IsActive = true

	updatedChatJSON, err := json.Marshal(chat)
	if err != nil {
		return fmt.Errorf("failed to encode updated chat data: %w", err)
	}

	err = rdb.LSet(ctx, chatKey, 0, updatedChatJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to update chat in Redis: %w", err)
	}

	startMsg := Message{
		ID:        fmt.Sprintf("start_%d", time.Now().Unix()),
		From:      "system",
		To:        chatID,
		Text:      fmt.Sprintf("Chat iniciado pelo agente %s usando instância %s", agentID, instanceID),
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	startMsgJSON, err := json.Marshal(startMsg)
	if err != nil {
		return fmt.Errorf("failed to encode start message: %w", err)
	}

	msgKey := fmt.Sprintf("chat:%s:messages", chatID)
	err = rdb.RPush(ctx, msgKey, startMsgJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to add start message: %w", err)
	}

	return nil
}

func TakeChat(rdb *redis.Client, chatID, agentID string) error {
	ctx := context.Background()

	chatKey := fmt.Sprintf("chat:%s", chatID)
	chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
	if err == redis.Nil {
		return fmt.Errorf("chat %s not found", chatID)
	} else if err != nil {
		return fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
	}

	var chat Chat
	if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
		return fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
	}

	chat.AgentID = &agentID
	chat.Situation = "active"
	chat.IsActive = true

	updatedChatJSON, err := json.Marshal(chat)
	if err != nil {
		return fmt.Errorf("failed to encode updated chat data: %w", err)
	}

	err = rdb.LSet(ctx, chatKey, 0, updatedChatJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to update chat in Redis: %w", err)
	}

	takeMsg := Message{
		ID:        fmt.Sprintf("take_%d", time.Now().Unix()),
		From:      "system",
		To:        chatID,
		Text:      fmt.Sprintf("Chat assumido pelo agente %s", agentID),
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	takeMsgJSON, err := json.Marshal(takeMsg)
	if err != nil {
		return fmt.Errorf("failed to encode take message: %w", err)
	}

	msgKey := fmt.Sprintf("chat:%s:messages", chatID)
	err = rdb.RPush(ctx, msgKey, takeMsgJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to add take message: %w", err)
	}

	return nil
}

func AddMessage(rdb *redis.Client, chatID string, message Message) error {
	ctx := context.Background()

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to encode message: %w", err)
	}

	msgKey := fmt.Sprintf("chat:%s:messages", chatID)
	err = rdb.RPush(ctx, msgKey, messageJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to add message to Redis: %w", err)
	}

	chatKey := fmt.Sprintf("chat:%s", chatID)
	_, err = rdb.LIndex(ctx, chatKey, 0).Result()
	if err == redis.Nil {
		chat := Chat{
			ID:        chatID,
			Situation: "active",
			IsActive:  true,
		}
		newChatJSON, err := json.Marshal(chat)
		if err != nil {
			return fmt.Errorf("failed to encode new chat: %w", err)
		}
		err = rdb.RPush(ctx, chatKey, newChatJSON).Err()
		if err != nil {
			return fmt.Errorf("failed to create chat: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("failed to fetch chat data: %w", err)
	}

	err = rdb.SAdd(ctx, "chats", chatID).Err()
	if err != nil {
		return fmt.Errorf("failed to add chat to global set: %w", err)
	}

	return nil
}

func CloseChat(rdb *redis.Client, chatID, tabulation string) error {
	ctx := context.Background()

	chatKey := fmt.Sprintf("chat:%s", chatID)
	chatJSON, err := rdb.LIndex(ctx, chatKey, 0).Result()
	if err == redis.Nil {
		return fmt.Errorf("chat %s not found", chatID)
	} else if err != nil {
		return fmt.Errorf("failed to fetch chat data for %s: %w", chatID, err)
	}

	var chat Chat
	if err := json.Unmarshal([]byte(chatJSON), &chat); err != nil {
		return fmt.Errorf("failed to decode chat data for %s: %w", chatID, err)
	}

	chat.Tabulation = &tabulation
	chat.AgentID = nil
	chat.Situation = "finished"
	chat.IsActive = false

	updatedChatJSON, err := json.Marshal(chat)
	if err != nil {
		return fmt.Errorf("failed to encode updated chat data: %w", err)
	}

	err = rdb.LSet(ctx, chatKey, 0, updatedChatJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to update chat in Redis: %w", err)
	}

	UpdateMsg := Message{
		ID:        fmt.Sprintf("finished_%d", time.Now().Unix()),
		From:      "system",
		To:        chatID,
		Text:      fmt.Sprintf("Chat finalizado com tabulação: %s", tabulation),
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	takeMsgJSON, err := json.Marshal(UpdateMsg)
	if err != nil {
		return fmt.Errorf("failed to encode update message: %w", err)
	}

	msgKey := fmt.Sprintf("chat:%s:messages", chatID)
	err = rdb.RPush(ctx, msgKey, takeMsgJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to add finish message: %w", err)
	}

	return nil
}

func GetContacts(rdb *redis.Client) ([]Contact, error) {
	ctx := context.Background()

	contactIDs, err := rdb.SMembers(ctx, "contacts").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch contact IDs: %w", err)
	}

	var contacts []Contact

	for _, contactID := range contactIDs {
		contactKey := fmt.Sprintf("contact:%s", contactID)
		contactJSON, err := rdb.Get(ctx, contactKey).Result()
		if err == redis.Nil {
			continue
		} else if err != nil {
			return nil, fmt.Errorf("failed to fetch contact data for %s: %w", contactID, err)
		}

		var contact Contact
		if err := json.Unmarshal([]byte(contactJSON), &contact); err != nil {
			return nil, fmt.Errorf("failed to decode contact data for %s: %w", contactID, err)
		}

		contacts = append(contacts, contact)
	}

	return contacts, nil
}

func AddContact(rdb *redis.Client, contact Contact) error {
	ctx := context.Background()

	contactJSON, err := json.Marshal(contact)
	if err != nil {
		return fmt.Errorf("failed to encode contact data: %w", err)
	}

	contactKey := fmt.Sprintf("contact:%s", contact.ID)
	err = rdb.Set(ctx, contactKey, contactJSON, 0).Err()
	if err != nil {
		return fmt.Errorf("failed to save contact to Redis: %w", err)
	}

	err = rdb.SAdd(ctx, "contacts", contact.ID).Err()
	if err != nil {
		return fmt.Errorf("failed to add contact to global set: %w", err)
	}

	return nil
}

func GetContact(rdb *redis.Client, contactID string) (*Contact, error) {
	ctx := context.Background()

	contactKey := fmt.Sprintf("contact:%s", contactID)
	contactJSON, err := rdb.Get(ctx, contactKey).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("contact %s not found", contactID)
	} else if err != nil {
		return nil, fmt.Errorf("failed to fetch contact data: %w", err)
	}

	var contact Contact
	if err := json.Unmarshal([]byte(contactJSON), &contact); err != nil {
		return nil, fmt.Errorf("failed to decode contact data: %w", err)
	}

	return &contact, nil
}

func DeleteContact(rdb *redis.Client, contactID string) error {
	ctx := context.Background()

	contactKey := fmt.Sprintf("contact:%s", contactID)
	err := rdb.Del(ctx, contactKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete contact from Redis: %w", err)
	}

	err = rdb.SRem(ctx, "contacts", contactID).Err()
	if err != nil {
		return fmt.Errorf("failed to remove contact from global set: %w", err)
	}

	return nil
}

func AddChat(rdb *redis.Client, chat Chat) error {
	ctx := context.Background()

	chatJSON, err := json.Marshal(chat)
	if err != nil {
		return fmt.Errorf("failed to encode chat data: %w", err)
	}

	chatKey := fmt.Sprintf("chat:%s", chat.ID)
	err = rdb.RPush(ctx, chatKey, chatJSON).Err()
	if err != nil {
		return fmt.Errorf("failed to save chat to Redis: %w", err)
	}

	err = rdb.SAdd(ctx, "chats", chat.ID).Err()
	if err != nil {
		return fmt.Errorf("failed to add chat to global set: %w", err)
	}

	return nil
}
