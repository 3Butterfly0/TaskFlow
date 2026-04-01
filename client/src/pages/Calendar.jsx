import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskMutation,
} from "../features/tasks/taskApi";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import TaskDetails from "../features/tasks/TaskDetails";
import ErrorState from "../components/ui/ErrorState";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

const Calendar = () => {
  const { projectId } = useParams();
  const { data: tasksData, isLoading: isLoadingTasks, isError, error } =
    useGetTasksByProjectQuery(projectId);
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const [updateTask] = useUpdateTaskMutation();

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasks = tasksData?.data || [];
  const project = projectData?.data;

  const events = tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      let backgroundColor = "#3b82f6";
      if (task.priority === "critical") backgroundColor = "#ef4444";
      else if (task.priority === "high") backgroundColor = "#f97316";
      else if (task.priority === "medium") backgroundColor = "#f59e0b";

      return {
        id: task._id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        backgroundColor,
        borderColor: backgroundColor,
        extendedProps: { task },
      };
    });

  const handleEventDrop = async (info) => {
    const taskId = info.event.id;
    const newDate = info.event.start;

    try {
      await updateTask({
        id: taskId,
        projectId,
        dueDate: newDate.toISOString(),
      }).unwrap();
      toast.success("Task due date updated.");
    } catch {
      toast.error("Failed to update task date.");
      info.revert();
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
    <div className="flex flex-1 flex-col min-h-0 px-6 py-4 overflow-y-auto custom-scrollbar">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <div className="flex gap-2">
          <select
            value={currentDate.getMonth()}
            onChange={(e) => {
              const d = new Date(currentDate);
              d.setMonth(parseInt(e.target.value, 10));
              calendarRef.current?.getApi().gotoDate(d);
            }}
            className="rounded bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200 outline-none border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const d = new Date(currentDate);
              d.setFullYear(parseInt(e.target.value, 10));
              calendarRef.current?.getApi().gotoDate(d);
            }}
            className="rounded bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200 outline-none border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const year = new Date().getFullYear() - 5 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {isError && (
        <div className="mb-4">
          <ErrorState message={error?.data?.message || "Failed to load tasks"} />
        </div>
      )}

      <style>{`
        .calendar-wrapper .fc {
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
          --fc-today-bg-color: rgba(99, 102, 241, 0.05);
          font-family: inherit;
        }
        .calendar-wrapper .fc-theme-standard th {
          border: 1px solid #1e293b;
          padding: 8px 0;
          background-color: #0f172a;
          color: #94a3b8;
        }
        .calendar-wrapper .fc-theme-standard td {
          border: 1px solid #1e293b;
        }
        .calendar-wrapper .fc-daygrid-day-number {
          color: #cbd5e1;
          font-size: 0.875rem;
          padding: 7px !important;
        }
        .calendar-wrapper .fc .fc-toolbar-title {
          display: none;
        }
      `}</style>

      <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden calendar-wrapper p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          droppable={true}
          datesSet={() => {
            if (calendarRef.current) {
              setCurrentDate(calendarRef.current.getApi().getDate());
            }
          }}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "",
            center: "",
            right: "today prev,next",
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
