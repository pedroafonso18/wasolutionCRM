package auth

import (
	config2 "WaSolCRM/config"
	"WaSolCRM/internal/database"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"time"
)

func Login(c *gin.Context, login *LoginT) User {
	config := config2.LoadConfig()

	conn, err := database.OpenConn(config.DbUrl)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't connect to DB"})
		return User{IsAdmin: false, IsLogged: false}
	}

	isUser, err := VerifyIsUser(conn, *login)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't verify user's credentials"})
		return User{IsAdmin: false, IsLogged: false}
	}

	if !isUser {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access."})
		return User{IsAdmin: false, IsLogged: false}
	}

	isAdmin := false
	validation, err := VerifyIsAdmin(conn, *login)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't verify if user is_admin"})
		return User{IsAdmin: false, IsLogged: true}
	}
	if validation {
		isAdmin = true
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"username": login.Login,
		"isAdmin":  isAdmin,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(config.JWT))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "JWT Access not granted."})
		return User{IsAdmin: false, IsLogged: false}
	}

	c.SetCookie("token", tokenString, 60*60*72, "/", "", false, true)

	if isAdmin {
		c.JSON(http.StatusOK, gin.H{"success": "Successfully logged in as admin!", "redirect": "/"})
		return User{IsAdmin: true, IsLogged: true, JWT: Token(tokenString)}
	} else {
		c.JSON(http.StatusOK, gin.H{"success": "Successfully logged in!", "redirect": "/"})
		return User{IsAdmin: false, IsLogged: true, JWT: Token(tokenString)}
	}
}
