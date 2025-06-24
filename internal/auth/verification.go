package auth

import (
	"database/sql"
	"errors"
	"golang.org/x/crypto/bcrypt"
)

func VerifyIsUser(db *sql.DB, t LoginT) (bool, error) {
	query := `SELECT password FROM users WHERE user_name = $1`
	var hashedPassword string
	err := db.QueryRow(query, t.Login).Scan(&hashedPassword)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(t.Password)) != nil {
		return false, nil
	}
	return true, nil
}

func VerifyIsAdmin(db *sql.DB, t LoginT) (bool, error) {
	query := `SELECT password FROM users WHERE user_name = $1 AND is_admin = true`
	var hashedPassword string
	err := db.QueryRow(query, t.Login).Scan(&hashedPassword)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(t.Password)) != nil {
		return false, nil
	}
	return true, nil
}

func CreateUser(db *sql.DB, t LoginT, isAdmin bool) (bool, error) {
	query := `INSERT INTO users (user_name, password, is_admin) VALUES ($1, $2, $3) RETURNING id`
	var id int
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(t.Password), 10)
	if err != nil {
		return false, err
	}
	err = db.QueryRow(query, t.Login, string(hashedPassword), isAdmin).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return true, nil
}
