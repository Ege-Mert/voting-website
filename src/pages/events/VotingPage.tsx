import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  getUserVotes
} from '../../services/eventService';
import { submitMultipleVotes } from '../../services/voteService';
import StarRating from '../../components/common/StarRating';
import { Event, Category, Item } from '../../types';
import { isPast, formatDistanceToNow } from 'date-fns';

interface CategoryWithUserVotes extends Category {
  items: (Item & { user_vote?: number })[];
}

interface EventWithUserVotes extends Event {
  categories: CategoryWithUserVotes[];
}

const VotingPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<EventWithUserVotes | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEventAndVotes = async () => {
      if (!eventId || !user) return;
      
      try {
        setIsLoading(true);
        
        const eventWithUserVotes = await getUserVotes(eventId, user.id);
        
        setEvent(eventWithUserVotes as EventWithUserVotes);
        
        // Set active category to the first one
        if (eventWithUserVotes.categories.length > 0) {
          setActiveCategory(eventWithUserVotes.categories[0].id);
        }
        
        // Initialize votes object from user's previous votes
        const initialVotes: Record<string, number> = {};
        eventWithUserVotes.categories.forEach(category => {
          category.items.forEach(item => {
            if (item.user_vote !== undefined) {
              initialVotes[item.id] = item.user_vote;
            }
          });
        });
        
        setVotes(initialVotes);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventAndVotes();
  }, [eventId, user]);
  
  const handleVoteChange = (itemId: string, value: number) => {
    setVotes(prev => ({
      ...prev,
      [itemId]: value
    }));
  };
  
  const handleSaveVotes = async () => {
    if (!user || !event) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare votes data
      const votesToSubmit = Object.entries(votes).map(([itemId, stars]) => ({
        itemId,
        stars
      }));
      
      // Submit votes
      await submitMultipleVotes(user.id, votesToSubmit);
      
      setSuccessMessage('Votes saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving votes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save votes');
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
  
  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-error-light border-l-4 border-error p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-error-dark">
                {error || 'Event not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (event.status !== 'open') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-warning-light border-l-4 border-warning p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-dark">
                This event is {event.status === 'draft' ? 'not yet open' : 'already closed'} for voting.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(`/event/${eventId}`)}
            className="inline-flex items-center text-primary-600 hover:text-primary-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Event
          </button>
        </div>
      </div>
    );
  }
  
  if (isPast(new Date(event.end_timestamp))) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-warning-light border-l-4 border-warning p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-dark">
                Voting for this event has ended. You can view the results now.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => navigate(`/event/${eventId}`)}
            className="inline-flex items-center text-primary-600 hover:text-primary-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Event
          </button>
          <button
            onClick={() => navigate(`/event/${eventId}/results`)}
            className="btn-primary"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/event/${eventId}`)}
          className="inline-flex items-center text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Event
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {event.title}
              </h1>
              <div className="mt-2 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success-dark">
                  Voting Open
                </span>
                <span className="ml-2 text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Closes {formatDistanceToNow(new Date(event.end_timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleSaveVotes}
                disabled={isSaving}
                className="btn-primary"
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
                    Save Votes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {successMessage && (
          <div className="mx-4 my-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-success-light border-l-4 border-success p-4 rounded"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-success-dark">{successMessage}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {error && (
          <div className="mx-4 my-2">
            <div className="bg-error-light border-l-4 border-error p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-error-dark">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200">
          {/* Category Tabs */}
          <div className="px-4 sm:px-6">
            <div className="py-3 overflow-x-auto">
              <nav className="flex space-x-4">
                {event.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeCategory === category.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Voting Area */}
          <div className="px-4 py-5 sm:px-6">
            <AnimatePresence mode="wait">
              {event.categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: activeCategory === category.id ? 1 : 0, x: activeCategory === category.id ? 0 : 20 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${activeCategory === category.id ? 'block' : 'hidden'}`}
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Rate items in "{category.name}"
                  </h2>
                  
                  <div className="space-y-6">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="mb-3 sm:mb-0">
                            <h3 className="text-md font-medium text-gray-900">
                              {item.name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="mr-3 text-sm text-gray-500">
                              Your rating:
                            </div>
                            <StarRating
                              value={votes[item.id] || 0}
                              onChange={(value) => handleVoteChange(item.id, value)}
                              size="lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-end">
          <button
            onClick={handleSaveVotes}
            disabled={isSaving}
            className="btn-primary"
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
                Save Votes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;