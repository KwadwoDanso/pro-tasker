import { Link } from 'react-router-dom';

export default function ProjectCard({ project, onDelete }) {
    return (
        <div className="card">
            <h3>{project.name}</h3>
            <p>{project.description || 'No description'}</p>
            <div className="card-actions">
                <Link to={`/projects/${project._id}`}>Open</Link>
                <button className="danger" onClick={() => onDelete(project._id)}>Delete</button>
            </div>
        </div>
    );
}