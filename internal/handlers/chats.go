package api

import (
	"WaSolCRM/config"
	"WaSolCRM/internal/api"
	"WaSolCRM/internal/database"
	"WaSolCRM/internal/rabbit"
	waRedis "WaSolCRM/internal/redis"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GetChatsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetChatsHandler called")

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	chats, err := waRedis.GetChats(rdb)
	if err != nil {
		log.Printf("GetChats error: %v", err)
		http.Error(w, "Failed to get chats", 500)
		return
	}

	log.Printf("Retrieved %d chats", len(chats))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(chats); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetMessagesHandler called")

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	chatID := r.URL.Query().Get("chatID")
	if chatID == "" {
		log.Println("Missing chatID parameter")
		http.Error(w, "Missing chatID", 400)
		return
	}

	log.Printf("Getting messages for chat: %s", chatID)

	messages, err := waRedis.GetMessages(rdb, chatID)
	if err != nil {
		log.Printf("GetMessages error: %v", err)
		http.Error(w, "Failed to get messages", 500)
		return
	}

	log.Printf("Retrieved %d messages for chat %s", len(messages), chatID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(messages); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetQueuedChatsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetQueuedChatsHandler called")

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	chats, err := waRedis.GetQueuedChats(rdb)
	if err != nil {
		log.Printf("GetQueuedChats error: %v", err)
		http.Error(w, "Failed to get queued chats", 500)
		return
	}

	log.Printf("Retrieved %d queued chats", len(chats))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(chats); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetUserInfoHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetUserInfoHandler called")

	user, err := getUserFromToken(r)
	if err != nil {
		log.Printf("Error getting user from token: %v", err)
		http.Error(w, "Unauthorized", 401)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetMyChatsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetMyChatsHandler called")

	userID := r.URL.Query().Get("userID")
	if userID == "" {
		log.Println("Missing userID parameter")
		http.Error(w, "Missing userID", 400)
		return
	}

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	chats, err := waRedis.GetMyChats(rdb, userID)
	if err != nil {
		log.Printf("GetMyChats error: %v", err)
		http.Error(w, "Failed to get my chats", 500)
		return
	}

	log.Printf("Retrieved %d chats for user %s", len(chats), userID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(chats); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetAgentsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetAgentsHandler called")

	cfg := config.LoadConfig()
	db, err := database.OpenConn(cfg.DbUrl)
	if err != nil {
		log.Printf("Database connection error: %v", err)
		http.Error(w, "Failed to connect to database", 500)
		return
	}

	agents, err := getAgentsFromDB(db)
	if err != nil {
		log.Printf("GetAgents error: %v", err)
		http.Error(w, "Failed to get agents", 500)
		return
	}

	log.Printf("Retrieved %d agents", len(agents))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(agents); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetAllUsersHandler called")

	cfg := config.LoadConfig()
	db, err := database.OpenConn(cfg.DbUrl)
	if err != nil {
		log.Printf("Database connection error: %v", err)
		http.Error(w, "Failed to connect to database", 500)
		return
	}

	users, err := getAllUsersFromDB(db)
	if err != nil {
		log.Printf("GetAllUsers error: %v", err)
		http.Error(w, "Failed to get users", 500)
		return
	}

	log.Printf("Retrieved %d users", len(users))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if err := json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("JSON encoding error: %v", err)
		http.Error(w, "Failed to encode response", 500)
		return
	}
}

func TransferChatHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("TransferChatHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ChatID  string `json:"chatId"`
		AgentID string `json:"agentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.ChatID == "" || req.AgentID == "" {
		http.Error(w, "Missing chatId or agentId", 400)
		return
	}

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	err = waRedis.TransferChat(rdb, req.ChatID, req.AgentID)
	if err != nil {
		log.Printf("TransferChat error: %v", err)
		http.Error(w, "Failed to transfer chat", 500)
		return
	}

	log.Printf("Successfully transferred chat %s to agent %s", req.ChatID, req.AgentID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Chat transferred successfully"})
}

func StartChatHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("StartChatHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ChatID  string `json:"chatId"`
		AgentID string `json:"agentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.ChatID == "" || req.AgentID == "" {
		http.Error(w, "Missing chatId or agentId", 400)
		return
	}

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	err = waRedis.StartChat(rdb, req.ChatID, req.AgentID)
	if err != nil {
		log.Printf("StartChat error: %v", err)
		http.Error(w, "Failed to start chat", 500)
		return
	}

	log.Printf("Successfully started chat %s with agent %s", req.ChatID, req.AgentID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Chat started successfully"})
}

func TakeChatHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("TakeChatHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ChatID string `json:"chatId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.ChatID == "" {
		http.Error(w, "Missing chatId", 400)
		return
	}

	user, err := getUserFromToken(r)
	if err != nil {
		log.Printf("Error getting user from token: %v", err)
		http.Error(w, "Unauthorized", 401)
		return
	}

	agentID := user["username"].(string)

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	err = waRedis.TakeChat(rdb, req.ChatID, agentID)
	if err != nil {
		log.Printf("TakeChat error: %v", err)
		http.Error(w, "Failed to take chat", 500)
		return
	}

	log.Printf("Successfully took chat %s by agent %s", req.ChatID, agentID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Chat taken successfully"})
}

func SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("SendMessageHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ChatID     string `json:"chatId"`
		Message    string `json:"message"`
		InstanceID string `json:"instanceId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.ChatID == "" || req.Message == "" || req.InstanceID == "" {
		http.Error(w, "Missing chatId, message, or instanceId", 400)
		return
	}

	user, err := getUserFromToken(r)
	if err != nil {
		log.Printf("Error getting user from token: %v", err)
		http.Error(w, "Unauthorized", 401)
		return
	}

	agentID := user["username"].(string)

	cfg := config.LoadConfig()

	ch, err := rabbit.ConnectRabbit(cfg.RabbitMQ)
	if err != nil {
		log.Printf("RabbitMQ connection error: %v", err)
		http.Error(w, "Failed to connect to RabbitMQ", 500)
		return
	}
	defer ch.Close()

	wasolParams := api.WaSolParams{
		Token: cfg.WaSolKey,
		Url:   "https://api.wasolution.com.br",
	}

	message := api.Message{
		InstanceId: req.InstanceID,
		Number:     req.ChatID,
		Body:       req.Message,
		Type:       "text",
	}

	detailedRequest := api.SendMessage(wasolParams, message)

	err = rabbit.SendToQueue(ch, detailedRequest)
	if err != nil {
		log.Printf("SendToQueue error: %v", err)
		http.Error(w, "Failed to queue message", 500)
		return
	}

	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}

	redisMessage := waRedis.Message{
		ID:        fmt.Sprintf("msg_%d", time.Now().Unix()),
		From:      "me",
		To:        req.ChatID,
		Text:      req.Message,
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}

	err = waRedis.AddMessage(rdb, req.ChatID, redisMessage)
	if err != nil {
		log.Printf("AddMessage error: %v", err)
		http.Error(w, "Failed to save message", 500)
		return
	}

	log.Printf("Successfully queued message for chat %s by agent %s", req.ChatID, agentID)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Message sent successfully"})
}

func getUserFromToken(r *http.Request) (map[string]interface{}, error) {
	cookie, err := r.Cookie("token")
	if err != nil {
		return nil, fmt.Errorf("no token cookie found")
	}

	cfg := config.LoadConfig()
	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.JWT), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		username := claims["username"].(string)
		isAdmin := claims["isAdmin"].(bool)

		userID, err := getUserIDFromDB(username)
		if err != nil {
			return nil, fmt.Errorf("failed to get user ID: %w", err)
		}

		return map[string]interface{}{
			"id":       strconv.Itoa(userID),
			"username": username,
			"isAdmin":  isAdmin,
		}, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func getUserIDFromDB(username string) (int, error) {
	cfg := config.LoadConfig()
	db, err := database.OpenConn(cfg.DbUrl)
	if err != nil {
		return 0, err
	}

	var id int
	query := `SELECT id FROM users WHERE user_name = $1`
	err = db.QueryRow(query, username).Scan(&id)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func getAgentsFromDB(db *sql.DB) ([]map[string]interface{}, error) {
	query := `SELECT id, user_name FROM users WHERE is_admin = false`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agents []map[string]interface{}
	for rows.Next() {
		var id int
		var username string
		if err := rows.Scan(&id, &username); err != nil {
			continue
		}
		agents = append(agents, map[string]interface{}{
			"id":       strconv.Itoa(id),
			"username": username,
		})
	}
	return agents, nil
}

func getAllUsersFromDB(db *sql.DB) ([]map[string]interface{}, error) {
	query := `SELECT id, user_name FROM users`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var username string
		if err := rows.Scan(&id, &username); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":       strconv.Itoa(id),
			"username": username,
		})
	}
	return users, nil
}

func CloseChatHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("CloseChatHandler called")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req struct {
		ChatID     string `json:"chatId"`
		Tabulation string `json:"tabulation"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, "Invalid request body", 400)
		return
	}

	if req.ChatID == "" || req.Tabulation == "" {
		http.Error(w, "Missing chatId or tabulation", 400)
		return
	}

	cfg := config.LoadConfig()
	rdb, err := waRedis.ConnectRedis(cfg.RedisUrl, cfg.RedisPassword)
	if err != nil {
		log.Printf("Redis connection error: %v", err)
		http.Error(w, "Failed to connect to Redis", 500)
		return
	}
	defer rdb.Close()

	err = waRedis.CloseChat(rdb, req.ChatID, req.Tabulation)
	if err != nil {
		log.Printf("CloseChat error: %v", err)
		http.Error(w, "Failed to close chat", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"success": "Chat closed successfully"})
}

func GetTabulationsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetTabulationsHandler called")

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	cfg := config.LoadConfig()
	db, err := database.OpenConn(cfg.DbUrl)
	if err != nil {
		log.Printf("Database connection error: %v", err)
		http.Error(w, "Failed to connect to database", 500)
		return
	}
	defer db.Close()

	tabulations, err := database.GetTabulation(db)
	if err != nil {
		log.Printf("GetTabulation error: %v", err)
		http.Error(w, "Failed to get tabulations", 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tabulations)
}
