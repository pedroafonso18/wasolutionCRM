package database

import (
	"database/sql"
	_ "github.com/lib/pq"
)

func OpenConn(dbUrl string) (*sql.DB, error) {

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		panic(err)
	}

	err = db.Ping()

	return db, err
}
