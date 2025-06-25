package routes

import (
	"WaSolCRM/config"
	"WaSolCRM/internal/auth"
	"WaSolCRM/internal/database"
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
	})

	r.Use(auth.Middleware())

	err := r.Run(":8080")
	if err != nil {
		return
	}
}
