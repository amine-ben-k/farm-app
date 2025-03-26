'use client';

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Layout from '../../components/Layout';
import { CheckCircleIcon, ClockIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// Setup the localizer for react-big-calendar with local timezone
const localizer = momentLocalizer(moment);

interface Task {
  id: number;
  title: string;
  description: string | null;
  task_date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  status: 'Pending' | 'Done' | 'Postponed';
  recurrence: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  created_at: string;
  updated_at: string;
}

interface CalendarEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;
}

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_date: '',
    time: '',
    recurrence: 'None' as 'None' | 'Daily' | 'Weekly' | 'Monthly',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'work_week' | 'day' | 'agenda'>('month');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data || []);
  
      const calendarEvents: CalendarEvent[] = [];
      data.forEach((task: Task) => {
        console.log('Original task.task_date:', task.task_date); // Log the original task date
  
        // Parse the task date components
        const [year, month, day] = task.task_date.split('-').map(Number);
        let currentYear = year;
        let currentMonth = month - 1; // JavaScript months are 0-11
        let currentDay = day;
  
        // Calculate the end date for recurrence (1 year from now)
        const endRecurrence = new Date();
        endRecurrence.setFullYear(endRecurrence.getFullYear() + 1);
  
        // Generate events based on recurrence
        const recurrence = task.recurrence || 'None';
        while (true) {
          // Create the start and end dates for the event
          let eventStart: Date;
          let eventEnd: Date;
  
          if (task.time) {
            const [hours, minutes] = task.time.split(':').map(Number);
            eventStart = new Date(currentYear, currentMonth, currentDay, hours, minutes);
            eventEnd = new Date(currentYear, currentMonth, currentDay, hours, minutes);
          } else {
            eventStart = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
            eventEnd = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
          }
  
          console.log('Event start:', eventStart.toISOString()); // Log the event start date
  
          // Stop if the event date is beyond the end recurrence date
          if (eventStart > endRecurrence) break;
  
          // Format the event date as YYYY-MM-DD
          const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          console.log('resource.task_date:', eventDate); // Log the resource.task_date
  
          // Create the event
          calendarEvents.push({
            id: task.id + (recurrence !== 'None' ? `-${eventDate}` : ''),
            title: `${task.title} (${task.status})`,
            start: eventStart,
            end: eventEnd,
            allDay: !task.time,
            resource: {
              ...task,
              task_date: task.recurrence === 'None' ? task.task_date : eventDate,
            },
          });
  
          // Break for non-recurring tasks
          if (recurrence === 'None') break;
  
          // Increment the date based on recurrence
          if (recurrence === 'Daily') {
            const nextDate = new Date(currentYear, currentMonth, currentDay);
            nextDate.setDate(nextDate.getDate() + 1);
            currentYear = nextDate.getFullYear();
            currentMonth = nextDate.getMonth();
            currentDay = nextDate.getDate();
          } else if (recurrence === 'Weekly') {
            const nextDate = new Date(currentYear, currentMonth, currentDay);
            nextDate.setDate(nextDate.getDate() + 7);
            currentYear = nextDate.getFullYear();
            currentMonth = nextDate.getMonth();
            currentDay = nextDate.getDate();
          } else if (recurrence === 'Monthly') {
            const nextDate = new Date(currentYear, currentMonth, currentDay);
            nextDate.setMonth(nextDate.getMonth() + 1);
            currentYear = nextDate.getFullYear();
            currentMonth = nextDate.getMonth();
            currentDay = nextDate.getDate();
          }
        }
      });
  
      setEvents(calendarEvents);
    } catch (err) {
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newTask.title || !newTask.task_date) {
      setError('Title and date are required');
      setLoading(false);
      return;
    }

    if (!moment(newTask.task_date, 'YYYY-MM-DD', true).isValid()) {
      setError('Invalid date format. Please use YYYY-MM-DD.');
      setLoading(false);
      return;
    }

    if (newTask.time && !moment(newTask.time, 'HH:mm', true).isValid()) {
      setError('Invalid time format. Please use HH:MM (24-hour).');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add task');
      }

      await fetchTasks();
      setNewTask({ title: '', description: '', task_date: '', time: '', recurrence: 'None' });
      setShowAddTaskModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (task: Task) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'Done' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to mark task as done');
      }

      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to mark task as done');
    } finally {
      setLoading(false);
    }
  };

  const handlePostponeTask = async (task: Task) => {
    if (!postponeDate) {
      setError('Please select a new date to postpone the task');
      return;
    }

    if (!moment(postponeDate, 'YYYY-MM-DD', true).isValid()) {
      setError('Invalid date format for postponement. Please use YYYY-MM-DD.');
      return;
    }

    if (postponeTime && !moment(postponeTime, 'HH:mm', true).isValid()) {
      setError('Invalid time format for postponement. Please use HH:MM (24-hour).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          task_date: postponeDate,
          time: postponeTime || null,
          status: 'Postponed',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to postpone task');
      }

      await fetchTasks();
      setSelectedTask(null);
      setPostponeDate('');
      setPostponeTime('');
    } catch (err: any) {
      setError(err.message || 'Failed to postpone task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedTask(event.resource);
    setPostponeDate('');
    setPostponeTime(event.resource.time || '');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Task Schedule</h1>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Task
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Add New Task</h2>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Water the crops"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newTask.task_date}
                      onChange={(e) => setNewTask({ ...newTask, task_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                    <input
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                  <select
                    value={newTask.recurrence}
                    onChange={(e) =>
                      setNewTask({ ...newTask, recurrence: e.target.value as 'None' | 'Daily' | 'Weekly' | 'Monthly' })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    placeholder="e.g., Water the wheat field in the north section"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Add Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Task Details</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 text-gray-700">
                <div className="flex">
                  <span className="font-medium w-24">Title:</span>
                  <span>{selectedTask.title}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Date:</span>
                  <span>{selectedTask.task_date}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Time:</span>
                  <span>{selectedTask.time || 'All Day'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Status:</span>
                  <span>{selectedTask.status}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Recurrence:</span>
                  <span>{selectedTask.recurrence}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Description:</span>
                  <span>{selectedTask.description || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Created At:</span>
                  <span>{new Date(selectedTask.created_at).toLocaleString()}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Updated At:</span>
                  <span>{new Date(selectedTask.updated_at).toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  {selectedTask.status !== 'Done' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleMarkAsDone(selectedTask)}
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        Mark as Done
                      </button>
                    </div>
                  )}
                  {selectedTask.status !== 'Done' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                          <input
                            type="date"
                            value={postponeDate}
                            onChange={(e) => setPostponeDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Time (Optional)</label>
                          <input
                            type="time"
                            value={postponeTime}
                            onChange={(e) => setPostponeTime(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handlePostponeTask(selectedTask)}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 bg-yellow-600 text-white font-medium py-2 rounded-md hover:bg-yellow-700 transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <ClockIcon className="h-5 w-5" />
                        Postpone
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeleteTask(selectedTask)}
                      disabled={loading}
                      className={`flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-2 rounded-md hover:bg-red-700 transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <TrashIcon className="h-5 w-5" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="flex-1 flex items-center justify-center bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Task Calendar</h2>
          {loading ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-gray-500">No tasks scheduled yet.</p>
          ) : (
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={(event: CalendarEvent) => {
                  const backgroundColor =
                    event.resource.status === 'Done'
                      ? '#10B981' // Green for Done
                      : event.resource.status === 'Postponed'
                      ? '#F59E0B' // Yellow for Postponed
                      : '#3B82F6'; // Blue for Pending
                  return { style: { backgroundColor } };
                }}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                view={currentView}
                onView={(view) => setCurrentView(view)}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}