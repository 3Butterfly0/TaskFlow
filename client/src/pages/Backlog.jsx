import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGetTasksByProjectQuery, useCreateTaskMutation, useUpdateTaskMutation } from "../features/tasks/taskApi";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import { 
  Loader, 
  Plus, 
  ChevronDown,
  Layout,
  Users,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import PromoteTaskModal from "../features/tasks/PromoteTaskModal";
import Modal from "../components/ui/Modal";

const Backlog = () => {
  const { projectId } = useParams();
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const { data: tasksData, isLoading } = useGetTasksByProjectQuery(projectId);
  
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  const project = projectData?.data;
  const tasks = tasksData?.data || [];

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [promoteTask, setPromoteTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  // Group and filter tasks
  const { backlogTasks } = useMemo(() => {
    let backlog = [];
    tasks.forEach(t => {
      if (t.isInBacklog) backlog.push(t);
    });

    if (dateFilter) {
      backlog = backlog.filter(t => {
        const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 
                         new Date(t.createdAt).toISOString().split('T')[0];
        return taskDate === dateFilter;
      });
    }

    return { backlogTasks: backlog };
  }, [tasks, dateFilter]);

  const handleCreateBacklogTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const firstColId = project?.columns?.[0]?.id;
    if (!firstColId) return;

    try {
      await createTask({
        title: newTaskTitle.trim(),
        projectId,
        columnId: firstColId,
        isInBacklog: true, 
        priority: "medium"
      }).unwrap();
      setNewTaskTitle("");
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleMoveToBoard = async (task) => {
    // Legacy direct move, now we use Promote Modal
    setPromoteTask(task);
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-slate-500" /></div>;
  if (!project) return <div className="text-center p-10 text-slate-500">Project not found</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950">


      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto">
          {/* ── Backlog Section ────────────────────────────── */}
          <div>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
               <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-white">Backlog</h2>
                 <span className="text-slate-500 text-sm font-normal">({backlogTasks.length} issues)</span>
               </div>
               
               <div className="flex items-center gap-3">
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
                   <input
                     type="date"
                     value={dateFilter}
                     onChange={(e) => setDateFilter(e.target.value)}
                     className="rounded-lg pl-9 pr-3 py-1.5 border border-slate-700 bg-slate-800 text-sm text-slate-300 outline-none focus:border-indigo-500 scheme-dark"
                     title="Filter by date (Created/Due)"
                   />
                   {dateFilter && (
                     <button 
                       onClick={() => setDateFilter("")}
                       className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                     >
                       ✕
                     </button>
                   )}
                 </div>
                 
                 <button
                   onClick={() => setIsCreateModalOpen(true)}
                   className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/30"
                 >
                   <Plus className="size-4" />
                   Create Backlog
                 </button>
               </div>
             </div>

             <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden min-h-[200px]">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_2fr_120px_120px_120px_100px] gap-4 bg-slate-900/80 p-3 text-xs font-semibold uppercase text-slate-500 border-b border-slate-800">
                  <div className="pl-2">Title</div>
                  <div>Description</div>
                  <div>Created By</div>
                  <div>Created Date</div>
                  <div>Due Date</div>
                  <div className="text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-800">
                   {backlogTasks.map(task => (
                     <div 
                        key={task._id} 
                        className="group grid grid-cols-[1fr_2fr_120px_120px_120px_100px] gap-4 items-center p-3 hover:bg-slate-800/50 transition-colors"
                     >
                       {/* Title - Removed checkbox/priority indicator */}
                       <div className="flex items-center gap-3 min-w-0 pl-2">
                         <span className="font-medium text-slate-200 truncate" title={task.title}>{task.title}</span>
                       </div>

                       {/* Description (Clickable) */}
                       <div 
                         className="text-sm text-slate-500 truncate cursor-pointer hover:text-indigo-400 decoration-dotted hover:underline"
                         onClick={() => setSelectedTaskId(task._id)}
                       >
                         {task.description || "No description"}
                       </div>

                       {/* Created By */}
                       <div className="flex items-center gap-2">
                          {task.assignees?.[0] ? (
                             <>
                               <img 
                                 src={task.assignees[0].avatar || "https://ui-avatars.com/api/?name=" + task.assignees[0].username} 
                                 alt="User" 
                                 className="size-5 rounded-full object-cover" 
                               />
                               <span className="text-xs text-slate-400 truncate">{task.assignees[0].username}</span>
                             </>
                          ) : (
                             <span className="text-xs text-slate-600">-</span>
                          )}
                       </div>

                       {/* Created Date */}
                       <div className="text-xs text-slate-400">
                         {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                       </div>

                       {/* Due Date */}
                       <div className={`text-xs ${task.dueDate ? 'text-slate-400' : 'text-slate-600'}`}>
                         {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                       </div>

                       {/* Action */}
                       <div className="flex justify-end transition-opacity">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setPromoteTask(task); }}
                            className="flex items-center gap-1 rounded bg-indigo-600/20 px-2 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/20"
                          >
                             Promote
                          </button>
                       </div>
                     </div>
                   ))}
                   
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Note / Description Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTaskId(null)}>
          <div 
             className="relative w-full max-w-md bg-yellow-100 text-yellow-900 rounded-lg shadow-xl p-6 rotate-1 transform transition-transform hover:rotate-0"
             onClick={e => e.stopPropagation()}
          >
             <button 
               onClick={() => setSelectedTaskId(null)}
               className="absolute top-2 right-2 p-1 hover:bg-yellow-200/50 rounded-full"
             >
               <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
             <h3 className="font-bold text-lg mb-2 pr-6 font-serif">{tasks.find(t => t._id === selectedTaskId)?.title}</h3>
             <div className="text-sm overflow-y-auto max-h-[60vh] whitespace-pre-wrap font-serif leading-relaxed">
               {tasks.find(t => t._id === selectedTaskId)?.description || "No description provided."}
             </div>
             <div className="mt-4 pt-4 border-t border-yellow-200/50 text-xs text-yellow-800/60 flex justify-between">
                <span>Created: {new Date(tasks.find(t => t._id === selectedTaskId)?.createdAt || Date.now()).toLocaleDateString()}</span>
                <span className="cursor-pointer hover:underline" onClick={() => { setSelectedTaskId(null); setPromoteTask(tasks.find(t => t._id === selectedTaskId)); }}>Edit in Board (Promote first)</span>
             </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {promoteTask && (
        <PromoteTaskModal
          isOpen={!!promoteTask}
          onClose={() => setPromoteTask(null)}
          task={promoteTask}
          projectId={projectId}
        />
      )}

      {/* Create Backlog Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Backlog Item">
        <form onSubmit={handleCreateBacklogTask} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
              Title
            </label>
            <input
              type="text"
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="e.g., Update homepage banner"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              Create Issue
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Backlog;
