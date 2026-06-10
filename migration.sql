package migrations

import (
	"database/sql"
	"log"
)

func AddThaiGatewayEnabled(db *sql.DB) {
	_, err := db.Exec(`ALTER TABLE providers ADD COLUMN thai_gateway_enabled BOOLEAN NOT NULL DEFAULT FALSE;`)
	if err != nil {
		log.Fatalf("failed to add thai_gateway_enabled column: %v", err)
	}
}