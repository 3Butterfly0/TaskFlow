import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetTasksByProjectQuery, useCreateTaskMutation, useUpdateTaskMutation } from "../features/tasks/taskApi";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import { 
  Loader, 
  Map, 
  Plus, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown,
  Layout,
  ArrowRight,
  Users // Add this import
} from "lucide-react";
import TaskDetails from "../features/tasks/TaskDetails";

const Backlog = () => {
  const { projectId } = useParams();
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const { data: tasksData, isLoading } = useGetTasksByProjectQuery(projectId);
  
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  const project = projectData?.data;
  const tasks = tasksData?.data || [];

  const [isSprintOpen, setIsSprintOpen] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Group tasks
  const { boardTasks, backlogTasks } = useMemo(() => {
    const board = [];
    const backlog = [];
    tasks.forEach(t => {
      if (t.isInBacklog) backlog.push(t);
      else board.push(t);
    });
    return { boardTasks: board, backlogTasks: backlog };
  }, [tasks]);

  const handleCreateBacklogTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // Find first column for default creation (even if in backlog, we need a columnId reference or we just use a placeholder?)
    // The model requires columnId. Let's use the first column.
    const firstColId = project?.columns?.[0]?.id;
    if (!firstColId) return;

    try {
      await createTask({
        title: newTaskTitle.trim(),
        projectId,
        columnId: firstColId,
        isInBacklog: true, // Specific flag for backlog
        priority: "medium"
      }).unwrap();
      setNewTaskTitle("");
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleMoveToBoard = async (task) => {
    await updateTask({ id: task._id, isInBacklog: false });
  };

  const handleMoveToBacklog = async (task) => {
    await updateTask({ id: task._id, isInBacklog: true });
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-slate-500" /></div>;
  if (!project) return <div className="text-center p-10 text-slate-500">Project not found</div>;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
        <div>
           <div className="text-sm text-slate-500 mb-1">
             <Link to={`/projects/${projectId}/board`} className="hover:text-indigo-400 decoration-none">Projects</Link> / {project.name}
           </div>
           <h1 className="text-2xl font-bold text-white">Backlog</h1>
        </div>
        <Link 
          to={`/projects/${projectId}/board`} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium"
        >
          <Layout className="size-4" /> Go to Board
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
        
        {/* ── Active Sprint / Board Section ──────────────── */}
        <div className="mb-8">
          <div 
            className="flex items-center gap-2 mb-3 cursor-pointer group"
            onClick={() => setIsSprintOpen(!isSprintOpen)}
          >
            <div className="p-1 rounded hover:bg-slate-800 text-slate-400">
              {isSprintOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
            <h2 className="text-lg font-semibold text-white">Board <span className="text-slate-500 text-sm font-normal ml-2">({boardTasks.length} issues)</span></h2>
            <div className="flex-1 border-b border-slate-800 ml-4 group-hover:border-slate-700 transition-colors" />
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded disabled:opacity-50">
              Complete Sprint
            </button>
          </div>

          {isSprintOpen && (
             <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden">
               {boardTasks.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 text-sm border-dashed border-2 border-slate-800 m-4 rounded">
                   Drag items here from backlog to start working on them.
                 </div>
               ) : (
                 <div className="divide-y divide-slate-800">
                   {boardTasks.map(task => (
                     <div 
                        key={task._id} 
                        className="group flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
                     >
                       <div className="flex items-center gap-3">
                         <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700">
                             {project.columns?.find(c => c.id === task.columnId)?.title || "Unknown"}
                           </span>
                       </div>
                       <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMoveToBacklog(task); }}
                            className="text-xs text-slate-500 hover:text-white"
                          >
                             Move to Backlog
                          </button>
                          {task.assignees?.[0] ? (
                            <img 
                              src={task.assignees[0].avatar || "https://ui-avatars.com/api/?name=" + task.assignees[0].username} 
                              alt="Assignee" 
                              className="size-6 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                              <Users className="size-3" />
                            </div>
                          )}
                          <span className="text-xs font-mono text-slate-600">#{task._id.slice(-4)}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          )}
        </div>


        {/* ── Backlog Section ────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="p-1 text-slate-400"><ChevronDown className="size-4" /></div>
             <h2 className="text-lg font-semibold text-white">Backlog <span className="text-slate-500 text-sm font-normal ml-2">({backlogTasks.length} issues)</span></h2>
             <div className="flex-1 border-b border-slate-800 ml-4" />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden min-h-[200px]">
              <div className="divide-y divide-slate-800">
                {backlogTasks.map(task => (
                  <div 
                     key={task._id} 
                     className="group flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
                     onClick={() => setSelectedTaskId(task._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-4 rounded-sm border-2 ${
                        task.priority === 'high' ? 'border-red-500 bg-red-500/20' : 
                        task.priority === 'medium' ? 'border-amber-500 bg-amber-500/20' : 
                        'border-blue-500 bg-blue-500/20'
                      }`} />
                      <span 
                        className="text-slate-200 font-medium cursor-pointer hover:underline hover:text-indigo-400"
                        onClick={() => setSelectedTaskId(task._id)}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleMoveToBoard(task); }}
                         className="text-xs text-slate-500 hover:text-indigo-400 font-medium flex items-center gap-1"
                       >
                          To Board <ArrowRight className="size-3" />
                       </button>
                       {task.assignees?.[0] ? (
                            <img 
                              src={task.assignees[0].avatar || "https://ui-avatars.com/api/?name=" + task.assignees[0].username} 
                              alt="Assignee" 
                              className="size-6 rounded-full object-cover" 
                            />
                        ) : (
                            <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                              <Users className="size-3" />
                            </div>
                        )}
                       <span className="text-xs font-mono text-slate-600">#{task._id.slice(-4)}</span>
                    </div>
                  </div>
                ))}
                
                {/* Quick Create */}
                <form onSubmit={handleCreateBacklogTask} className="p-0 border-t border-slate-800/50">
                   <div className="relative">
                      <Plus className="absolute left-3 top-3 size-4 text-slate-500" />
                      <input
                        className="w-full bg-transparent p-3 pl-10 text-sm text-white placeholder-slate-500 outline-none hover:bg-slate-800/30 focus:bg-slate-800/50 transition-colors"
                        placeholder="Create issue"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                   </div>
                </form>
             </div>
          </div>
        </div>

      </div>
      
      <TaskDetails
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        projectMembers={project.members || []}
      />
    </div>
  );
};

export default Backlog;
