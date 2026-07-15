PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS spare_part_compatibility (
	id TEXT PRIMARY KEY,
	spare_part_id TEXT NOT NULL,
	brand TEXT NOT NULL,
	model TEXT NOT NULL,
	year_start INTEGER,
	year_end INTEGER,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (spare_part_id, brand, model, year_start, year_end),
	FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_spare_part_compatibility_part
	ON spare_part_compatibility(spare_part_id, brand, model);
