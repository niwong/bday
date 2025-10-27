// Database helper functions for normalized Supabase schema

import { supabase } from './supabase';

/**
 * Load teams from the database and transform to app format
 * @param {string} status - 'approved' or 'draft'
 * @returns {Promise<Array>} Array of teams in app format
 */
export const loadTeamsFromDatabase = async (status) => {
  try {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        *,
        captain:players!teams_captain_player_id_fkey(
          id,
          name,
          profile_pic_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true });
    
    if (teamsError) {
      console.error(`❌ Error loading ${status} teams:`, teamsError);
      return [];
    }
    
    if (!teams || teams.length === 0) {
      return [];
    }
    
    // Load team players for all teams
    const { data: teamPlayers, error: teamPlayersError } = await supabase
      .from('team_players')
      .select(`
        *,
        player:players!team_players_player_id_fkey(
          id,
          name,
          profile_pic_url
        )
      `)
      .in('team_id', teams.map(t => t.id))
      .order('game_slot', { ascending: true });
    
    if (teamPlayersError) {
      console.error('❌ Error loading team players:', teamPlayersError);
      return [];
    }
    
    // Transform to app's expected format
    return teams.map((team, index) => {
      // Get players for this team, sorted by game_slot
      const playersForTeam = teamPlayers
        .filter(tp => tp.team_id === team.id)
        .sort((a, b) => a.game_slot - b.game_slot);
      
      // Build players array (always 5 slots)
      const players = [];
      for (let i = 0; i < 5; i++) {
        const teamPlayer = playersForTeam.find(tp => tp.game_slot === i);
        if (teamPlayer && teamPlayer.player) {
          const playerObj = {
            id: teamPlayer.player.id,
            teamPlayerId: teamPlayer.id, // The team_players.id for direct database updates
            isEmpty: false,
            name: teamPlayer.player.name,
            score: teamPlayer.score,
            profilePicUrl: teamPlayer.player.profile_pic_url,
            ranking: i + 1,
            gameSlot: teamPlayer.game_slot
          };
          
          if (!teamPlayer.id) {
            console.error('⚠️ Warning: teamPlayer missing id:', teamPlayer);
          }
          
          players.push(playerObj);
        } else {
          // Empty slot
          players.push({
            id: `empty-${team.id}-${i}`,
            teamPlayerId: null,
            isEmpty: true,
            name: '',
            score: 0,
            profilePicUrl: null,
            ranking: i + 1,
            gameSlot: i
          });
        }
      }
      
      // Determine captainId
      let captainId = null;
      if (team.captain_player_id) {
        const captainPlayer = players.find(p => p.id === team.captain_player_id && !p.isEmpty);
        if (captainPlayer) {
          captainId = captainPlayer.id;
        }
      }
      
      return {
        id: team.id, // Add id property for consistency
        teamId: status === 'approved' ? `team-${index + 1}` : team.id,
        title: team.title,
        captainId,
        players,
        status: team.status,
        submitterName: team.submitter_name,
        dbId: team.id // Keep reference to database ID
      };
    });
  } catch (err) {
    console.error(`❌ Error loading ${status} teams:`, err);
    return [];
  }
};

/**
 * Get or create a player by name
 * @param {string} name - Player name
 * @param {string} profilePicUrl - Profile picture URL
 * @returns {Promise<string>} Player UUID
 */
export const getOrCreatePlayer = async (name, profilePicUrl) => {
  try {
    // Try to find existing player
    const { data: existing, error: findError } = await supabase
      .from('players')
      .select('id')
      .eq('name', name)
      .single();
    
    if (!findError && existing) {
      return existing.id;
    }
    
    // Create new player
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({ name, profile_pic_url: profilePicUrl })
      .select('id')
      .single();
    
    if (createError) {
      console.error('❌ Error creating player:', createError);
      throw createError;
    }
    
    return newPlayer.id;
  } catch (err) {
    console.error('❌ Error in getOrCreatePlayer:', err);
    throw err;
  }
};

