package auth

import (
	"database/sql"
	"errors"
)

func VerifyIsUser(db *sql.DB, t LoginT) (bool, error) {
	query := `SELECT 1 FROM users WHERE user_name = $1 AND password = $2`
	var exists int
	err := db.QueryRow(query, t.Login, t.Password).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return true, nil
}

func VerifyIsAdmin(db *sql.DB, t LoginT) (bool, error) {
	query := `SELECT 1 FROM users WHERE user_name = $1 AND password = $2 AND is_admin = true`
	var exists int
	err := db.QueryRow(query, t.Login, t.Password).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return true, nil
}
