import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getEventById } from '../../services/eventService';
import { Event } from '../../types';
import { format, isPast, formatDistanceToNow } from 'date-fns';

const EventViewPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const eventData = await getEventById(eventId);
        setEvent(eventData);
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);
  
  const handleVoteClick = () => {
    if (event?.status === 'open') {
      navigate(`/event/${eventId}/vote`);
    }
  };
  
  const handleResultsClick = () => {
    navigate(`/event/${eventId}/results`);
  };
  
  const getEventStatusBadge = () => {
    if (!event) return null;
    
    switch (event.status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Draft
          </span>
        );
      case 'open':
        return isPast(new Date(event.end_timestamp)) ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning-dark">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success-dark">
            Open
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      default:
        return null;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {event.title}
              </h1>
              <div className="mt-2 flex items-center">
                {getEventStatusBadge()}
                <span className="ml-2 text-sm text-gray-500">
                  <Calendar className="inline-block h-4 w-4 mr-1" />
                  {format(new Date(event.start_timestamp), 'MMM d, yyyy')} - {format(new Date(event.end_timestamp), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              {event.status === 'open' && !isPast(new Date(event.end_timestamp)) && (
                <button
                  onClick={handleVoteClick}
                  className="btn-primary"
                >
                  Cast Your Vote
                </button>
              )}
              
              {(event.status === 'closed' || isPast(new Date(event.end_timestamp))) && (
                <button
                  onClick={handleResultsClick}
                  className="btn-secondary"
                >
                  View Results
                </button>
              )}
              
              {user?.role === 'admin' && user.id === event.admin_id && (
                <Link to="/admin" className="btn-secondary">
                  Manage Event
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {event.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="mt-1 text-sm text-gray-500">{event.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
            <div className="mt-2 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between text-sm">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-gray-900 text-right">{getEventStatusBadge()}</dd>
                </div>
                
                <div className="py-3 flex justify-between text-sm">
                  <dt className="text-gray-500">Start Date</dt>
                  <dd className="text-gray-900 text-right">{format(new Date(event.start_timestamp), 'MMMM d, yyyy')}</dd>
                </div>
                
                <div className="py-3 flex justify-between text-sm">
                  <dt className="text-gray-500">End Date</dt>
                  <dd className="text-gray-900 text-right">{format(new Date(event.end_timestamp), 'MMMM d, yyyy')}</dd>
                </div>
                
                {event.status === 'open' && !isPast(new Date(event.end_timestamp)) && (
                  <div className="py-3 flex justify-between text-sm">
                    <dt className="text-gray-500">Voting Closes In</dt>
                    <dd className="text-gray-900 text-right">
                      <Clock className="inline-block h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(event.end_timestamp), { addSuffix: true })}
                    </dd>
                  </div>
                )}
                
                <div className="py-3 flex justify-between text-sm">
                  <dt className="text-gray-500">Event Link</dt>
                  <dd className="text-gray-900 text-right">
                    <div className="flex items-center">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {window.location.origin}/event/{event.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                          alert('Link copied to clipboard');
                        }}
                        className="ml-2 text-primary-600 hover:text-primary-900"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="sm:flex sm:justify-center sm:items-center">
            {event.status === 'open' && !isPast(new Date(event.end_timestamp)) ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Vote?</h3>
                <p className="text-sm text-gray-500 mb-4">Cast your votes for items in this event</p>
                <button
                  onClick={handleVoteClick}
                  className="btn-primary"
                >
                  Go to Voting Page
                </button>
              </motion.div>
            ) : event.status === 'closed' || isPast(new Date(event.end_timestamp)) ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">Voting is Closed</h3>
                <p className="text-sm text-gray-500 mb-4">View the final results and rankings</p>
                <button
                  onClick={handleResultsClick}
                  className="btn-primary"
                >
                  View Results
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Yet Open</h3>
                <p className="text-sm text-gray-500">Voting for this event has not yet started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventViewPage;