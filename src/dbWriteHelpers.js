// Database write helper functions for normalized Supabase schema

import { supabase } from './supabase';
import { getOrCreatePlayer } from './dbHelpers';

/**
 * Update team name in database
 * @param {string} dbId - Team database UUID
 * @param {string} newName - New team name
 */
export const updateTeamNameInDb = async (dbId, newName) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ title: newName.trim() })
      .eq('id', dbId);
    
    if (error) {
      console.error('❌ Error updating team name:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in updateTeamNameInDb:', err);
    throw err;
  }
};

/**
 * Delete a team from database
 * @param {string} dbId - Team database UUID
 */
export const deleteTeamFromDb = async (dbId) => {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', dbId);
    
    if (error) {
      console.error('❌ Error deleting team:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in deleteTeamFromDb:', err);
    throw err;
  }
};

/**
 * Approve a draft team (change status from 'draft' to 'approved')
 * @param {string} dbId - Team database UUID
 */
export const approveDraftTeamInDb = async (dbId) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ status: 'approved' })
      .eq('id', dbId);
    
    if (error) {
      console.error('❌ Error approving draft team:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in approveDraftTeamInDb:', err);
    throw err;
  }
};

/**
 * Delete a draft team from database
 * @param {string} dbId - Team database UUID
 */
export const deleteDraftTeamFromDb = async (dbId) => {
  try {
    // Same as deleteTeamFromDb, but keeping separate for clarity
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', dbId);
    
    if (error) {
      console.error('❌ Error deleting draft team:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in deleteDraftTeamFromDb:', err);
    throw err;
  }
};

/**
 * Create a new draft team in database
 * @param {object} teamData - Team data object
 * @param {string} teamData.title - Team title
 * @param {string} teamData.submitterName - Name of person submitting
 * @param {array} teamData.players - Array of player objects
 * @param {number} teamData.captainIndex - Index of captain
 */
export const createDraftTeamInDb = async (teamData) => {
  try {
    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        title: teamData.title,
        status: 'draft',
        submitter_name: teamData.submitterName
      })
      .select('id')
      .single();
    
    if (teamError) {
      console.error('❌ Error creating draft team:', teamError);
      throw teamError;
    }
    
    const teamId = team.id;
    let captainId = null;
    
    // Add players
    for (let i = 0; i < teamData.players.length; i++) {
      const playerData = teamData.players[i];
      
      if (!playerData || !playerData.name) {
        continue; // Skip empty slots
      }
      
      // Get or create player
      const playerUuid = await getOrCreatePlayer(
        playerData.name,
        playerData.profilePicUrl || playerData.profile_pic_url
      );
      
      // Link player to team
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          player_id: playerUuid,
          game_slot: i,
          score: 0
        });
      
      if (teamPlayerError) {
        console.error('❌ Error adding player to team:', teamPlayerError);
        // Continue with other players
      }
      
      // Set captain if this is the captain
      if (i === teamData.captainIndex) {
        captainId = playerUuid;
      }
    }
    
    // Update team with captain
    if (captainId) {
      const { error: captainError } = await supabase
        .from('teams')
        .update({ captain_player_id: captainId })
        .eq('id', teamId);
      
      if (captainError) {
        console.error('❌ Error setting captain:', captainError);
      }
    }
    
    return teamId;
  } catch (err) {
    console.error('❌ Error in createDraftTeamInDb:', err);
    throw err;
  }
};

/**
 * Update player score in database
 * @param {string} teamPlayerId - Team player record ID
 * @param {number} score - New score
 */
export const updatePlayerScoreInDb = async (teamPlayerId, score) => {
  try {
    const { error } = await supabase
      .from('team_players')
      .update({ score })
      .eq('id', teamPlayerId);
    
    if (error) {
      console.error('❌ Error updating player score:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in updatePlayerScoreInDb:', err);
    throw err;
  }
};

/**
 * Add player to team in database
 * @param {string} teamId - Team database ID
 * @param {string} playerId - Player database ID
 * @param {number} gameSlot - Game slot index (0-5)
 */
export const addPlayerToTeamInDb = async (teamId, playerId, gameSlot) => {
  try {
    const { data, error } = await supabase
      .from('team_players')
      .insert({
        team_id: teamId,
        player_id: playerId,
        game_slot: gameSlot,
        score: 0
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Error adding player to team:', error);
      throw error;
    }
    
    return data.id;
  } catch (err) {
    console.error('❌ Error in addPlayerToTeamInDb:', err);
    throw err;
  }
};

/**
 * Remove player from team in database
 * @param {string} teamPlayerId - Team player record ID
 */
export const removePlayerFromTeamInDb = async (teamPlayerId) => {
  try {
    const { error } = await supabase
      .from('team_players')
      .delete()
      .eq('id', teamPlayerId);
    
    if (error) {
      console.error('❌ Error removing player from team:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in removePlayerFromTeamInDb:', err);
    throw err;
  }
};

/**
 * Set team captain in database
 * @param {string} teamId - Team database ID
 * @param {string} playerId - Captain player database ID (null to unset)
 */
export const setTeamCaptainInDb = async (teamId, playerId) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ captain_player_id: playerId })
      .eq('id', teamId);
    
    if (error) {
      console.error('❌ Error setting team captain:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error in setTeamCaptainInDb:', err);
    throw err;
  }
};

/**
 * Move a player to a specific slot (for handling empty slot targets)
 * @param {string} teamPlayerId - Team player record ID
 * @param {number} targetSlot - Target game slot (0-5)
 */
export const movePlayerToSlotInDb = async (teamPlayerId, targetSlot) => {
  try {
    const { error } = await supabase
      .from('team_players')
      .update({ game_slot: targetSlot })
      .eq('id', teamPlayerId);
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error('❌ Error in movePlayerToSlotInDb:', err);
    throw err;
  }
};

/**
 * Swap two players' game slots (for reordering)
 * Uses a three-step swap to avoid unique constraint violations
 * @param {string} teamPlayerId1 - First team player record ID
 * @param {string} teamPlayerId2 - Second team player record ID (null if target is empty slot)
 * @param {number} targetSlot - Target slot number (only needed if teamPlayerId2 is null)
 */
export const swapPlayerSlotsInDb = async (teamPlayerId1, teamPlayerId2, targetSlot = null) => {
  try {
    // Get current slots and team_id for player1
    const { data: player1, error: fetchError1 } = await supabase
      .from('team_players')
      .select('game_slot, team_id')
      .eq('id', teamPlayerId1)
      .single();
    
    if (fetchError1) throw fetchError1;
    
    // Handle case where target is an empty slot (no teamPlayerId2)
    if (!teamPlayerId2 && targetSlot !== null) {
      // Just move the player to the target slot
      const { error } = await supabase
        .from('team_players')
        .update({ game_slot: targetSlot })
        .eq('id', teamPlayerId1);
      
      if (error) throw error;
      return true;
    }
    
    if (!teamPlayerId2) {
      throw new Error('Either teamPlayerId2 or targetSlot must be provided');
    }
    
    // Get data for player2
    const { data: player2, error: fetchError2 } = await supabase
      .from('team_players')
      .select('game_slot, team_id')
      .eq('id', teamPlayerId2)
      .single();
    
    if (fetchError2) throw fetchError2;
    
    // Ensure both players are from the same team
    if (player1.team_id !== player2.team_id) {
      throw new Error('Cannot swap players from different teams');
    }
    
    // Get all slots used by this team
    const { data: teamSlots, error: slotsError } = await supabase
      .from('team_players')
      .select('game_slot')
      .eq('team_id', player1.team_id);
    
    if (slotsError) throw slotsError;
    
    // Find an unused slot (0-5) for temporary storage
    const usedSlots = new Set(teamSlots.map(s => s.game_slot));
    let tempSlot = null;
    for (let i = 0; i <= 5; i++) {
      if (!usedSlots.has(i)) {
        tempSlot = i;
        break;
      }
    }
    
    // If all slots are used (shouldn't happen in normal operation, but handle it)
    if (tempSlot === null) {
      // All 6 slots are filled, we need a different approach
      console.warn('⚠️ All slots filled, using alternative swap approach');
      
      // Get all team players and their slots
      const { data: allTeamPlayers, error: fetchAllError } = await supabase
        .from('team_players')
        .select('id, game_slot')
        .eq('team_id', player1.team_id);
      
      if (fetchAllError) throw fetchAllError;
      
      // Build new slot assignments
      const updates = allTeamPlayers.map(tp => {
        if (tp.id === teamPlayerId1) {
          return { id: tp.id, newSlot: player2.game_slot };
        } else if (tp.id === teamPlayerId2) {
          return { id: tp.id, newSlot: player1.game_slot };
        }
        return null;
      }).filter(Boolean);
      
      // Execute updates sequentially
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('team_players')
          .update({ game_slot: update.newSlot })
          .eq('id', update.id);
        
        if (updateError) throw updateError;
      }
      
      return true;
    }
    
    // Three-step swap using temporary slot to avoid unique constraint violation
    const slot1 = player1.game_slot;
    const slot2 = player2.game_slot;
    
    // Step 1: Move player1 to temporary slot
    const { error: step1Error } = await supabase
      .from('team_players')
      .update({ game_slot: tempSlot })
      .eq('id', teamPlayerId1);
    
    if (step1Error) throw step1Error;
    
    // Step 2: Move player2 to player1's original slot
    const { error: step2Error } = await supabase
      .from('team_players')
      .update({ game_slot: slot1 })
      .eq('id', teamPlayerId2);
    
    if (step2Error) throw step2Error;
    
    // Step 3: Move player1 to player2's original slot
    const { error: step3Error } = await supabase
      .from('team_players')
      .update({ game_slot: slot2 })
      .eq('id', teamPlayerId1);
    
    if (step3Error) throw step3Error;
    
    return true;
  } catch (err) {
    console.error('❌ Error in swapPlayerSlotsInDb:', err);
    throw err;
  }
};

