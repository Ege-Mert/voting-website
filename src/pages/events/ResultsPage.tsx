import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertTriangle, Star, Trophy, Users, Sparkles, 
  Award as AwardIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getEventById, getEventResults } from '../../services/eventService';
import { Event, CategoryWithResults, ItemResult } from '../../types';
import { format } from 'date-fns';

const ResultsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [results, setResults] = useState<CategoryWithResults[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEventAndResults = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch event details
        const eventData = await getEventById(eventId);
        setEvent(eventData);
        
        // Fetch results
        const resultsData = await getEventResults(eventId);
        setResults(resultsData);
        
        // Set active category to the first one
        if (resultsData.length > 0) {
          setActiveCategory(resultsData[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching results:', err);
        setError(err.message || 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventAndResults();
  }, [eventId]);
  
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-gold" />
            <span className="ml-1 font-bold text-gold">1st</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center">
            <AwardIcon className="h-5 w-5 text-silver" />
            <span className="ml-1 font-bold text-silver-dark">2nd</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center">
            <AwardIcon className="h-5 w-5 text-bronze" />
            <span className="ml-1 font-bold text-bronze-dark">3rd</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <span className="font-medium text-gray-700">{rank}th</span>
          </div>
        );
    }
  };
  
  const renderStars = (score: number) => {
    // Round to nearest 0.5
    const roundedScore = Math.round(score * 2) / 2;
    const fullStars = Math.floor(roundedScore);
    const hasHalfStar = roundedScore % 1 !== 0;
    
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i}
            className={`h-4 w-4 ${
              i < fullStars 
                ? 'fill-current text-gold' 
                : i === fullStars && hasHalfStar
                ? 'text-gold'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
                Results: {event.title}
              </h1>
              <div className="mt-2 text-sm text-gray-500">
                {format(new Date(event.start_timestamp), 'MMMM d')} - {format(new Date(event.end_timestamp), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          {/* Category Tabs */}
          <div className="px-4 sm:px-6">
            <div className="py-3 overflow-x-auto">
              <nav className="flex space-x-4">
                {results.map((category) => (
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
          
          {/* Results Area */}
          <div className="px-4 py-5 sm:px-6">
            <AnimatePresence mode="wait">
              {results.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: activeCategory === category.id ? 1 : 0, x: activeCategory === category.id ? 0 : 20 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${activeCategory === category.id ? 'block' : 'hidden'}`}
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Results for "{category.name}"
                  </h2>
                  
                  {category.items.length === 0 ? (
                    <p className="text-gray-500 italic">No results available for this category.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rank
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Total Points
                              </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1" />
                                Avg. Score
                              </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                # of Votes
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {category.items
                            .sort((a, b) => a.rank - b.rank)
                            .map((item: ItemResult) => (
                              <motion.tr 
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`${item.rank <= 3 ? 'bg-gray-50' : ''}`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getRankBadge(item.rank)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{item.total_points}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {item.avg_score.toFixed(2)}
                                    </span>
                                    {renderStars(item.avg_score)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.vote_count}
                                </td>
                              </motion.tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;