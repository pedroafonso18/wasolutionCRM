package auth

import (
	config2 "WaSolCRM/config"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenString string
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			cookie, err := c.Cookie("token")
			if err != nil || cookie == "" {
				if strings.HasPrefix(c.Request.URL.Path, "/api/") {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
					c.Abort()
					return
				}
				c.Redirect(http.StatusFound, "/login")
				c.Abort()
				return
			}
			tokenString = cookie
		}
		config := config2.LoadConfig()
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.JWT), nil
		})
		if err != nil || !token.Valid {
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
				c.Abort()
				return
			}
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}
		c.Next()
	}
}
