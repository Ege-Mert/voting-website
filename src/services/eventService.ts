import { supabase } from '../lib/supabase';
import { Event, Category, Item, ItemResult, CategoryWithResults } from '../types';
import short from 'short-uuid';

export const getEventById = async (eventId: string) => {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (error) {
    throw error;
  }
  
  return event as Event;
};

export const getEventWithCategories = async (eventId: string) => {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (eventError) {
    throw eventError;
  }
  
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('event_id', eventId);
  
  if (categoriesError) {
    throw categoriesError;
  }
  
  // For each category, get its items
  const categoriesWithItems = await Promise.all(
    categories.map(async (category) => {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', category.id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      return {
        ...category,
        items: items || []
      };
    })
  );
  
  return {
    ...event,
    categories: categoriesWithItems
  } as Event & { categories: (Category & { items: Item[] })[] };
};

export const getAdminEvents = async (adminId: string) => {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return events as Event[];
};

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'created_at'>,
  categories: Omit<Category, 'id' | 'event_id' | 'created_at'>[],
  items: { categoryIndex: number, name: string, thumbnail_url?: string }[]
) => {
  // Generate a short ID for the event
  const translator = short();
  const eventId = translator.new();
  
  // Start a transaction
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([
      {
        id: eventId,
        ...eventData
      }
    ])
    .select()
    .single();
  
  if (eventError) {
    throw eventError;
  }
  
  // Create categories
  const categoriesWithEventId = categories.map(category => ({
    ...category,
    event_id: eventId
  }));
  
  const { data: createdCategories, error: categoriesError } = await supabase
    .from('categories')
    .insert(categoriesWithEventId)
    .select();
  
  if (categoriesError) {
    throw categoriesError;
  }
  
  // Create items for each category
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      category_id: createdCategories[item.categoryIndex].id,
      name: item.name,
      thumbnail_url: item.thumbnail_url || null
    }));
    
    const { error: itemsError } = await supabase
      .from('items')
      .insert(itemsToInsert);
    
    if (itemsError) {
      throw itemsError;
    }
  }
  
  return event as Event;
};

export const updateEvent = async (
  eventId: string,
  eventData: Partial<Omit<Event, 'id' | 'created_at'>>,
  categoriesToAdd: Omit<Category, 'id' | 'event_id' | 'created_at'>[],
  categoriesToUpdate: (Pick<Category, 'id'> & Partial<Omit<Category, 'id' | 'event_id' | 'created_at'>>)[],
  categoriesToDelete: string[],
  itemsToAdd: { categoryId: string, name: string, thumbnail_url?: string }[],
  itemsToUpdate: (Pick<Item, 'id'> & Partial<Omit<Item, 'id' | 'category_id' | 'created_at'>>)[],
  itemsToDelete: string[]
) => {
  // Update event
  const { error: eventError } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId);
  
  if (eventError) {
    throw eventError;
  }
  
  // Add new categories
  if (categoriesToAdd.length > 0) {
    const categoriesWithEventId = categoriesToAdd.map(category => ({
      ...category,
      event_id: eventId
    }));
    
    const { error: addCategoriesError } = await supabase
      .from('categories')
      .insert(categoriesWithEventId);
    
    if (addCategoriesError) {
      throw addCategoriesError;
    }
  }
  
  // Update existing categories
  for (const category of categoriesToUpdate) {
    const { id, ...updateData } = category;
    
    const { error: updateCategoryError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id);
    
    if (updateCategoryError) {
      throw updateCategoryError;
    }
  }
  
  // Delete categories
  if (categoriesToDelete.length > 0) {
    const { error: deleteCategoriesError } = await supabase
      .from('categories')
      .delete()
      .in('id', categoriesToDelete);
    
    if (deleteCategoriesError) {
      throw deleteCategoriesError;
    }
  }
  
  // Add new items
  if (itemsToAdd.length > 0) {
    const { error: addItemsError } = await supabase
      .from('items')
      .insert(itemsToAdd);
    
    if (addItemsError) {
      throw addItemsError;
    }
  }
  
  // Update existing items
  for (const item of itemsToUpdate) {
    const { id, ...updateData } = item;
    
    const { error: updateItemError } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id);
    
    if (updateItemError) {
      throw updateItemError;
    }
  }
  
  // Delete items
  if (itemsToDelete.length > 0) {
    const { error: deleteItemsError } = await supabase
      .from('items')
      .delete()
      .in('id', itemsToDelete);
    
    if (deleteItemsError) {
      throw deleteItemsError;
    }
  }
  
  return getEventWithCategories(eventId);
};

export const deleteEvent = async (eventId: string) => {
  // Since we have cascading deletes set up in Supabase, we just need to delete the event
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (error) {
    throw error;
  }
  
  return true;
};

export const updateEventStatus = async (eventId: string, status: 'draft' | 'open' | 'closed') => {
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId);
  
  if (error) {
    throw error;
  }
  
  return getEventById(eventId);
};

export const getEventResults = async (eventId: string): Promise<CategoryWithResults[]> => {
  // First get all categories for this event
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('event_id', eventId);
  
  if (categoriesError) {
    throw categoriesError;
  }
  
  // For each category, get items and calculate results
  const categoriesWithResults = await Promise.all(
    categories.map(async (category) => {
      // Get all items for this category
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', category.id);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // For each item, calculate total points, average score, and vote count
      const itemsWithResults = await Promise.all(
        items.map(async (item) => {
          // Get all votes for this item
          const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select('*')
            .eq('item_id', item.id);
          
          if (votesError) {
            throw votesError;
          }
          
          const voteCount = votes.length;
          const totalPoints = votes.reduce((sum, vote) => sum + vote.stars, 0);
          const avgScore = voteCount > 0 ? totalPoints / voteCount : 0;
          
          return {
            ...item,
            total_points: totalPoints,
            avg_score: avgScore,
            vote_count: voteCount,
            rank: 0 // Will be calculated after sorting
          };
        })
      );
      
      // Sort items by total points and then by average score for ties
      const sortedItems = itemsWithResults.sort((a, b) => {
        if (a.total_points !== b.total_points) {
          return b.total_points - a.total_points;
        }
        return b.avg_score - a.avg_score;
      });
      
      // Assign ranks
      sortedItems.forEach((item, index) => {
        item.rank = index + 1;
      });
      
      return {
        ...category,
        items: sortedItems
      };
    })
  );
  
  return categoriesWithResults as CategoryWithResults[];
};

export const getVoteCounts = async (eventId: string) => {
  // First get all categories and items for this event
  const { data: event, error: eventError } = await getEventWithCategories(eventId);
  
  if (eventError) {
    throw eventError;
  }
  
  // For each item, get the count of votes
  const categoriesWithVoteCounts = await Promise.all(
    event.categories.map(async (category) => {
      const itemsWithVoteCounts = await Promise.all(
        category.items.map(async (item) => {
          // Count distinct users who voted for this item
          const { count, error: countError } = await supabase
            .from('votes')
            .select('user_id', { count: 'exact', head: true })
            .eq('item_id', item.id);
          
          if (countError) {
            throw countError;
          }
          
          return {
            ...item,
            vote_count: count || 0
          };
        })
      );
      
      return {
        ...category,
        items: itemsWithVoteCounts
      };
    })
  );
  
  return {
    ...event,
    categories: categoriesWithVoteCounts
  };
};

export const getUserVotes = async (eventId: string, userId: string) => {
  // Get all categories and items for this event
  const { data: event } = await getEventWithCategories(eventId);
  
  // Get all user votes in one query
  const { data: userVotes, error } = await supabase
    .from('votes')
    .select('item_id, stars')
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
  
  // Create a map of item_id to stars for quick lookup
  const voteMap = userVotes.reduce((map, vote) => {
    map[vote.item_id] = vote.stars;
    return map;
  }, {} as Record<string, number>);
  
  // Add the user's vote to each item
  const categoriesWithUserVotes = event.categories.map(category => {
    const itemsWithUserVotes = category.items.map(item => ({
      ...item,
      user_vote: voteMap[item.id] || 0
    }));
    
    return {
      ...category,
      items: itemsWithUserVotes
    };
  });
  
  return {
    ...event,
    categories: categoriesWithUserVotes
  };
};