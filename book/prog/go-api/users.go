package main

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type UserLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type User struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func UserRoutes() {
	users := router.Group("/users")
	users.GET("/", NeedsAdmin(), UserList)
	users.POST("/login", Login)
	users.GET("/me", Me)

}

func NeedsAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		u := session.Get("user")
		user, ok := u.(User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "not logged in"})
		}
		if user.Id == 0 {
			c.Next()
		} else {
			c.JSON(http.StatusForbidden, gin.H{"message": "Unauthorized"})
		}
	}
}

func UserList(c *gin.Context) {
	// TODO get user list from database
	users := []User{{
		Id:    0,
		Name:  "admin",
		Email: "admin@dockerbuch.info",
	}, {
		Id:    101,
		Name:  "user",
		Email: "user@dockerbuch.info",
	}}
	c.JSON(http.StatusOK, users)
}

func Login(c *gin.Context) {
	var u UserLogin
	session := sessions.Default(c)
	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "User validation failed!",
		})
		return
	}
	if u.Email == "admin@dockerbuch.info" && u.Password == "geheim" {
		user := User{
			Id: 0, Name: "admin", Email: "admin@dockerbuch.info",
		}
		session.Set("user", user)
		session.Save()
		c.JSON(http.StatusOK, user)
		return
	}
	c.JSON(http.StatusForbidden, gin.H{"message": "Login failed"})
}

func Me(c *gin.Context) {
	session := sessions.Default(c)
	whoami := session.Get("user")
	if whoami == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "not logged in",
		})
		return
	}
	c.JSON(http.StatusOK, whoami)
}
