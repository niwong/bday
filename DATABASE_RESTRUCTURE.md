# Database Restructure Summary

## ✅ Completed

### 1. Migration Script
- Created `migration-script.sql` with normalized schema
- Fixed timestamp type issues
- Script successfully ran in Supabase

### 2. Database Helper Functions
- Created `src/dbHelpers.js` with:
  - `loadTeamsFromDatabase()` - Load teams from normalized tables
  - `getOrCreatePlayer()` - Get or create players
  - `updatePlayerScoreInDb()` - Update player scores

### 3. Data Loading
- Updated `src/App.js` initialization to use new schema
- Loads approved and draft teams from normalized tables
- Transforms database format to app's expected format

## ⚠️ Still Needs Implementation

### 1. Sync Functions (Lines 54-201 in App.js)
The following functions still use old JSON-based approach and need to be updated:

- `syncScoresToSupabase()` - Currently updates JSON blob in scores table
- `syncDraftTeamsToSupabase()` - Currently updates JSON blob in scores table

**These should be replaced with operations that:**
- Insert/update individual rows in `teams` and `team_players` tables
- Handle player creation and updates
- Maintain referential integrity

### 2. Realtime Listener (Lines 203-297 in App.js)
- `initializeSupabaseListener()` - Currently listens to `scores` table changes
- Needs to subscribe to `teams` and `team_players` tables instead
- May need to aggregate changes from multiple tables

### 3. CRUD Operations
These functions need database updates:

- `updatePlayerScore()` (line 459) - Update score in `team_players` table
- `removePlayerFromTeam()` co. 535) - Remove from `team_players` table
- `addPlayerToTeam()` (line 565) - Insert into `team_players` table
- `setCaptain()` (line 734) - Update `captain_player_id` in `teams` table
- `updateTeamName()` (line 754) - Update `title` in `teams` table
- `deleteTeam()` (line 797) - Delete from `teams` table (cascade will handle team_players)
- `handleApproveDraftTeam()` (line 818) - Update team status from 'draft' to 'approved'
- `handleDenyDraftTeam()` (line 854) - Delete team
- `handleTeamMakerSubmit()` (line 683) - Insert new draft team

## Database Schema

### Tables Created

**players**
- id (uuid, PK)
- name (text, unique)
- profile_pic_url (text)
- created_at (timestamptz)

**teams**
- id (uuid, PK)
- title (text)
- status (text: 'draft' or 'approved')
- captain_player_id (uuid, FK to players)
- submitter_name (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

**team_players**
- id (uuid, PK)
- team_id (uuid, FK to teams, cascade delete)
- player_id (uuid, FK to players)
- game_slot (integer, 0-5)
- score (numeric)
- created_at (timestamptz)
- Unique on (team_id, game_slot)
- Unique on (team_id, player_id)

## Next Steps

1. **Update sync functions** to write to normalized tables
2. **Update realtime listener** to subscribe to new tables
3. **Update CRUD operations** to use normalized schema
4. **Test** all operations work correctly
5. **Optional**: Remove old `scores` table after verifying everything works

## Notes

- Old `scores` table is preserved for rollback safety
- Data transformation happens in `loadTeamsFromDatabase()` helper
- Player uniqueness is enforced globally by database constraints
- All timestamps are now properly typed as TIMESTAMPTZ

