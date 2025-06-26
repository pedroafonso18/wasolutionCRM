package database

import (
	"database/sql"
	"fmt"
	"os"
)

func GetTabulation(db *sql.DB) ([]string, error) {
	rows, err := db.Query("SELECT tabulation_name FROM tabulations")
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}
	defer rows.Close()

	var tabulations []string
	for rows.Next() {
		var tab string
		if err := rows.Scan(&tab); err != nil {
			fmt.Fprintf(os.Stderr, "Row scan error: %v\n", err)
			continue
		}
		tabulations = append(tabulations, tab)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %v", err)
	}

	return tabulations, nil
}
