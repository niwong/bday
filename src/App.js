import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import PlayerCard from './components/PlayerCard';
import PlayerSelectionModal from './components/PlayerSelectionModal';
import NineManGame from './components/NineManGame/NineManGame';
import mutualsData from './mutuals.json';
import { supabase } from './supabase';
import { loadTeamsFromDatabase, getOrCreatePlayer } from './dbHelpers';
import { 
  updateTeamNameInDb, 
  deleteTeamFromDb, 
  approveDraftTeamInDb, 
  deleteDraftTeamFromDb,
  createDraftTeamInDb,
  updatePlayerScoreInDb,
  addPlayerToTeamInDb,
  removePlayerFromTeamInDb,
  setTeamCaptainInDb,
  swapPlayerSlotsInDb,
  movePlayerToSlotInDb
} from './dbWriteHelpers';

const App = () => {
  // State management for modes
  const [currentMode, setCurrentMode] = useState('olympics'); // 'olympics', 'fantasy', 'car', '9man', 'teammaker'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [showGame1Popup, setShowGame1Popup] = useState(false);
  const [showGame2Popup, setShowGame2Popup] = useState(false);
  const [showGame3Popup, setShowGame3Popup] = useState(false);
  const [showGame4Popup, setShowGame4Popup] = useState(false);
  const [showGame5Popup, setShowGame5Popup] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  
  // Admin mode state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Player management modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  
  // Team highlight state for score changes
  const [teamHighlights, setTeamHighlights] = useState({});
  const [showNineManPopup, setShowNineManPopup] = useState(false);
  
  // Team name editing state
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  // Team data state (replaced useMemo with useState for persistence)
  const [teamData, setTeamData] = useState([]);

  // Team Maker Mode state
  const [teamMakerPlayers, setTeamMakerPlayers] = useState([null, null, null, null, null]); // 5 game slots
  const [teamName, setTeamName] = useState('');
  const [teamCaptain, setTeamCaptain] = useState('');
  const [selectedGameSlot, setSelectedGameSlot] = useState(null);
  const [teamMakerStep, setTeamMakerStep] = useState(1); // 1 or 2
  const [teamMakerCaptainId, setTeamMakerCaptainId] = useState(null);
  
  // Draft teams state
  const [draftTeams, setDraftTeams] = useState([]);

  // Supabase sync functions
  const syncScoresToSupabase = async (scores) => {
    try {
      console.log('💾 Syncing scores to Supabase...', scores);
      
      // First, let's check if the record exists
      const { data: existingData, error: fetchError } = await supabase
        .from('scores')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching existing data:', fetchError);
        
        // If the record doesn't exist, create it first
        if (fetchError.code === 'PGRST116') {
          console.log('📝 Record with id=1 doesn\'t exist, creating it...');
          const { error: insertError } = await supabase
            .from('scores')
            .insert({
              id: 1,
              team_data: scores,
              draft_teams: [],
              last_updated: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('❌ Error creating record:', insertError);
            throw insertError;
          } else {
            console.log('✅ Successfully created record with team data');
            localStorage.setItem('birthday-olympics-scores', JSON.stringify(scores));
            return;
          }
        } else {
          throw fetchError;
        }
      }
      
      const { error } = await supabase
        .from('scores')
        .update({ 
          team_data: scores,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1);
      
      if (error) {
        console.error('❌ Error syncing to Supabase:', error);
        throw error;
      } else {
        console.log('✅ Successfully synced to Supabase');
        // Only save to localStorage after successful Supabase sync
        localStorage.setItem('birthday-olympics-scores', JSON.stringify(scores));
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      throw err;
    }
  };

  const syncDraftTeamsToSupabase = async (drafts) => {
    try {
      console.log('💾 Syncing draft teams to Supabase...', drafts);
      console.log('💾 Draft teams data structure:', JSON.stringify(drafts, null, 2));
      
      // First, let's check if the record exists and what the current structure looks like
      const { data: existingData, error: fetchError } = await supabase
        .from('scores')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching existing data:', fetchError);
        console.error('❌ Fetch error details:', JSON.stringify(fetchError, null, 2));
        
        // If the record doesn't exist, create it first
        if (fetchError.code === 'PGRST116') {
          console.log('📝 Record with id=1 doesn\'t exist, creating it...');
          const { error: insertError } = await supabase
            .from('scores')
            .insert({
              id: 1,
              team_data: [],
              draft_teams: drafts,
              last_updated: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('❌ Error creating record:', insertError);
            throw insertError;
          } else {
            console.log('✅ Successfully created record with draft teams');
            localStorage.setItem('birthday-olympics-draft-teams', JSON.stringify(drafts));
            return;
          }
        } else {
          throw fetchError;
        }
      } else {
        console.log('📊 Existing data structure:', JSON.stringify(existingData, null, 2));
      }
      
      const { error } = await supabase
        .from('scores')
        .update({ 
          draft_teams: drafts,
          last_updated: new Date().toISOString()
        })
        .eq('id', 1);
      
      if (error) {
        console.error('❌ Error syncing draft teams to Supabase:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        
        // If the error is about the column not existing, try updating without draft_teams
        if (error.message && error.message.includes('draft_teams')) {
          console.log('⚠️ draft_teams column may not exist, trying alternative approach...');
          const { error: altError } = await supabase
            .from('scores')
            .update({ 
              last_updated: new Date().toISOString()
            })
            .eq('id', 1);
          
          if (altError) {
            console.error('❌ Alternative update also failed:', altError);
            throw error; // Throw original error
          } else {
            console.log('⚠️ Updated record without draft_teams column - data saved locally only');
            localStorage.setItem('birthday-olympics-draft-teams', JSON.stringify(drafts));
            return;
          }
        }
        
        throw error;
      } else {
        console.log('✅ Successfully synced draft teams to Supabase');
        // Only save to localStorage after successful Supabase sync
        localStorage.setItem('birthday-olympics-draft-teams', JSON.stringify(drafts));
      }
    } catch (err) {
      console.error('❌ Draft teams sync error:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  const initializeSupabaseListener = () => {
    console.log('🔗 Initializing Supabase real-time listener...');
    
    // Check if supabase client is properly initialized
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      return;
    }
    
    try {
      console.log('📡 Creating Supabase channel...');
      const channel = supabase
        .channel('scores-changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'scores',
            filter: 'id=eq.1'
          },
          (payload) => {
            console.log('📡 Received real-time update:', payload);
            
            // Update local state with new data from Supabase
            const newData = payload.new.team_data;
            setTeamData(newData);
            localStorage.setItem('birthday-olympics-scores', JSON.stringify(newData));
            
            // Trigger highlight animations for changed scores
            // Compare old vs new to determine which teams changed
            if (payload.old && payload.old.team_data) {
              const oldData = payload.old.team_data;
              const changedTeams = [];
              
              newData.forEach((newTeam, teamIndex) => {
                const oldTeam = oldData[teamIndex];
                if (oldTeam) {
                  const oldTotal = oldTeam.players.reduce((sum, player) => sum + player.score, 0);
                  const newTotal = newTeam.players.reduce((sum, player) => sum + player.score, 0);
                  
                  if (oldTotal !== newTotal) {
                    changedTeams.push({
                      teamId: newTeam.teamId,
                      highlightColor: newTotal > oldTotal ? 'green' : 'red'
                    });
                  }
                }
              });
              
              // Apply highlights for changed teams
              changedTeams.forEach(({ teamId, highlightColor }) => {
                setTeamHighlights(prev => ({
                  ...prev,
                  [teamId]: highlightColor
                }));
                
                // Remove highlight after animation duration
                setTimeout(() => {
                  setTeamHighlights(prev => {
                    const newHighlights = { ...prev };
                    delete newHighlights[teamId];
                    return newHighlights;
                  });
                }, 1000);
              });
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Supabase subscription status:', status);
          if (err) {
            console.error('❌ Subscription error:', err);
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Failed to subscribe to real-time updates');
            console.error('❌ This usually means:');
            console.error('   1. Realtime not enabled on scores table');
            console.error('   2. Wrong Supabase credentials');
            console.error('   3. Network/firewall issues');
            console.error('   4. Supabase project paused or inactive');
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Subscription timed out');
          } else if (status === 'CLOSED') {
            console.error('❌ Subscription closed');
          }
        });
        
      console.log('📡 Channel created, subscribing...');
    } catch (error) {
      console.error('❌ Error creating real-time listener:', error);
    }
  };


  // Prevent body scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showWelcomePopup || showGame1Popup || showGame2Popup || 
                          showGame3Popup || showGame4Popup || showGame5Popup || showBonusPopup ||
                          showPasswordPrompt || showPlayerModal || showNineManPopup;
    
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showWelcomePopup, showGame1Popup, showGame2Popup, showGame3Popup, 
      showGame4Popup, showGame5Popup, showBonusPopup, showPasswordPrompt, showPlayerModal, showNineManPopup]);


  // Initialize team data on component mount
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Initializing app data...');
      
      // Test Supabase connection first
      let supabaseConnected = false;
      try {
        const { data: testData, error: testError } = await supabase
          .from('teams')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('❌ Supabase connection test failed:', testError);
          supabaseConnected = false;
        } else {
          console.log('✅ Supabase connection test passed', testData);
          supabaseConnected = true;
        }
      } catch (err) {
        console.error('❌ Supabase connection error:', err);
        supabaseConnected = false;
      }
      
      console.log('🔌 Supabase connection status:', supabaseConnected);
      
      // Load approved teams using new normalized schema
      const approvedTeams = await loadTeamsFromDatabase('approved');
      
      if (approvedTeams.length > 0) {
        console.log('📊 Loading approved teams from Supabase:', approvedTeams);
        setTeamData(approvedTeams);
        localStorage.setItem('birthday-olympics-scores', JSON.stringify(approvedTeams));
      } else {
        console.log('📊 No approved teams found in Supabase');
        setTeamData([]);
      }
      
      // Load draft teams
      const draftTeamsData = await loadTeamsFromDatabase('draft');
      if (draftTeamsData.length > 0) {
        console.log('📊 Loading draft teams from Supabase:', draftTeamsData);
        setDraftTeams(draftTeamsData);
        localStorage.setItem('birthday-olympics-draft-teams', JSON.stringify(draftTeamsData));
      } else {
        console.log('📊 No draft teams found in Supabase');
        setDraftTeams([]);
      }
      
      // Set up realtime listener
      initializeSupabaseListener();
      
      // Test realtime setup
      setTimeout(async () => {
        console.log('🧪 Testing realtime setup...');
        
        // Test basic Supabase connection
        try {
          const { data: testData, error: testError } = await supabase
            .from('scores')
            .select('id, last_updated')
            .eq('id', 1)
            .single();
          
          if (testError) {
            console.error('❌ Basic Supabase test failed:', testError);
            return;
          } else {
            console.log('✅ Basic Supabase test passed:', testData);
          }
          
          // Test realtime connection
          console.log('🧪 Testing realtime connection...');
          const testChannel = supabase.channel('test-connection');
          
          testChannel.subscribe((status) => {
            console.log('🧪 Test channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime connection test passed');
              testChannel.unsubscribe();
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Realtime connection test failed');
              testChannel.unsubscribe();
            }
          });
          
        } catch (err) {
          console.error('❌ Realtime test error:', err);
        }
      }, 2000);
    };
    
    initializeData();
    
    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels();
    };
  }, []);

  // Update player score function
  const updatePlayerScore = async (teamId, playerId, newScore) => {
    // Find the current team and player to get old score
    const currentTeam = teamData.find(team => team.teamId === teamId);
    const currentPlayer = currentTeam?.players.find(player => player.id === playerId);
    const oldScore = currentPlayer?.score || 0;
    
    const updatedData = teamData.map(team => {
      if (team.teamId === teamId) {
        return {
          ...team,
          players: team.players.map(player => 
            player.id === playerId 
              ? { ...player, score: Math.round(Math.max(0, Math.min(5, parseFloat(newScore) || 0)) * 100) / 100 }
              : player
          )
        };
      }
      return team;
    });
    
    // Calculate old and new team totals
    const oldTeamTotal = currentTeam?.players.reduce((sum, player) => sum + player.score, 0) || 0;
    const newTeamTotal = updatedData.find(team => team.teamId === teamId)?.players.reduce((sum, player) => sum + player.score, 0) || 0;
    
    // Determine highlight color based on score change
    let highlightColor = null;
    if (newTeamTotal > oldTeamTotal) {
      highlightColor = 'green';
    } else if (newTeamTotal < oldTeamTotal) {
      highlightColor = 'red';
    }
    
    // Apply highlight if there's a change
    if (highlightColor) {
      setTeamHighlights(prev => ({
        ...prev,
        [teamId]: highlightColor
      }));
      
      // Remove highlight after animation duration
      setTimeout(() => {
        setTeamHighlights(prev => {
          const newHighlights = { ...prev };
          delete newHighlights[teamId];
          return newHighlights;
        });
      }, 1000);
    }
    
    // Update local state immediately (instant UI)
    setTeamData(updatedData);
    
    // Update score in database
    if (!currentPlayer) {
      console.error('❌ Player not found in team:', { teamId, playerId });
      return;
    }
    
    if (!currentPlayer.teamPlayerId) {
      console.error('❌ Cannot update score: missing teamPlayerId', { 
        playerName: currentPlayer.name,
        playerId,
        teamId 
      });
      alert('Error: Cannot update player score (missing database reference). Please reload the page.');
      return;
    }
    
    try {
      const roundedScore = Math.round(Math.max(0, Math.min(5, parseFloat(newScore) || 0)) * 100) / 100;
      console.log('📝 Updating player score:', {
        playerName: currentPlayer.name,
        oldScore,
        newScore: roundedScore,
        teamPlayerId: currentPlayer.teamPlayerId
      });
      
      await updatePlayerScoreInDb(currentPlayer.teamPlayerId, roundedScore);
      console.log('✅ Successfully updated player score in database');
    } catch (err) {
      console.error('❌ Failed to update player score in database:', err);
      alert('Failed to save score to database. The change will revert.');
      // Reload from database to restore correct state
      const reloadedTeams = await loadTeamsFromDatabase('approved');
      setTeamData(reloadedTeams);
    }
  };

  // Get available players (not currently on any team)
  const getAvailablePlayers = () => {
    const playersOnTeams = new Set();
    
    // Collect all player names currently on teams
    teamData.forEach(team => {
      team.players.forEach(player => {
        if (!player.isEmpty && player.name) {
          playersOnTeams.add(player.name);
        }
      });
    });
    
    // Filter mutuals data to exclude players already on teams
    return mutualsData.filter(mutual => !playersOnTeams.has(mutual.full_name || mutual.username));
  };

  // Remove player from team (replace with empty slot)
  const removePlayerFromTeam = async (teamId, playerId) => {
    const team = teamData.find(t => t.teamId === teamId);
    const player = team?.players.find(p => p.id === playerId);
    
    if (!player || !player.teamPlayerId) {
      console.error('Cannot remove player: missing teamPlayerId');
      return;
    }
    
    const updatedData = teamData.map(team => {
      if (team.teamId === teamId) {
        return {
          ...team,
          players: team.players.map(p => 
            p.id === playerId 
              ? { 
                  id: `empty-${Date.now()}-${Math.random()}`, 
                  teamPlayerId: null,
                  isEmpty: true, 
                  name: '', 
                  score: 0,
                  profilePicUrl: null,
                  gameSlot: p.gameSlot
                }
              : p
          )
        };
      }
      return team;
    });
    
    setTeamData(updatedData);
    try {
      // Delete from database
      await removePlayerFromTeamInDb(player.teamPlayerId);
    } catch (err) {
      console.error('❌ Failed to remove player from database:', err);
      alert('Failed to remove player. Please try again.');
    }
  };

  // Add player to team (fill empty slot)
  const addPlayerToTeam = async (teamId, slotIndex, playerData) => {
    const team = teamData.find(t => t.teamId === teamId);
    
    if (!team || !team.dbId) {
      alert('Failed to add player: missing team database ID');
      setShowPlayerModal(false);
      setSelectedTeamForAdd(null);
      setSelectedSlotIndex(null);
      return;
    }
    
    try {
      // Get or create player
      const playerName = playerData.full_name || playerData.username || playerData.name;
      const playerUuid = await getOrCreatePlayer(playerName, playerData.profile_pic_url);
      
      // Add player to team in database
      const teamPlayerId = await addPlayerToTeamInDb(team.dbId, playerUuid, slotIndex);
      
      // Update local state
      const updatedData = teamData.map(tuka => {
        if (tuka.teamId === teamId) {
          const newPlayers = [...tuka.players];
          newPlayers[slotIndex] = {
            id: playerUuid,
            teamPlayerId,
            isEmpty: false,
            name: playerName,
            score: 0,
            profilePicUrl: playerData.profile_pic_url,
            ranking: slotIndex + 1,
            gameSlot: slotIndex
          };
          
          return {
            ...tuka,
            players: newPlayers
          };
        }
        return tuka;
      });
      
      setTeamData(updatedData);
    } catch (err) {
      console.error('❌ Failed to add player to database:', err);
      alert('Failed to add player. Please try again.');
    }
    
    // Close modal and reset state
    setShowPlayerModal(false);
    setSelectedTeamForAdd(null);
    setSelectedSlotIndex(null);
  };

  // Handle player removal
  const handlePlayerRemove = (teamId, playerId) => {
    removePlayerFromTeam(teamId, playerId);
  };

  // Handle player add (open modal)
  const handlePlayerAdd = (teamId, playerId) => {
    // Find the actual index of the empty slot in the original team data
    const team = teamData.find(t => t.teamId === teamId);
    const actualIndex = team.players.findIndex(p => p.id === playerId);
    
    setSelectedTeamForAdd(teamId);
    setSelectedSlotIndex(actualIndex);
    setShowPlayerModal(true);
  };

  // Handle player selection from modal
  const handlePlayerSelect = (playerData) => {
    addPlayerToTeam(selectedTeamForAdd, selectedSlotIndex, playerData);
  };

  // Close player modal
  const handlePlayerModalClose = () => {
    setShowPlayerModal(false);
    setSelectedTeamForAdd(null);
    setSelectedSlotIndex(null);
  };

  // Team Maker Mode handlers
  const handleTeamMakerPlayerSelect = (gameSlotIndex) => {
    setSelectedGameSlot(gameSlotIndex);
    setShowPlayerModal(true);
  };

  const handleTeamMakerPlayerAdd = (playerData) => {
    const newPlayers = [...teamMakerPlayers];
    newPlayers[selectedGameSlot] = playerData;
    setTeamMakerPlayers(newPlayers);
    setShowPlayerModal(false);
    setSelectedGameSlot(null);
  };

  const handleTeamMakerPlayerRemove = (gameSlotIndex) => {
    const newPlayers = [...teamMakerPlayers];
    newPlayers[gameSlotIndex] = null;
    setTeamMakerPlayers(newPlayers);
    
    // If the removed player was the captain, clear captain selection
    if (teamMakerCaptainId === gameSlotIndex) {
      setTeamMakerCaptainId(null);
    }
  };

  // Handle captain selection in team maker mode
  const handleTeamMakerCaptainSelect = (gameSlotIndex) => {
    setTeamMakerCaptainId(gameSlotIndex);
  };

  const generateTeamMakerMessage = () => {
    const gameNames = ["Game 1 🏐", "Game 2 🍝", "Game 3 ♟️", "Game 4 ☕", "Game 5 🏅"];
    let message = `Team Name: ${teamName}\nCaptain: ${teamCaptain}\n\n`;
    
    teamMakerPlayers.forEach((player, index) => {
      if (player) {
        const playerName = player.full_name || player.username || player.name || 'Unknown Player';
        message += `${gameNames[index]}: ${playerName}\n`;
      }
    });
    
    return message;
  };

  const handleTeamMakerNext = () => {
    if (!teamName.trim() || !teamCaptain.trim()) {
      alert('Please enter both team name and captain name');
      return;
    }
    setTeamMakerStep(2);
  };

  const handleTeamMakerBack = () => {
    setTeamMakerStep(1);
  };

  const handleTeamMakerSubmit = async () => {
    // Validate that we have a captain selected
    if (teamMakerCaptainId === null) {
      alert('Please select a captain for your team');
      return;
    }

    try {
      // Prepare team data for database
      const teamData = {
        title: `${teamName} (${teamCaptain})`,
        submitterName: teamCaptain,
        captainIndex: teamMakerCaptainId,
        players: teamMakerPlayers.map((player, index) => {
          if (!player) {
            return { name: '', isEmpty: true };
          }
          return {
            name: player.full_name || player.username || player.name || 'Unknown Player',
            profilePicUrl: player.profile_pic_url,
            isEmpty: false
          };
        })
      };

      // Create draft team in database
      await createDraftTeamInDb(teamData);
      
      // Reload draft teams from database
      const draftTeamsData = await loadTeamsFromDatabase('draft');
      setDraftTeams(draftTeamsData);

      // Show success message
      alert('Team submitted successfully! Text nick so he can review the team.');
      
      // Reset form and navigate back to Olympics mode
      setTeamMakerPlayers([null, null, null, null, null]);
      setTeamName('');
      setTeamCaptain('');
      setTeamMakerCaptainId(null);
      setTeamMakerStep(1);
      setCurrentMode('olympics');
    } catch (err) {
      console.error('❌ Failed to submit draft team:', err);
      alert('Failed to submit team. Please try again.');
    }
  };

  // Set team captain
  const setCaptain = async (teamId, playerId) => {
    const team = teamData.find(t => t.teamId === teamId);
    
    if (!team) {
      console.error('❌ Team not found:', teamId);
      alert('Error: Team not found. Please reload the page.');
      return;
    }
    
    if (!team.dbId) {
      console.error('❌ Cannot set captain: missing team database ID', { teamId, teamTitle: team.title });
      alert('Error: Cannot set captain (missing database reference). Please reload the page.');
      return;
    }
    
    const player = team.players.find(p => p.id === playerId && !p.isEmpty);
    if (!player) {
      console.error('❌ Player not found or is empty slot:', { teamId, playerId });
      return;
    }
    
    console.log('👑 Setting team captain:', {
      teamTitle: team.title,
      captainName: player.name,
      teamDbId: team.dbId,
      playerId
    });
    
    const updatedData = teamData.map(t => {
      if (t.teamId === teamId) {
        return {
          ...t,
          captainId: playerId
        };
      }
      return t;
    });
    
    setTeamData(updatedData);
    
    try {
      // Update captain in database
      await setTeamCaptainInDb(team.dbId, playerId);
      console.log('✅ Successfully set captain in database');
    } catch (err) {
      console.error('❌ Failed to set captain in database:', err);
      alert('Failed to set captain. The change will revert.');
      // Reload from database to restore correct state
      const reloadedTeams = await loadTeamsFromDatabase('approved');
      setTeamData(reloadedTeams);
    }
  };

  // Update team name
  const updateTeamName = async (teamId, newName) => {
    const updatedData = teamData.map(team => {
      if (team.teamId === teamId) {
        return {
          ...team,
          title: newName.trim() || team.title // Fallback to current title if empty
        };
      }
      return team;
    });
    
    setTeamData(updatedData);
    try {
      // Find the team and get its database ID
      const team = updatedData.find(t => t.teamId === teamId);
      if (team && team.dbId) {
        await updateTeamNameInDb(team.dbId, newName);
      } else {
        console.error('❌ Team not found or missing dbId');
      }
    } catch (err) {
      console.error('❌ Failed to update team name in Supabase:', err);
      alert('Failed to update team name.Data will reload.');
      // Reload from database
      const reloadedTeams = await loadTeamsFromDatabase('approved');
      setTeamData(reloadedTeams);
    }
  };

  // Handle team name double-click to start editing
  const handleTeamNameDoubleClick = (teamId, currentName) => {
    if (isAdminMode) {
      setEditingTeamId(teamId);
      setEditingTeamName(currentName);
    }
  };

  // Handle team name save
  const handleTeamNameSave = async () => {
    if (editingTeamId && editingTeamName.trim()) {
      await updateTeamName(editingTeamId, editingTeamName);
    }
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  // Handle team name cancel
  const handleTeamNameCancel = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  // Delete entire team
  const deleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this entire team? This action cannot be undone.')) {
      // Find the team to get its database ID
      const team = teamData.find(t => t.teamId === teamId);
      
      if (!team || !team.dbId) {
        alert('Failed to delete team: missing database ID');
        return;
      }
      
      try {
        // Delete from database first
        await deleteTeamFromDb(team.dbId);
        
        // Update local state
        const updatedData = teamData.filter(t => t.teamId !== teamId);
        setTeamData(updatedData);
      } catch (err) {
        console.error('❌ Failed to delete team from database:', err);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  // Handle navigating to team maker mode
  const handleNavigateToTeamMaker = () => {
    setCurrentMode('teammaker');
  };

  // Handle approving a draft team
  const handleApproveDraftTeam = async (draftId) => {
    const draftTeam = draftTeams.find(draft => draft.id === draftId || draft.teamId === draftId);
    
    if (!draftTeam) {
      alert('Failed to approve team: team not found');
      return;
    }
    
    if (!draftTeam.dbId) {
      alert('Failed to approve team: missing database ID');
      return;
    }

    try {
      // Update team status in database from 'draft' to 'approved'
      await approveDraftTeamInDb(draftTeam.dbId);
      
      // Reload teams from database to get fresh data
      const [approvedTeams, draftTeamsData] = await Promise.all([
        loadTeamsFromDatabase('approved'),
        loadTeamsFromDatabase('draft')
      ]);
      
      setTeamData(approvedTeams);
      setDraftTeams(draftTeamsData);
      
      alert('Team approved successfully!');
    } catch (err) {
      console.error('❌ Failed to approve draft team:', err);
      alert('Failed to approve team. Please try again.');
    }
  };

  // Handle denying a draft team
  const handleDenyDraftTeam = async (draftId) => {
    const draftTeam = draftTeams.find(draft => draft.id === draftId);
    if (!draftTeam || !draftTeam.dbId) {
      alert('Failed to deny team: missing database ID');
      return;
    }

    try {
      // Delete from database
      await deleteDraftTeamFromDb(draftTeam.dbId);
      
      // Update local state
      const updatedDraftTeams = draftTeams.filter(draft => draft.id !== draftId);
      setDraftTeams(updatedDraftTeams);
      
      alert('Draft team denied and removed.');
    } catch (err) {
      console.error('❌ Failed to deny draft team:', err);
      alert('Failed to deny team. Please try again.');
    }
  };

  // Handle team name key press
  const handleTeamNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTeamNameSave();
    } else if (e.key === 'Escape') {
      handleTeamNameCancel();
    }
  };

  // Handle drag and drop reordering
  const handlePlayerDrop = async (dragData, dropTarget) => {
    const { playerId: dragPlayerId, teamId: dragTeamId, playerIndex: dragIndex, playerData } = dragData;
    const { teamId: dropTeamId, playerIndex: dropIndex } = dropTarget;

    // Only allow reordering within the same team
    if (dragTeamId !== dropTeamId) {
      return;
    }

    // Don't allow dropping on the same position
    if (dragIndex === dropIndex) {
      return;
    }

    // Get the original players BEFORE swapping (important for database operations)
    const currentTeam = teamData.find(t => t.teamId === dragTeamId);
    if (!currentTeam) {
      console.error('❌ Team not found:', dragTeamId);
      return;
    }
    
    const draggedPlayer = currentTeam.players[dragIndex];
    const targetPlayer = currentTeam.players[dropIndex];
    
    // Verify the dragged player has a teamPlayerId
    if (!draggedPlayer || !draggedPlayer.teamPlayerId) {
      console.error('❌ Cannot reorder: dragged player missing teamPlayerId', {
        draggedPlayer: draggedPlayer ? { name: draggedPlayer.name, teamPlayerId: draggedPlayer.teamPlayerId } : null
      });
      alert('Cannot reorder players. Missing database references.');
      return;
    }
    
    // Check if target is an empty slot
    const isTargetEmpty = !targetPlayer || targetPlayer.isEmpty || !targetPlayer.teamPlayerId;
    const targetSlot = targetPlayer ? targetPlayer.gameSlot : dropIndex;

    // Perform the UI swap
    const updatedData = teamData.map(team => {
      if (team.teamId === dragTeamId) {
        const newPlayers = [...team.players];
        
        // Swap the players
        newPlayers[dragIndex] = targetPlayer;
        newPlayers[dropIndex] = draggedPlayer;
        
        return {
          ...team,
          players: newPlayers
        };
      }
      return team;
    });

    setTeamData(updatedData);
    
    // Update database with the appropriate function
    try {
      if (isTargetEmpty) {
        // Moving to an empty slot - just move the player
        console.log('🔄 Moving player to empty slot:', {
          dragged: draggedPlayer.name,
          targetSlot: targetSlot,
          draggedTeamPlayerId: draggedPlayer.teamPlayerId
        });
        await swapPlayerSlotsInDb(draggedPlayer.teamPlayerId, null, targetSlot);
      } else {
        // Swapping two players
        console.log('🔄 Swapping player slots:', {
          dragged: draggedPlayer.name,
          target: targetPlayer.name,
          draggedTeamPlayerId: draggedPlayer.teamPlayerId,
          targetTeamPlayerId: targetPlayer.teamPlayerId
        });
        await swapPlayerSlotsInDb(draggedPlayer.teamPlayerId, targetPlayer.teamPlayerId);
      }
      console.log('✅ Successfully updated player slots in database');
    } catch (err) {
      console.error('❌ Failed to reorder players in database:', err);
      alert('Failed to reorder players. Changes will revert.');
      // Reload from database
      const reloadedTeams = await loadTeamsFromDatabase('approved');
      setTeamData(reloadedTeams);
    }
  };

  // Row titles for the left side
  const rowTitles = ["Game 1 🏐", "Game 2 🍝", "Game 3 ♟️", "Game 4 ☕", "Game 5 🏅", "Shhh 🤫"];

  // Sort teams based on total scores and maintain player order within teams
  const sortedTeams = useMemo(() => {
    if (!teamData.length) return [];
    
    // Calculate total scores for each team and maintain player order
    const teamsWithTotals = teamData.map(team => {
      return {
        ...team,
        players: [...team.players], // Maintain original order for drag-and-drop
        totalScore: team.players.reduce((sum, player) => sum + player.score, 0)
      };
    });
    
    // Check if all teams have 0 points
    const allZeroPoints = teamsWithTotals.every(team => team.totalScore === 0);
    
    if (allZeroPoints) {
      // When all teams have 0 points, maintain original order (Team 1-5)
      return teamsWithTotals;
    } else {
      // Sort by total score (highest first)
      return [...teamsWithTotals].sort((a, b) => b.totalScore - a.totalScore);
    }
  }, [teamData]);

  
  // Menu toggle function
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Mode change function
  const changeMode = (mode) => {
    setCurrentMode(mode);
    setIsMenuOpen(false);
    if (mode === '9man') {
      setShowNineManPopup(true);
    }
  };

  // Admin authentication functions
  const handleAdminModeClick = () => {
    setShowPasswordPrompt(true);
    setIsMenuOpen(false);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = process.env.REACT_APP_ADMIN_PASSWORD;
    if (passwordInput === correctPassword) {
      setIsAdminMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password');
      setPasswordInput('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPasswordInput('');
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
  };

  return (
    <div className="app">
      {/* Admin Banner */}
      {isAdminMode && (
        <div className="admin-banner">
          <span>Admin Mode Active</span>
          <button onClick={exitAdminMode} className="exit-admin-btn">Exit Admin</button>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="password-prompt-overlay">
          <div className="password-prompt">
            <h3>Enter Admin Password</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Password"
              autoFocus
            />
            <div className="password-buttons">
              <button onClick={handlePasswordSubmit} className="password-submit">Submit</button>
              <button onClick={handlePasswordCancel} className="password-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="welcome-popup-overlay">
          <div className="welcome-popup">
            <div className="welcome-content">
              <div className="welcome-car-image">
                <img src="/images/car-bigger.png" alt="Driving car" className="car-image" />
              </div>
              <div className="welcome-text">
                <p className="welcome-greeting">howzit u fekes?</p>
                <p className="welcome-description">
                  Welcome to my asynchronous birthday olympics! Think of this as a nice outlet to release some of ur hyper-competitive energies as y'all work together to mimic bits of my life and favorite things in SF.
                </p>
                <p className="welcome-description">
                  There are five games -- one for each teammate. Choose ur teammates wisely. Click on each game title for its instructions.
                </p>
                <p className="welcome-description">
                  Each event will be scored out of 5 fantasy points. The winning team will get to eat dinner with me, and I'm buying drinks.
                </p>
                <button 
                  className="welcome-close-button"
                  onClick={() => setShowWelcomePopup(false)}
                >
                  Get started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 1 Popup */}
      {showGame1Popup && (
        <div className="game1-popup-overlay">
          <div className="game1-popup">
            <div className="game1-content">
              <div className="game1-volleyball-image">
                <img src="/images/volleyball.png" alt="Volleyball player" className="volleyball-image" />
              </div>
              <div className="game1-text">
                <p className="game1-title">Game 1: Performative Diving in Volleyball</p>
                <p className="game1-description">
                  Game 1 is all about the performative dive. Dolphin diving is a critical skill for any defensive player.
                  But as I've gotten older, I've realized it's less about actually digging the ball but rather looking good in the process.
                </p>
                <p className="game1-description">
                  So let's see your best "performative" volleyball dolphin dive. We will record the player trying to dive as if they were playing
                  volleyball, and we will then score them on the vibe and performative-ness of their move.
                </p>
                <p className="game1-description">
                  Showwww me what u gotttt!
                </p>
                <button 
                  className="game1-close-button"
                  onClick={() => setShowGame1Popup(false)}
                >
                  acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 2 Popup */}
      {showGame2Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game2-image">
                <img src="/images/red-pot.png" alt="Red pot" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 2: Pasta</p>
                <p className="game-description">
                  I've been making the same pasta since college. I've cooked it for many of you.
                  Here's the recipe... try to imitate it, and whoever gets closest wins. ;)
                </p>
                <div className="game-description">
                  Nick's Pasta:
                  <ul>
                    <li>celery, carrot, onion</li>
                    <li>garlic, red pepper flakes, fennel seed</li>
                    <li>2lbs ground beef (protein)</li>
                    <li>wine</li>
                    <li>tomato sauce</li>
                    <li>de cecco pasta</li>
                  </ul>
                </div>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame2Popup(false)}
                >
                  acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 3 Popup */}
      {showGame3Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game3-image">
                <img src="/images/chess.png" alt="Game 3 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 3: Chess</p>
                <p className="game-description">
                  Once upon a time ago, I used to play competitive chess. Let's see if u can beat me in a
                  round of speed chess.
                </p>
                <p className="game-description">
                  5pts awarded if u can beat me. Other points awarded for effort, awarded subjectively. 
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame3Popup(false)}
                >
                  your move!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 4 Popup */}
      {showGame4Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game4-image">
                <img src="/images/coffee.png" alt="Game 4 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 4: Coffee</p>
                <p className="game-description">
                  Every morning, I dose out my 15g of beans into my fancy little coffee robot.
                  I take the deeeeepest rip of that fresh joe, and I'm ready to tear it up.
                </p>
                <p className="game-description">
                  i think i have a problem...
                </p>
                <p className="game-description">
                  let's see who can make the best cup of joe. (unfair cause i live with a coffee mechanic and fanatic [ethan])
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame4Popup(false)}
                >
                  wired
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game 5 Popup */}
      {showGame5Popup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game5-image">
                <img src="/images/nick_as_baby.png" alt="Game 5 placeholder" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Game 5: Nick Trivia!</p>
                <p className="game-description">
                  Self explanatory. Totally not a test to see who knows me best...
                </p>
                <p className="game-description">
                  I only care about the winners... and the losers.
                </p>
                <p className="game-description">
                  it'd be awk if u came in last... might just wanna go home aft.
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowGame5Popup(false)}
                >
                  whatever, kid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Game Popup */}
      {showBonusPopup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="bonus-image">
                <img src="/images/sharepoint.png" alt="Bonus Game" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">Bonus Game: Configure a file server</p>
                <p className="game-description">
                  Complete this challenge if you dare. If you can complete this, text me and Ethan Lee and we'll get u a job.
                </p>
                <p className="game-description">
                  Configure an on-premise instance of SharePoint 2016 Server and expose its contents over the internet.
                </p>
                <p className="game-description">
                  Nick should be provided crednetials to be able to access file contents and perform basic REST operations over the API.
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowBonusPopup(false)}
                >
                  see more details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9man Mode Popup */}
      {showNineManPopup && (
        <div className="game-popup-overlay">
          <div className="game-popup">
            <div className="game-content">
              <div className="game-image">
                <img src="/images/player.png" alt="9man Mode" className="game-image-img" />
              </div>
              <div className="game-text">
                <p className="game-title">9man Mode</p>
                <p className="game-description">
                  This mode is intended for web browser only.
                </p>
                <p className="game-description">
                  Use WASD to move and spacebar to jump. Keep the ball up!
                </p>
                <button 
                  className="game-close-button"
                  onClick={() => setShowNineManPopup(false)}
                >
                  start game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="app-header">
        <h1>{currentMode === 'fantasy' ? 'Fantasy Draft' : "Nicholas' Bday Olympics"}</h1>
        <p style={{fontSize: '1rem', color: '#666', marginTop: '12px', fontStyle:'italic'}}>I just really wanted to build something...</p>
        {/* Intro Button */}
        <button 
          className="intro-button"
          onClick={() => setShowWelcomePopup(true)}
        >
          Intro
        </button>

        {/* Hamburger Menu */}
        <div className="hamburger-menu">
          <button className="hamburger-button" onClick={toggleMenu}>
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          
          {isMenuOpen && (
            <div className="menu-dropdown">
              <button 
                className={`menu-item ${currentMode === 'olympics' ? 'active' : ''}`}
                onClick={() => changeMode('olympics')}
              >
                Olympics Mode
              </button>
              <button 
                className={`menu-item ${currentMode === 'fantasy' ? 'active' : ''}`}
                onClick={() => changeMode('fantasy')}
              >
                Fantasy Draft
              </button>
              <button 
                className={`menu-item ${currentMode === '9man' ? 'active' : ''}`}
                onClick={() => changeMode('9man')}
              >
                9man Mode
              </button>
              <button 
                className={`menu-item ${currentMode === 'teammaker' ? 'active' : ''}`}
                onClick={() => changeMode('teammaker')}
              >
                Team Maker Mode
              </button>
              <button 
                className={`menu-item ${isAdminMode ? 'active' : ''}`}
                onClick={handleAdminModeClick}
              >
                Admin Mode
              </button>
            </div>
          )}
        </div>

        {/* Car Animation - show when car mode is active */}
        {currentMode === 'car' && (
          <div className="car-container">
            <img src="/images/car.png" alt="Driving car" className="animated-car" />
          </div>
        )}
      </header>
      
      <main className="dashboard">
        {currentMode === 'fantasy' ? (
          <div className="coming-soon-container">
            <div className="coming-soon-content">
              <div className="coming-soon-emoji">🏐</div>
              <h2 className="coming-soon-title">Coming Soon</h2>
              <p className="coming-soon-subtitle">Fantasy Draft mode is under development</p>
            </div>
          </div>
        ) : currentMode === '9man' ? (
          <NineManGame onExit={() => changeMode('olympics')} />
        ) : currentMode === 'teammaker' ? (
          <div className="team-maker-wizard">
            <div className="wizard-content">
              <div className="wizard-car-image">
                <img src="/images/car.png" alt="Car" className="car-image" />
              </div>
              <div className="wizard-text">
                {teamMakerStep === 1 ? (
                  <>
                    <p className="wizard-greeting">Im back! to help you build your team</p>
                    <p className="wizard-description">be careful with who you select here... you're gonna have to work together with these guys.</p>
                    
                    <div className="wizard-form">
                      <div className="wizard-input-group">
                        <label className="wizard-label">help me by giving me a team name:</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="wizard-input"
                          placeholder=""
                        />
                      </div>
                      
                      <div className="wizard-input-group">
                        <label className="wizard-label">and who are you?</label>
                        <input
                          type="text"
                          value={teamCaptain}
                          onChange={(e) => setTeamCaptain(e.target.value)}
                          className="wizard-input"
                          placeholder=""
                        />
                      </div>
                      
                      <button 
                        className="wizard-button"
                        onClick={handleTeamMakerNext}
                        disabled={!teamName.trim() || !teamCaptain.trim()}
                      >
                        next
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="wizard-greeting">Now put your thinking cap on. I need a...</p>
                    <p className="wizard-description">volleyballer, a chef, a brain, a fiend, and someone that just knows nick.</p>
                    <p className="wizard-description">use the person picker to select people. nick worked hard to make this picker.</p>
                    <p className="wizard-description">he ripped all of these profiles from instagram using AI</p>
                    
                    <div className="wizard-player-slots">
                      {rowTitles.slice(0, 5).map((gameTitle, index) => {
                        const player = teamMakerPlayers[index];
                        const gameEmoji = gameTitle.split(' ').pop(); // Get the emoji from the title
                        return (
                          <div key={index} className="wizard-player-slot">
                            {player ? (
                              <div className="wizard-selected-player">
                                <div className="wizard-player-avatar">
                                  {player.profile_pic_url ? (
                                    <img 
                                      src={player.profile_pic_url} 
                                      alt={player.full_name || player.username || player.name || 'Player'}
                                      className="wizard-player-image"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="wizard-player-initials" style={{ display: player.profile_pic_url ? 'none' : 'flex' }}>
                                    {(player.full_name || player.username || player.name || 'Unknown').split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                                  </div>
                                </div>
                                  <div className="wizard-player-name">{player.full_name || player.username || player.name || 'Unknown Player'}</div>
                                  
                                  {/* Captain crown button */}
                                  <button 
                                    className={`wizard-crown-button ${teamMakerCaptainId === index ? 'selected' : ''}`}
                                    onClick={() => handleTeamMakerCaptainSelect(index)}
                                    title="Make captain"
                                  >
                                    👑
                                  </button>
                                  
                                  <button 
                                    className="wizard-remove-btn"
                                    onClick={() => handleTeamMakerPlayerRemove(index)}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className="wizard-select-btn"
                                  onClick={() => handleTeamMakerPlayerSelect(index)}
                                >
                                  <span className="wizard-game-emoji">{gameEmoji}</span>
                                  <span className="wizard-select-text">select player</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="wizard-actions">
                        <button 
                          className="wizard-button wizard-back-btn"
                          onClick={handleTeamMakerBack}
                        >
                          back
                        </button>
                        <button 
                          className="wizard-button wizard-submit-btn"
                          onClick={handleTeamMakerSubmit}
                          disabled={teamMakerPlayers.every(p => p === null)}
                        >
                          send to nick
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
        ) : (
          <div className="dashboard-container">
            {/* Games header for mobile */}
            <div className="games-header-mobile">Games:</div>
            
            {/* Row titles on the left */}
            <div className="row-titles">
              {rowTitles.map((title, index) => {
                const handleClick = () => {
                  switch(index) {
                    case 0: setShowGame1Popup(true); break;
                    case 1: setShowGame2Popup(true); break;
                    case 2: setShowGame3Popup(true); break;
                    case 3: setShowGame4Popup(true); break;
                    case 4: setShowGame5Popup(true); break;
                    case 5: setShowBonusPopup(true); break;
                    default: break;
                  }
                };
                
                return (
                  <div 
                    key={index} 
                    className="row-title"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="row-title-desktop">{title.split(' ').slice(0, -1).join(' ')} {title.split(' ').slice(-1)}</span>
                    <span className="row-title-mobile">{index + 1}. {title.split(' ').slice(-1)}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Teams container */}
            <div className="teams-container">
              {sortedTeams.map((team) => {
                return (
                  <div key={team.teamId} className={`team-column ${teamHighlights[team.teamId] ? `team-highlight-${teamHighlights[team.teamId]}` : ''}`}>
                    {editingTeamId === team.teamId ? (
                      <input
                        type="text"
                        className="team-title-input"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        onBlur={handleTeamNameSave}
                        onKeyDown={handleTeamNameKeyPress}
                        autoFocus
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          border: '2px solid #007bff',
                          borderRadius: '4px',
                          padding: '8px',
                          width: '100%',
                          backgroundColor: '#f8f9fa'
                        }}
                      />
                    ) : (
                      <h2 
                        className="team-title"
                        onDoubleClick={() => handleTeamNameDoubleClick(team.teamId, team.title)}
                        style={{ cursor: isAdminMode ? 'pointer' : 'default' }}
                        title={isAdminMode ? 'Double-click to edit team name' : ''}
                      >
                        {team.title}
                      </h2>
                    )}
                    <div className="players-container">
                      {team.players.map((player, index) => (
                        <PlayerCard
                          key={player.id}
                          name={player.name}
                          ranking={player.ranking}
                          score={player.score}
                          profilePicUrl={player.profilePicUrl}
                          isAdminMode={isAdminMode}
                          isEmpty={player.isEmpty}
                          isCaptain={player.id === team.captainId}
                          playerId={player.id}
                          teamId={team.teamId}
                          playerIndex={index}
                          onScoreUpdate={(newScore) => updatePlayerScore(team.teamId, player.id, newScore)}
                          onRemove={() => handlePlayerRemove(team.teamId, player.id)}
                          onAdd={() => handlePlayerAdd(team.teamId, player.id)}
                          onSetCaptain={() => setCaptain(team.teamId, player.id)}
                          onDragStart={() => {}}
                          onDragOver={() => {}}
                          onDrop={handlePlayerDrop}
                        />
                      ))}
                    </div>
                    <div className="team-total">
                      <span className="total-label">Total:</span>
                      <span className="total-score">{team.totalScore.toFixed(2)}/25.00</span>
                    </div>
                    
                    {/* Delete team button - only visible in admin mode */}
                    {isAdminMode && (
                      <button 
                        className="delete-team-button"
                        onClick={() => deleteTeam(team.teamId)}
                        title="Delete entire team"
                      >
                        🗑️ Delete Team
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* Draft teams - only visible in admin mode */}
              {isAdminMode && draftTeams.map((draftTeam) => (
                <div key={draftTeam.id} className="team-column draft">
                  <div className="draft-badge">DRAFT</div>
                  <h2 className="team-title">{draftTeam.title}</h2>
                  <div className="players-container">
                    {draftTeam.players.map((player, index) => (
                      <PlayerCard
                        key={player.id}
                        name={player.name}
                        ranking={player.ranking}
                        score={player.score}
                        profilePicUrl={player.profilePicUrl}
                        isAdminMode={false}
                        isEmpty={player.isEmpty}
                        isCaptain={index === draftTeam.captainId}
                        playerId={player.id}
                        teamId={draftTeam.id}
                        playerIndex={index}
                        onScoreUpdate={() => {}}
                        onRemove={() => {}}
                        onAdd={() => {}}
                        onSetCaptain={() => {}}
                        onDragStart={() => {}}
                        onDragOver={() => {}}
                        onDrop={() => {}}
                      />
                    ))}
                  </div>
                  <div className="team-total">
                    <span className="total-label">Total:</span>
                    <span className="total-score">{draftTeam.players.reduce((sum, player) => sum + player.score, 0).toFixed(2)}/25.00</span>
                  </div>
                  <div className="draft-actions">
                    <button 
                      className="approve-button"
                      onClick={() => handleApproveDraftTeam(draftTeam.id)}
                      title="Approve team"
                    >
                      ✓
                    </button>
                    <button 
                      className="deny-button"
                      onClick={() => handleDenyDraftTeam(draftTeam.id)}
                      title="Deny team"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Placeholder team column for creating new teams */}
              <div className="team-column placeholder-team">
                <div className="placeholder-team-content">
                  <button 
                    className="create-team-button"
                    onClick={handleNavigateToTeamMaker}
                    title="Click to go to team maker mode"
                  >
                    +
                  </button>
                  <p className="create-team-text">Click to create a new team</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={showPlayerModal}
        onSelect={currentMode === 'teammaker' ? handleTeamMakerPlayerAdd : handlePlayerSelect}
        onClose={handlePlayerModalClose}
        availablePlayers={currentMode === 'teammaker' ? mutualsData : getAvailablePlayers()}
      />

      {/* Floating Car Mode Button */}
      <button 
        className={`floating-car-button ${currentMode === 'car' ? 'active' : ''}`}
        onClick={() => setCurrentMode(currentMode === 'car' ? 'olympics' : 'car')}
        title="Car Mode"
      >
        <img src="/images/car.png" alt="Car Mode" className="car-icon" />
      </button>
    </div>
  );
};

export default App;
