import { useState, useEffect } from 'react';
import api from '../api/api';
import ProjectCard from '../components/ProjectCard';

export default function DashboardPage() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadProjects = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/projects');
            setProjects(data);
        } catch (err) {
            setError('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await api.post('/projects', { name, description });
            setName('');
            setDescription('');
            loadProjects();
        } catch (err) {
            setError('Failed to create project');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            setProjects((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            setError('Failed to delete project');
        }
    };

    return (
        <div>
            <h2>My Projects</h2>

            <form className="inline-form" onSubmit={handleCreate}>
                <input
                    placeholder="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button type="submit">Add Project</button>
            </form>

            {loading && <p>Loading projects...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && projects.length === 0 && (
                <p>No projects yet. Create your first one above.</p>
            )}

            <div className="grid">
                {projects.map((p) => (
                    <ProjectCard key={p._id} project={p} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
}