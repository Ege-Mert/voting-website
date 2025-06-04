import { supabase } from '../lib/supabase';
import { Vote } from '../types';

export const submitVote = async (userId: string, itemId: string, stars: number) => {
  // Check if user already voted for this item
  const { data: existingVote, error: checkError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();
  
  if (checkError) {
    throw checkError;
  }
  
  if (existingVote) {
    // Update existing vote
    const { data, error } = await supabase
      .from('votes')
      .update({
        stars,
        timestamp: new Date().toISOString()
      })
      .eq('id', existingVote.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as Vote;
  } else {
    // Create new vote
    const { data, error } = await supabase
      .from('votes')
      .insert([
        {
          user_id: userId,
          item_id: itemId,
          stars,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as Vote;
  }
};

export const submitMultipleVotes = async (userId: string, votes: { itemId: string, stars: number }[]) => {
  // Perform the votes one by one
  const results = [];
  
  for (const vote of votes) {
    const result = await submitVote(userId, vote.itemId, vote.stars);
    results.push(result);
  }
  
  return results;
};

export const getUserVotesForItem = async (userId: string, itemId: string) => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId);
  
  if (error) {
    throw error;
  }
  
  return data as Vote[];
};

export const getUserVotesForEvent = async (userId: string, eventId: string) => {
  // First get all items for this event
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id')
    .eq('event_id', eventId);
  
  if (categoriesError) {
    throw categoriesError;
  }
  
  // Get all item IDs for these categories
  const categoryIds = categories.map(cat => cat.id);
  
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id')
    .in('category_id', categoryIds);
  
  if (itemsError) {
    throw itemsError;
  }
  
  // Get all votes by this user for these items
  const itemIds = items.map(item => item.id);
  
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .in('item_id', itemIds);
  
  if (votesError) {
    throw votesError;
  }
  
  return votes as Vote[];
};