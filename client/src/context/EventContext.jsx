import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const { user, apiFetch } = useAuth();

  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventIdState] = useState('');
  const [eventsLoading, setEventsLoading] = useState(false);

  const getStorageKey = (u) => u?.role ? `selectedEventId_${u.role}` : 'selectedEventId';

  const setSelectedEventId = (id) => {
    setSelectedEventIdState(id);
    const key = getStorageKey(user);
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
  };

  const selectedEvent = allEvents.find(e => e._id === selectedEventId) || null;

  const loadEvents = async (currentUser) => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
      const isAdmin = currentUser.role === 'Admin';
      const url = isAdmin ? '/api/events?includeDrafts=true' : '/api/events';
      const data = await apiFetch(url);
      if (data.success) {
        let events = data.events || [];
        if (currentUser.role === 'Judge') {
          events = events.filter(e => e.assignedJudges && e.assignedJudges.includes(currentUser.id));
        }
        setAllEvents(events);

        const key = getStorageKey(currentUser);
        const saved = localStorage.getItem(key);
        const savedValid = saved && events.find(e => e._id === saved);

        if (savedValid) {
          setSelectedEventIdState(saved);
        } else if (events.length > 0) {
          const active = events.find(e => e.status === 'Active');
          const autoSelect = active || events[0];
          setSelectedEventIdState(autoSelect._id);
          localStorage.setItem(key, autoSelect._id);
        }
      }
    } catch (err) {
      console.error('EventContext: could not load events', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setAllEvents([]);
      setSelectedEventIdState('');
      return;
    }
    loadEvents(user);
  }, [user?.id, user?.role]);

  return (
    <EventContext.Provider
      value={{
        allEvents,
        selectedEvent,
        selectedEventId,
        setSelectedEventId,
        eventsLoading,
        refreshEvents: () => loadEvents(user)
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within an EventProvider');
  return context;
};
