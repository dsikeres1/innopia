#!/bin/bash
set -e

# Database URL from environment or default to local
DB_URL=${DATABASE_URL:-"postgresql://postgres@localhost:30501/ai-pmp"}

echo "Importing SQL files to database..."
echo "Database: $DB_URL"
echo ""

# Get list of SQL files
sql_files=($(ls data/sql/v*.sql | sort))
total_files=${#sql_files[@]}
current=0

# Record start time
start_time=$(date +%s)

# Execute SQL files in order (v001, v002, v003, ...)
for sql_file in "${sql_files[@]}"; do
    ((current++))

    # Calculate progress
    progress=$((current * 100 / total_files))

    # Count lines in SQL file to estimate size
    line_count=$(wc -l < "$sql_file")

    echo "[$current/$total_files - ${progress}%] Executing: $sql_file ($line_count lines)"

    # Record file start time
    file_start=$(date +%s)

    # Execute with quiet output (only show errors)
    psql "$DB_URL" -f "$sql_file" > /dev/null

    # Calculate elapsed time for this file
    file_end=$(date +%s)
    file_elapsed=$((file_end - file_start))

    echo "✓ Completed in ${file_elapsed}s"
    echo ""
done

# Calculate total elapsed time
end_time=$(date +%s)
total_elapsed=$((end_time - start_time))

echo "All SQL imports completed successfully!"
echo "Total time: ${total_elapsed}s"