'use client';
import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
  
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Event {
  id: string;
  title: string;
  date: Date;
  color: string;
}

type ViewType = 'month' | 'week' | 'day';

const Reminders: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', color: 'bg-orange' });
  const [view, setView] = useState<ViewType>('month');

  useEffect(() => {
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: parseISO(event.date),
      }));
      setEvents(parsedEvents);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      setEvents([
        ...events,
        {
          id: uuidv4(),
          title: newEvent.title,
          date: parseISO(newEvent.date),
          color: newEvent.color,
        },
      ]);
      setNewEvent({ title: '', date: '', color: 'bg-orange' });
      setIsModalOpen(false);
    }
  };

  const getDays = () => {
    if (view === 'month') return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    if (view === 'week') return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
    return [currentDate];
  };

  const days = getDays();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Reminders</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-rose text-rose hover:text-white cursor-pointer border px-3 py-1 rounded-full text-sm hover:bg-rose-600"
          >
            + New
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-600">Views</h2>
          <div className="space-x-2">
            <button onClick={() => setView('month')} className={`text-sm px-2 py-1 cursor-pointer hover:bg-orange hover:text-white text-orange border border-orange rounded-3xl ${view === 'month' ? 'bg-orange text-white' : ''}`}>Month</button>
            <button onClick={() => setView('week')} className={`text-sm px-2 py-1 cursor-pointer hover:bg-orange hover:text-white text-orange border border-orange rounded-3xl ${view === 'week' ? 'bg-orange text-white' : ''}`}>Week</button>
            <button onClick={() => setView('day')} className={`text-sm px-2 py-1 cursor-pointer hover:bg-orange hover:text-white text-orange border border-orange rounded-3xl ${view === 'day' ? 'bg-orange text-white' : ''}`}>Day</button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm px-2 py-1 bg-orange text-white rounded"
          >
            Today
          </button>
        </div>

        {/* Mini calendar */}
        <div className="text-sm">
          <h2 className="font-semibold text-gray-600 mb-2">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-gray-500 font-medium">{day}</div>
            ))}
            {days.map((day) => (
              <div
                key={day.toString()}
                className={`p-1 rounded-full cursor-pointer ${
                  isToday(day) ? 'bg-orange text-white' : isSameMonth(day, currentDate) ? 'text-gray-800' : 'text-gray-400'
                }`}
                onClick={() => {
                  setIsModalOpen(true);
                  setNewEvent({ ...newEvent, date: format(day, "yyyy-MM-dd'T'HH:mm") });
                }}
              >
                {format(day, 'd')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {view === 'day'
              ? format(currentDate, 'eeee, MMMM d, yyyy')
              : format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="space-x-2">
            <button onClick={prev} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Prev
            </button>
            <button onClick={next} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Next
            </button>
          </div>
        </div>

        <div className={`grid ${view === 'month' ? 'grid-cols-7' : 'grid-cols-1'} gap-1 text-center bg-white rounded-lg shadow-md`}>
          {view === 'month' && ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <div key={day} className="p-2 font-semibold text-gray-600 border-b">{day}</div>
          ))}

          {days.map((day) => (
            <div
              key={day.toString()}
              className={`p-2 min-h-[100px] border text-left relative ${
                isSameMonth(day, currentDate) ? 'bg-white' : 'bg-gray-50'
              } ${isToday(day) ? 'border-orange border-2' : 'border-gray-200'}`}
              onClick={() => {
                setIsModalOpen(true);
                setNewEvent({ ...newEvent, date: format(day, "yyyy-MM-dd'T'HH:mm") });
              }}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {events
                .filter((event) => format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .map((event) => (
                  <div
                    key={event.id}
                    className={`mt-1 p-1 text-xs text-white rounded ${event.color} truncate`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <select
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-red-500">Red</option>
                  <option value="bg-purple-500">Purple</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-orange text-white rounded hover:bg-orange-700"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
