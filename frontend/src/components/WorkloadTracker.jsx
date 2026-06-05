// Context-aware workload gauge (Sunsama-inspired): sums the time estimates of
// not-yet-done tasks and warns if you've planned more than a realistic 8 hours.

const CAP_MINUTES = 8 * 60;

export default function WorkloadTracker({ tasks }) {
    const open = tasks.filter((t) => t.status !== 'Done');
    const totalMin = open.reduce((sum, t) => sum + (t.estimateMinutes || 0), 0);
    if (totalMin === 0) return null; // nothing estimated yet — stay out of the way

    const hours = totalMin / 60;
    const pct = Math.min(100, (totalMin / CAP_MINUTES) * 100);
    const over = totalMin > CAP_MINUTES;

    return (
        <div className={`workload${over ? ' workload--over' : ''}`} role="status" aria-live="polite">
            <div className="workload__head">
                <span>Planned workload</span>
                <span>{hours.toFixed(1)}h / 8h</span>
            </div>
            <div className="workload__bar" aria-hidden="true">
                <div className="workload__fill" style={{ width: pct + '%' }} />
            </div>
            {over && (
                <p className="workload__warn">
                    Over 8 hours planned — consider moving some tasks to another day.
                </p>
            )}
        </div>
    );
}
