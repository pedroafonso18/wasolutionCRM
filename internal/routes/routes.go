package routes

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func Router() {
	r := gin.Default()

	r.LoadHTMLGlob("web/templates/*")

	r.Static("/static", "./static")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Title": "Hello Gin",
		})
	})

	r.Run(":8080")
}
