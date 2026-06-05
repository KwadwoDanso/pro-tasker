const STATUSES = ['To Do', 'In Progress', 'Done'];

const fmtDate = (d) =>
    new Date(d).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

export default function TaskItem({ task, onUpdate, onDelete }) {
    const statusClass = `status status-${task.status.replace(/\s/g, '-').toLowerCase()}`;
    const hasMeta = task.dueDate || task.estimateMinutes > 0;

    return (
        <div className="task">
            <span className={statusClass}>{task.status}</span>
            <div className="task-main">
                <span className="task-title">{task.title}</span>
                {hasMeta && (
                    <div className="task-meta">
                        {task.dueDate && <span>Due {fmtDate(task.dueDate)}</span>}
                        {task.estimateMinutes > 0 && <span>{(task.estimateMinutes / 60).toFixed(1)}h</span>}
                    </div>
                )}
            </div>
            <select
                value={task.status}
                aria-label="Task status"
                onChange={(e) => onUpdate(task._id, { status: e.target.value })}
            >
                {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <button className="danger" onClick={() => onDelete(task._id)}>Delete</button>
        </div>
    );
}
