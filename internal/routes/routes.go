package routes

import (
	"WaSolCRM/internal/auth"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Router() {
	r := gin.Default()

	r.LoadHTMLGlob("web/templates/*")

	r.Static("/static", "./static")

	r.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{})
	})

	r.Use(auth.Middleware())

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Title": "Hello Gin",
		})
	})

	r.Run(":8080")
}
