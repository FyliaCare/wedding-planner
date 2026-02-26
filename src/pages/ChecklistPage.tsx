import { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import type { TaskStatus, TaskPriority, TaskCategory, Task } from '@/types';

const categoryOptions: TaskCategory[] = [
  'venue', 'catering', 'photography', 'music', 'flowers',
  'attire', 'invitations', 'transportation', 'accommodation', 'legal', 'other',
];

const priorityColors: Record<TaskPriority, string> = {
  high: 'destructive',
  medium: 'warning',
  low: 'success',
};

const statusColors: Record<TaskStatus, string> = {
  'todo': 'secondary',
  'in-progress': 'warning',
  'done': 'success',
};

export default function ChecklistPage() {
  const { wedding } = useAuthStore();
  const { tasks, loadTasks, addTask, updateTask, deleteTask, filter, setFilter, getFilteredTasks } = useTaskStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (wedding?.id) void loadTasks(wedding.id);
  }, [wedding?.id, loadTasks]);

  const filteredTasks = getFilteredTasks();

  const openCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('other');
    setPriority('medium');
    setDueDate('');
    setStatus('todo');
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.due_date || '');
    setStatus(task.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!wedding?.id) {
      alert('Please set up your wedding first! Go to the Dashboard and click "Set Up Your Wedding".');
      return;
    }
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title, description, category, priority, status,
          due_date: dueDate || null,
        });
      } else {
        await addTask({
          wedding_id: wedding.id,
          title, description, category, priority, status,
          due_date: dueDate || null,
          assigned_to: null,
        });
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      'todo': 'in-progress',
      'in-progress': 'done',
      'done': 'todo',
    };
    await updateTask(task.id, { status: nextStatus[task.status] });
  };

  const tasksByStatus = {
    'todo': filteredTasks.filter((t) => t.status === 'todo'),
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress'),
    'done': filteredTasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklist</h1>
          <p className="text-muted-foreground">
            {tasks.filter((t) => t.status === 'done').length} of {tasks.length} tasks complete
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <Select
          value={filter.status}
          onValueChange={(v) => setFilter({ status: v as TaskStatus | 'all' })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.category}
          onValueChange={(v) => setFilter({ category: v as TaskCategory | 'all' })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((statusKey) => (
          <div key={statusKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusColors[statusKey] as 'secondary' | 'warning' | 'success'}>
                {statusKey === 'todo' ? 'To Do' : statusKey === 'in-progress' ? 'In Progress' : 'Done'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({tasksByStatus[statusKey].length})
              </span>
            </div>
            {tasksByStatus[statusKey].length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                  No tasks
                </CardContent>
              </Card>
            ) : (
              tasksByStatus[statusKey].map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => openEdit(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleStatusToggle(task);
                            }}
                            className={`h-4 w-4 rounded-full border-2 transition-colors ${
                              task.status === 'done'
                                ? 'border-emerald-500 bg-emerald-500'
                                : task.status === 'in-progress'
                                ? 'border-amber-500'
                                : 'border-muted-foreground'
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              task.status === 'done' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {task.category}
                          </Badge>
                          <Badge
                            variant={priorityColors[task.priority] as 'destructive' | 'warning' | 'success'}
                            className="text-xs capitalize"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      {task.due_date && (
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Book photographer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              {editingTask && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!window.confirm('Delete this task?')) return;
                  await deleteTask(editingTask.id);
                  setDialogOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSave}>{editingTask ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
