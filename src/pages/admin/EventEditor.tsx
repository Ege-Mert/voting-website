import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Trash, AlertTriangle, Calendar, Save, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  getEventWithCategories, 
  createEvent, 
  updateEvent 
} from '../../services/eventService';
import { Category, Item } from '../../types';

interface CategoryInput {
  id?: string;
  name: string;
  items: {
    id?: string;
    name: string;
    thumbnail_url?: string;
  }[];
}

const EventEditor = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = !!eventId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<CategoryInput[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvent = async () => {
      if (!isEditMode) return;
      
      try {
        setIsLoading(true);
        const event = await getEventWithCategories(eventId);
        
        // Populate form with event data
        setTitle(event.title);
        setDescription(event.description || '');
        setStartDate(event.start_timestamp.split('T')[0]);
        setEndDate(event.end_timestamp.split('T')[0]);
        
        // Map categories and items to our form state
        const categoriesInput = event.categories.map((category: Category & { items: Item[] }) => ({
          id: category.id,
          name: category.name,
          items: category.items.map(item => ({
            id: item.id,
            name: item.name,
            thumbnail_url: item.thumbnail_url || undefined
          }))
        }));
        
        setCategories(categoriesInput);
        } catch (err) {
          console.error('Error fetching event:', err);
          setError(err instanceof Error ? err.message : 'Failed to load event');
        } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId, isEditMode]);
  
  const addCategory = () => {
    setCategories([...categories, { name: '', items: [] }]);
  };
  
  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };
  
  const updateCategoryName = (index: number, name: string) => {
    const newCategories = [...categories];
    newCategories[index].name = name;
    setCategories(newCategories);
  };
  
  const addItem = (categoryIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items.push({ name: '' });
    setCategories(newCategories);
  };
  
  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items.splice(itemIndex, 1);
    setCategories(newCategories);
  };
  
  const updateItemName = (categoryIndex: number, itemIndex: number, name: string) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items[itemIndex].name = name;
    setCategories(newCategories);
  };
  
  const updateItemThumbnail = (categoryIndex: number, itemIndex: number, url: string) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items[itemIndex].thumbnail_url = url;
    setCategories(newCategories);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate form
      if (!title) {
        setError('Event title is required');
        return;
      }
      
      if (!startDate || !endDate) {
        setError('Start and end dates are required');
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        setError('End date must be after start date');
        return;
      }
      
      if (categories.length === 0) {
        setError('At least one category is required');
        return;
      }
      
      for (const category of categories) {
        if (!category.name) {
          setError('All categories must have a name');
          return;
        }
        
        if (category.items.length === 0) {
          setError(`Category "${category.name}" must have at least one item`);
          return;
        }
        
        for (const item of category.items) {
          if (!item.name) {
            setError(`All items in category "${category.name}" must have a name`);
            return;
          }
        }
      }
      
      if (isEditMode) {
        // Update existing event
        const categoriesToAdd: Omit<Category, 'id' | 'event_id' | 'created_at'>[] = [];
        const categoriesToUpdate: (Pick<Category, 'id'> & Partial<Omit<Category, 'id' | 'event_id' | 'created_at'>>)[] = [];
        const categoriesToDelete: string[] = [];
        
        const itemsToAdd: { categoryId: string; name: string; thumbnail_url?: string }[] = [];
        const itemsToUpdate: (Pick<Item, 'id'> & Partial<Omit<Item, 'id' | 'category_id' | 'created_at'>>)[] = [];
        const itemsToDelete: string[] = [];
        
        // Process categories
        for (const category of categories) {
          if (category.id) {
            // Existing category - update
            categoriesToUpdate.push({
              id: category.id,
              name: category.name
            });
            
            // Process items for this category
            for (const item of category.items) {
              if (item.id) {
                // Existing item - update
                itemsToUpdate.push({
                  id: item.id,
                  name: item.name,
                  thumbnail_url: item.thumbnail_url
                });
              } else {
                // New item - add
                itemsToAdd.push({
                  categoryId: category.id,
                  name: item.name,
                  thumbnail_url: item.thumbnail_url
                });
              }
            }
          } else {
            // New category - add
            categoriesToAdd.push({
              name: category.name
            });
          }
        }
        
        // We'd need to also handle deletions here
        // This is simplified and would need more logic to track deleted items
        
        await updateEvent(
          eventId,
          {
            title,
            description: description || null,
            start_timestamp: new Date(startDate).toISOString(),
            end_timestamp: new Date(endDate).toISOString()
          },
          categoriesToAdd,
          categoriesToUpdate,
          categoriesToDelete,
          itemsToAdd,
          itemsToUpdate,
          itemsToDelete
        );
      } else {
        // Create new event
        await createEvent(
          {
            title,
            description: description || null,
            admin_id: user.id,
            start_timestamp: new Date(startDate).toISOString(),
            end_timestamp: new Date(endDate).toISOString(),
            status: 'draft'
          },
          categories.map(category => ({
            name: category.name
          })),
          categories.flatMap((category, categoryIndex) => 
            category.items.map(item => ({
              categoryIndex,
              name: item.name,
              thumbnail_url: item.thumbnail_url
            }))
          )
        );
      }
      
      // Redirect to admin dashboard
      navigate('/admin');
      } catch (err) {
        console.error('Error saving event:', err);
        setError(err instanceof Error ? err.message : 'Failed to save event');
      } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-8 h-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
      </div>
      
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-error-light border-l-4 border-error p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-error-dark">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Event Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Event Details</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                      Start Date*
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <div className="relative flex items-stretch flex-grow focus-within:z-10">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="start-date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md pl-10 sm:text-sm border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                      End Date*
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <div className="relative flex items-stretch flex-grow focus-within:z-10">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="end-date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md pl-10 sm:text-sm border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Categories and Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Categories & Items</h2>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </button>
                </div>
                
                <AnimatePresence>
                  {categories.map((category, categoryIndex) => (
                    <motion.div
                      key={categoryIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-1 mr-4">
                          <label htmlFor={`category-${categoryIndex}`} className="block text-sm font-medium text-gray-700">
                            Category Name*
                          </label>
                          <input
                            type="text"
                            id={`category-${categoryIndex}`}
                            value={category.name}
                            onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeCategory(categoryIndex)}
                            className="inline-flex items-center p-1 border border-transparent rounded-full text-error hover:bg-error-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-700">Items</h3>
                          <button
                            type="button"
                            onClick={() => addItem(categoryIndex)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Item
                          </button>
                        </div>
                        
                        <div className="mt-2 space-y-2">
                          <AnimatePresence>
                            {category.items.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-start space-x-2"
                              >
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItemName(categoryIndex, itemIndex, e.target.value)}
                                    placeholder="Item name"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    required
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={item.thumbnail_url || ''}
                                    onChange={(e) => updateItemThumbnail(categoryIndex, itemIndex, e.target.value)}
                                    placeholder="Thumbnail URL (optional)"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(categoryIndex, itemIndex)}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full text-error hover:bg-error-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          {category.items.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No items added yet</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {categories.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-500">No categories added yet</p>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Category
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                    <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditor;