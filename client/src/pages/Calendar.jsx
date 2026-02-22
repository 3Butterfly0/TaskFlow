import { useState } from "react";
import { useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useGetTasksByProjectQuery, useUpdateTaskMutation } from "../features/tasks/taskApi";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import TaskDetails from "../features/tasks/TaskDetails";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

const Calendar = () => {
  const { projectId } = useParams();
  const { data: tasksData, isLoading: isLoadingTasks } = useGetTasksByProjectQuery(projectId);
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const [updateTask] = useUpdateTaskMutation();

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const tasks = tasksData?.data || [];
  const project = projectData?.data;

  // Map tasks to FullCalendar event objects
  const events = tasks
    .filter(task => task.dueDate) // Only tasks with due dates
    .map(task => {
      // Map priority to background colors
      let backgroundColor = "#3b82f6"; // default blue (low)
      if (task.priority === "critical") backgroundColor = "#ef4444"; // red
      else if (task.priority === "high") backgroundColor = "#f97316"; // orange
      else if (task.priority === "medium") backgroundColor = "#f59e0b"; // amber

      return {
        id: task._id,
        title: task.title,
        start: task.dueDate,
        allDay: true, // simplified
        backgroundColor,
        borderColor: backgroundColor,
        extendedProps: {
          task
        }
      };
    });

  const handleEventDrop = async (info) => {
    const taskId = info.event.id;
    const newDate = info.event.start;
    
    // Optimistic dragging is handled by FullCalendar automatically until we revert.
    try {
      await updateTask({ id: taskId, projectId, dueDate: newDate.toISOString() }).unwrap();
      toast.success("Task due date updated.");
    } catch (error) {
      toast.error("Failed to update task date.");
      info.revert(); // revert visual change if API fails
    }
  };

  const handleEventClick = (info) => {
    setSelectedTaskId(info.event.id);
  };

  if (isLoadingTasks) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Calendar</h1>
        <p className="text-sm text-slate-400">View and manage task deadlines via drag-and-drop.</p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden calendar-wrapper custom-scrollbar">
        <style dangerouslySetInnerHTML={{__html: `
          .fc {
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: #0f172a;
            --fc-neutral-text-color: #cbd5e1;
            --fc-border-color: #1e293b;
            --fc-button-text-color: #cbd5e1;
            --fc-button-bg-color: #1e293b;
            --fc-button-border-color: #334155;
            --fc-button-hover-bg-color: #334155;
            --fc-button-hover-border-color: #475569;
            --fc-button-active-bg-color: #475569;
            --fc-button-active-border-color: #64748b;
            --fc-event-bg-color: #6366f1;
            --fc-event-border-color: #6366f1;
            --fc-event-text-color: #fff;
            --fc-event-selected-overlay-color: rgba(0, 0, 0, 0.25);
            --fc-more-link-bg-color: #1e293b;
            --fc-more-link-text-color: #cbd5e1;
            --fc-event-resizer-thickness: 8px;
            --fc-event-resizer-dot-total-width: 8px;
            --fc-event-resizer-dot-border-width: 1px;
            --fc-non-business-color: rgba(215, 215, 215, 0.3);
            --fc-bg-event-color: rgb(143, 223, 130);
            --fc-bg-event-opacity: 0.3;
            --fc-highlight-color: rgba(99, 102, 241, 0.1);
            --fc-today-bg-color: rgba(99, 102, 241, 0.05);
            --fc-now-indicator-color: #ef4444;
            font-family: inherit;
          }
          .fc-theme-standard .fc-scrollgrid { border-radius: 8px; overflow: hidden; border-color: #1e293b; }
          .fc-theme-standard th { border-color: #1e293b; padding: 8px 0; background-color: #0f172a; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
          .fc-theme-standard td { border-color: #1e293b; }
          .fc-daygrid-day-number { color: #cbd5e1; font-size: 0.875rem; padding: 8px !important; }
          .fc-daygrid-event { border-radius: 4px; padding: 2px 4px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s; border: none !important; }
          .fc-daygrid-event:hover { opacity: 0.9; }
          .fc-daygrid-dot-event { border-radius: 4px; padding: 2px 4px; }
          .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #f8fafc; }
          .fc-button { text-transform: capitalize; border-radius: 6px !important; font-weight: 500 !important; font-size: 0.875rem !important; transition: all 0.2s; }
          .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active { box-shadow: none !important; }
          .fc-button-primary:focus { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5) !important; }
        `}} />
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "title",
            center: "",
            right: "prev,next today"
          }}
          height="100%"
          dayMaxEvents={3}
        />
      </div>

      <TaskDetails
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        projectMembers={project?.members || []}
        projectColumns={project?.columns || []}
      />
    </div>
  );
};

export default Calendar;
