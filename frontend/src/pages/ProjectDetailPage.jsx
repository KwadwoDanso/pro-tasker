import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import TaskItem from '../components/TaskItem';
import WorkloadTracker from '../components/WorkloadTracker';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [estimate, setEstimate] = useState('');
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const projectRes = await api.get(`/projects/${id}`);
            const tasksRes = await api.get(`/projects/${id}/tasks`);
            setProject(projectRes.data);
            setEditName(projectRes.data.name);
            setEditDesc(projectRes.data.description || '');
            setTasks(tasksRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const handleSaveProject = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/projects/${id}`, { name: editName, description: editDesc });
            setProject(data);
            setEditing(false);
        } catch (err) {
            setError('Failed to update project');
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            const body = { title };
            if (dueDate) body.dueDate = dueDate;
            if (estimate) body.estimateMinutes = Number(estimate) || 0;
            const { data } = await api.post(`/projects/${id}/tasks`, body);
            setTasks((prev) => [data, ...prev]);
            setTitle('');
            setDueDate('');
            setEstimate('');
            setShowDetails(false);
        } catch (err) {
            setError('Failed to add task');
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const { data } = await api.put(`/tasks/${taskId}`, updates);
            setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
        } catch (err) {
            setError('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error && !project) return <p className="error" role="alert">{error}</p>;
    if (!project) return null;

    return (
        <div>
            <button className="link-btn" onClick={() => navigate('/')}>&larr; Back to dashboard</button>

            {editing ? (
                <form className="inline-form" onSubmit={handleSaveProject}>
                    <input value={editName} aria-label="Project name" onChange={(e) => setEditName(e.target.value)} required />
                    <input value={editDesc} aria-label="Project description" onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                    <button type="submit">Save</button>
                    <button type="button" className="link-btn" onClick={() => setEditing(false)}>Cancel</button>
                </form>
            ) : (
                <>
                    <h2>{project.name}</h2>
                    <p>{project.description || 'No description'}</p>
                    <button className="link-btn" onClick={() => setEditing(true)}>Edit project</button>
                </>
            )}

            {error && project && <p className="error" role="alert">{error}</p>}

            <h3 style={{ marginTop: 22 }}>Tasks</h3>

            <WorkloadTracker tasks={tasks} />

            <form className="inline-form task-form" onSubmit={handleAddTask}>
                <input
                    placeholder="New task title"
                    aria-label="New task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <button
                    type="button"
                    className="link-btn"
                    aria-expanded={showDetails}
                    onClick={() => setShowDetails((s) => !s)}
                >
                    {showDetails ? 'Hide details' : 'Add date & time'}
                </button>
                <button type="submit">Add Task</button>

                {showDetails && (
                    <div className="task-details">
                        <label className="field">
                            <span>Due date &amp; time</span>
                            <input
                                type="datetime-local"
                                aria-label="Due date and time"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </label>
                        <label className="field">
                            <span>Estimate (minutes)</span>
                            <input
                                type="number"
                                min="0"
                                step="15"
                                placeholder="e.g. 90"
                                aria-label="Time estimate in minutes"
                                value={estimate}
                                onChange={(e) => setEstimate(e.target.value)}
                            />
                        </label>
                    </div>
                )}
            </form>

            {tasks.length === 0 && <p>No tasks yet.</p>}
            {tasks.map((t) => (
                <TaskItem key={t._id} task={t} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
            ))}
        </div>
    );
}
