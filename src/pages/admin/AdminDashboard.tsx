import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getAdminEvents, deleteEvent, updateEventStatus } from '../../services/eventService';
import { Event } from '../../types';
import { format, isPast } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const events = await getAdminEvents(user.id);
        setEvents(events);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);
  
  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };
  
  const handleStatusUpdate = async (eventId: string, status: 'draft' | 'open' | 'closed') => {
    try {
      const updatedEvent = await updateEventStatus(eventId, status);
      setEvents(events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
    } catch (err) {
      console.error('Error updating event status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update event status');
    }
  };
  
  const getEventStatusBadge = (event: Event) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/admin/events/new"
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-error-light border-l-4 border-error p-4 rounded">
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

      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <svg className="w-8 h-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
            <p className="mt-2 text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <Link
                to="/admin/events/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {events.map((event) => (
                <motion.li 
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {event.title}
                        </h3>
                        <div className="mt-1 flex items-center">
                          {getEventStatusBadge(event)}
                          <span className="ml-2 text-sm text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(event.start_timestamp), 'MMM d, yyyy')} - {format(new Date(event.end_timestamp), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                        {/* Status Controls */}
                        {event.status === 'draft' && (
                          <button
                            onClick={() => handleStatusUpdate(event.id, 'open')}
                            className="btn-success text-xs"
                          >
                            Open Voting
                          </button>
                        )}
                        {event.status === 'open' && (
                          <button
                            onClick={() => handleStatusUpdate(event.id, 'closed')}
                            className="btn-secondary text-xs"
                          >
                            Close Voting
                          </button>
                        )}
                        
                        {/* View Results/Vote */}
                        <Link
                          to={`/event/${event.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        
                        {/* Edit (only for drafts) */}
                        {event.status === 'draft' && (
                          <Link
                            to={`/admin/events/${event.id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        )}
                        
                        {/* Delete (only for drafts) */}
                        {event.status === 'draft' && (
                          <>
                            {showDeleteConfirm === event.id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDelete(event.id)}
                                  className="text-error hover:text-error-dark"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(event.id)}
                                className="text-error hover:text-error-dark"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:flex sm:items-center">
                      <div className="mt-3 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium text-gray-900 mr-2">Event Link:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {window.location.origin}/event/{event.id}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                              alert('Link copied to clipboard');
                            }}
                            className="ml-2 text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;