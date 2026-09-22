<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DbSyncSequences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:sync-sequences';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize PostgreSQL sequences with the maximum ID in each table';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if ($driver !== 'pgsql') {
            $this->info("Current database driver is {$driver}. Sequence synchronization is only necessary for PostgreSQL.");

            return Command::SUCCESS;
        }

        $this->info('Synchronizing PostgreSQL sequences...');

        $tables = DB::select("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        ");

        foreach ($tables as $table) {
            $tableName = $table->table_name;

            // Find the primary key column
            $primaryKeyInfo = DB::select("
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = '{$tableName}'::regclass
                AND i.indisprimary
            ");

            if (empty($primaryKeyInfo)) {
                continue;
            }

            $primaryKey = $primaryKeyInfo[0]->attname;

            // Check if the column has a sequence
            $sequenceInfo = DB::select("
                SELECT pg_get_serial_sequence('{$tableName}', '{$primaryKey}') as sequence_name
            ");

            $sequenceName = $sequenceInfo[0]->sequence_name;

            if ($sequenceName) {
                DB::statement("
                    SELECT setval('{$sequenceName}', coalesce(max({$primaryKey}), 0) + 1, false) 
                    FROM {$tableName}
                ");
                $this->line("Synced sequence for table: <info>{$tableName}</info> (Column: {$primaryKey})");
            }
        }

        $this->info('PostgreSQL sequences synchronized successfully.');

        return Command::SUCCESS;
    }
}
