-- Supabase Database Restructure Migration Script
-- This script migrates from JSON-based structure to normalized relational schema

-- Step 1: Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    profile_pic_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name) -- Ensure player names are globally unique
);

-- Step 2: Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'approved')),
    captain_player_id UUID REFERENCES players(id),
    submitter_name TEXT, -- For useEffect teams
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create team_players junction table
CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    game_slot INTEGER NOT NULL CHECK (game_slot >= 0 AND game_slot <= 5), -- 0-5 for the 6 games
    score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, game_slot), -- One player per game slot per team
    UNIQUE(team_id, player_id) -- One player can only be on a team once
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Step 5: Enable Row Level Security (RLS) for public access
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for public read access
CREATE POLICY "Allow public read access on players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on team_players" ON team_players
    FOR SELECT USING (true);

-- Step 7: Create RLS policies for public insert/update (for now, allow all operations)
-- You may want to restrict this further based on your needs
CREATE POLICY "Allow public insert on players" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on teams" ON teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on team_players" ON team_players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on players" ON players
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update on teams" ON teams
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update on team_players" ON team_players
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on teams" ON teams
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete on team_players" ON team_players
    FOR DELETE USING (true);

-- Step 8: Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_players;

-- Step 9: Migrate existing data from scores table (if it exists)
-- This handles the data migration from the old JSON structure
DO $$
DECLARE
    team_record RECORD;
    player_record RECORD;
    player_data JSONB;
    team_json JSONB;
    draft_teams JSONB;
    existing_player_id UUID;
    team_uuid UUID;
    game_slot_idx INTEGER;
    player_name TEXT;
    profile_url TEXT;
    player_score NUMERIC;
    captain_player_id_local UUID;
BEGIN
    -- Check if the old scores table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scores') THEN
        
        -- Process approved teams (team_data)
        FOR team_record IN 
            SELECT id, team_data 
            FROM scores 
            WHERE team_data IS NOT NULL
        LOOP
            FOR team_json IN SELECT * FROM jsonb_array_elements(team_record.team_data)
            LOOP
                -- Create the team
                INSERT INTO teams (title, status, created_at)
                VALUES (
                    COALESCE(team_json->>'title', 'Unnamed Team'),
                    'approved',
                    NOW()
                )
                RETURNING id INTO team_uuid;
                
                -- Set captain if it exists
                IF team_json->>'captainId' IS NOT NULL THEN
                    captain_player_id_local := NULL;
                END IF;
                
                -- Insert players
                game_slot_idx := 0;
                FOR player_data IN SELECT * FROM jsonb_array_elements(team_json->'players')
                LOOP
                    player_name := player_data->>'name';
                    
                    -- Skip empty slots
                    IF player_data->>'isEmpty' = 'true' OR player_name IS NULL OR player_name = '' THEN
                        game_slot_idx := game_slot_idx + 1;
                        CONTINUE;
                    END IF;
                    
                    -- Get or create player
                    SELECT id INTO existing_player_id FROM players WHERE name = player_name;
                    
                    IF existing_player_id IS NULL THEN
                        profile_url := player_data->>'profilePicUrl';
                        INSERT INTO players (name, profile_pic_url, created_at)
                        VALUES (
                            player_name,
                            profile_url,
                            NOW()
                        )
                        RETURNING id INTO existing_player_id;
                    END IF;
                    
                    -- Link player to team
                    player_score := COALESCE((player_data->>'score')::NUMERIC, 0);
                    
                    INSERT INTO team_players (team_id, player_id, game_slot, score)
                    VALUES (team_uuid, existing_player_id, game_slot_idx, player_score)
                    ON CONFLICT (team_id, game_slot) DO NOTHING;
                    
                    game_slot_idx := game_slot_idx + 1;
                END LOOP;
                
                -- Update captain after all players are inserted
                IF team_json->>'captainId' IS NOT NULL THEN
                    -- Find the captain player_id by matching the old captainId
                    FOR player_data IN SELECT * FROM jsonb_array_elements(team_json->'players')
                    LOOP
                        IF player_data->>'id' = team_json->>'captainId' THEN
                            player_name := player_data->>'name';
                            SELECT id INTO captain_player_id_local FROM players WHERE name = player_name;
                            EXIT;
                        END IF;
                    END LOOP;
                    
                    UPDATE teams 
                    SET captain_player_id = captain_player_id_local 
                    WHERE id = team_uuid;
                END IF;
            END LOOP;
        END LOOP;
        
        -- Process draft teams
        FOR team_record IN 
            SELECT id, draft_teams 
            FROM scores 
            WHERE draft_teams IS NOT NULL
        LOOP
            FOR team_json IN SELECT * FROM jsonb_array_elements(team_record.draft_teams)
            LOOP
                -- Create the draft team
                INSERT INTO teams (title, status, submitter_name, created_at)
                VALUES (
                    COALESCE(team_json->>'title', 'Draft Team'),
                    'draft',
                    team_json->>'submitterName',
                    NOW()
                )
                RETURNING id INTO team_uuid;
                
                -- Insert players
                game_slot_idx := 0;
                FOR player_data IN SELECT * FROM jsonb_array_elements(team_json->'players')
                LOOP
                    player_name := player_data->>'name';
                    
                    -- Skip empty slots
                    IF player_data->>'isEmpty' = 'true' OR player_name IS NULL OR player_name = '' THEN
                        game_slot_idx := game_slot_idx + 1;
                        CONTINUE;
                    END IF;
                    
                    -- Get or create player
                    SELECT id INTO existing_player_id FROM players WHERE name = player_name;
                    
                    IF existing_player_id IS NULL THEN
                        profile_url := player_data->>'profilePicUrl';
                        INSERT INTO players (name, profile_pic_url, created_at)
                        VALUES (
                            player_name,
                            profile_url,
                            NOW()
                        )
                        RETURNING id INTO existing_player_id;
                    END IF;
                    
                    -- Link player to team
                    player_score := COALESCE((player_data->>'score')::NUMERIC, 0);
                    
                    INSERT INTO team_players (team_id, player_id, game_slot, score)
                    VALUES (team_uuid, existing_player_id, game_slot_idx, player_score)
                    ON CONFLICT (team_id, game_slot) DO NOTHING;
                    
                    game_slot_idx := game_slot_idx + 1;
                END LOOP;
                
                -- Set captain for draft teams
                IF team_json->>'captainId' IS NOT NULL THEN
                    captain_player_id_local := NULL;
                    FOR player_data IN SELECT * FROM jsonb_array_elements(team_json->'players')
                    LOOP
                        game_slot_idx := (player_data->>'ranking')::INTEGER - 1;
                        IF game_slot_idx = (team_json->>'captainId')::INTEGER THEN
                            player_name := player_data->>'name';
                            SELECT id INTO captain_player_id_local FROM players WHERE name = player_name;
                            EXIT;
                        END IF;
                    END LOOP;
                    
                    UPDATE teams 
                    SET captain_player_id = captain_player_id_local 
                    WHERE id = team_uuid;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Migration completed successfully. Old scores table preserved for rollback.';
    ELSE
        RAISE NOTICE 'No scores table found. Skipping data migration.';
    END IF;
END $$;

-- Step 10: Create a function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to auto-update updated_at on teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries (uncomment to run manually)
-- SELECT COUNT(*) as total_players FROM players;
-- SELECT COUNT(*) as total_teams FROM teams;
-- SELECT COUNT(*) as total_team_players FROM team_players;
-- SELECT t.title, t.status, COUNT(tp.id) as player_count FROM teams t LEFT JOIN team_players tp ON t.id = tp.team_id GROUP BY t.id, t.title, t.status;


