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
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		loadConfig := config.LoadConfig()
		db, err := database.OpenConn(loadConfig.DbUrl)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB connection failed"})
			return
		}
		ok, err := auth.CreateUser(db, auth.LoginT{Login: req.Username, Password: req.Password}, req.IsAdmin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User not created"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": "User registered!"})
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
		c.SetCookie("token", "", -1, "/", "", false, true)
		c.Redirect(http.StatusFound, "/login")
	})

	r.Use(auth.Middleware())

	r.GET("/chats", func(c *gin.Context) {
		c.HTML(http.StatusOK, "chats.html", gin.H{})
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

	r.POST("/api/chats/take", func(c *gin.Context) {
		api.TakeChatHandler(c.Writer, c.Request)
	})

	err := r.Run(":8080")
	if err != nil {
		return
	}
}
