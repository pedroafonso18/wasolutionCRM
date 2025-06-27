package routes

import (
	"WaSolCRM/config"
	"WaSolCRM/internal/auth"
	"WaSolCRM/internal/database"
	api "WaSolCRM/internal/handlers"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Router() {
	r := gin.Default()

	r.LoadHTMLGlob("web/templates/*")
	r.Static("/style", "./web/style")
	r.Static("/script", "./web/script")
	r.Static("/static", "./static")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Title": "WaSolCRM - Gerenciamento Inteligente do WhatsApp",
		})
	})

	r.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{})
	})

	r.GET("/register", func(c *gin.Context) {
		c.HTML(http.StatusOK, "register.html", gin.H{})
	})

	r.POST("/register", func(c *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
			IsAdmin  bool   `json:"isAdmin"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
			return
		}

		if req.Username == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required"})
			return
		}

		loadConfig := config.LoadConfig()
		if loadConfig.DbUrl == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database URL not configured"})
			return
		}

		db, err := database.OpenConn(loadConfig.DbUrl)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection failed: " + err.Error()})
			return
		}
		defer db.Close()

		ok, err := auth.CreateUser(db, auth.LoginT{Login: req.Username, Password: req.Password}, req.IsAdmin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
			return
		}
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User not created - username might already exist"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": "User registered successfully!"})
	})

	r.POST("/login", func(c *gin.Context) {
		var req auth.LoginT
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
			return
		}
		auth.Login(c, &req)
		c.Redirect(http.StatusSeeOther, "/chats")
	})

	r.GET("/logout", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/api/logout")
	})

	r.Use(auth.Middleware())

	r.GET("/chats", func(c *gin.Context) {
		c.HTML(http.StatusOK, "chats.html", nil)
	})

	r.GET("/instances", func(c *gin.Context) {
		c.HTML(http.StatusOK, "instances.html", nil)
	})

	r.GET("/contacts", func(c *gin.Context) {
		c.HTML(http.StatusOK, "contacts.html", nil)
	})

	r.GET("/api/chats", func(c *gin.Context) {
		api.GetChatsHandler(c.Writer, c.Request)
	})

	r.GET("/api/queue", func(c *gin.Context) {
		api.GetQueuedChatsHandler(c.Writer, c.Request)
	})

	r.GET("/api/chats/:chatID/messages", func(c *gin.Context) {
		chatID := c.Param("chatID")
		c.Request.URL.RawQuery = "chatID=" + chatID
		api.GetMessagesHandler(c.Writer, c.Request)
	})

	r.GET("/api/chats/:chatID/details", func(c *gin.Context) {
		chatID := c.Param("chatID")
		c.Request.URL.RawQuery = "chatID=" + chatID
		api.GetChatDetailsHandler(c.Writer, c.Request)
	})

	r.GET("/api/user-info", func(c *gin.Context) {
		api.GetUserInfoHandler(c.Writer, c.Request)
	})

	r.GET("/api/chats/my/:userID", func(c *gin.Context) {
		userID := c.Param("userID")
		c.Request.URL.RawQuery = "userID=" + userID
		api.GetMyChatsHandler(c.Writer, c.Request)
	})

	r.GET("/api/agents", func(c *gin.Context) {
		api.GetAgentsHandler(c.Writer, c.Request)
	})

	r.GET("/api/users", func(c *gin.Context) {
		api.GetAllUsersHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/transfer", func(c *gin.Context) {
		api.TransferChatHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/start", func(c *gin.Context) {
		api.StartChatHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/close", func(c *gin.Context) {
		api.CloseChatHandler(c.Writer, c.Request)
	})

	r.GET("/api/tabulations", func(c *gin.Context) {
		api.GetTabulationsHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/take", func(c *gin.Context) {
		api.TakeChatHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/send-message", func(c *gin.Context) {
		api.SendMessageHandler(c.Writer, c.Request)
	})

	r.GET("/api/instances", func(c *gin.Context) {
		api.GetInstancesHandler(c.Writer, c.Request)
	})

	r.POST("/api/instances/create", func(c *gin.Context) {
		api.CreateInstanceHandler(c.Writer, c.Request)
	})

	r.POST("/api/instances/connect", func(c *gin.Context) {
		api.ConnectInstanceHandler(c.Writer, c.Request)
	})

	r.POST("/api/instances/delete", func(c *gin.Context) {
		api.DeleteInstanceHandler(c.Writer, c.Request)
	})

	r.POST("/api/instances/logout", func(c *gin.Context) {
		api.LogoutInstanceHandler(c.Writer, c.Request)
	})

	r.POST("/api/instances/webhook", func(c *gin.Context) {
		api.ConfigWebhookHandler(c.Writer, c.Request)
	})

	r.GET("/api/contacts", func(c *gin.Context) {
		api.GetContactsHandler(c.Writer, c.Request)
	})

	r.POST("/api/contacts/add", func(c *gin.Context) {
		api.AddContactHandler(c.Writer, c.Request)
	})

	r.POST("/api/contacts/delete", func(c *gin.Context) {
		api.DeleteContactHandler(c.Writer, c.Request)
	})

	r.POST("/api/chats/start-with-contact", func(c *gin.Context) {
		api.StartChatHandler(c.Writer, c.Request)
	})

	err := r.Run(":8000")
	if err != nil {
		return
	}
}
