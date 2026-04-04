"use client";

import { useState, useEffect } from "react";
import { TASK_ICONS, isOverdue, formatFrequency } from "@/lib/utils";

type HouseTask = {
  id: number;
  name: string;
  frequency: string;
  icon: string | null;
  lastDone: string | null;
  assignedTo: string | null;
};

export default function MaisonPage() {
  const [tasks, setTasks] = useState<HouseTask[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFrequency, setNewFrequency] = useState("weekly");

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newName.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        frequency: newFrequency,
        icon: "default",
      }),
    });
    setNewName("");
    setShowAdd(false);
    fetchTasks();
  };

  const markDone = async (id: number) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastDone: new Date().toISOString().split("T")[0] }),
    });
    fetchTasks();
  };

  const removeTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const daysSince = (lastDone: string | null) => {
    if (!lastDone) return null;
    const diff = Math.floor(
      (Date.now() - new Date(lastDone).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return `Il y a ${diff} jours`;
  };

  const overdueTasks = tasks.filter((t) => isOverdue(t.lastDone, t.frequency));
  const upToDateTasks = tasks.filter(
    (t) => !isOverdue(t.lastDone, t.frequency)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Gestion maison</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {overdueTasks.length > 0
              ? `${overdueTasks.length} tâche${overdueTasks.length > 1 ? "s" : ""} en retard`
              : "Tout est à jour !"}
          </span>
        </div>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-danger mb-3">A faire</h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-danger/30 rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-2xl">
                  {TASK_ICONS[task.icon || "default"]}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.name}</p>
                  <p className="text-xs text-muted">
                    {formatFrequency(task.frequency)} &middot;{" "}
                    {daysSince(task.lastDone) || "Jamais fait"}
                  </p>
                </div>
                <button
                  onClick={() => markDone(task.id)}
                  className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Fait !
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-muted hover:text-danger text-sm"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Up to date tasks */}
      {upToDateTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-success mb-3">A jour</h2>
          <div className="space-y-2">
            {upToDateTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <span className="text-2xl">
                  {TASK_ICONS[task.icon || "default"]}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.name}</p>
                  <p className="text-xs text-muted">
                    {formatFrequency(task.frequency)} &middot;{" "}
                    {daysSince(task.lastDone) || "Jamais fait"}
                  </p>
                </div>
                <button
                  onClick={() => markDone(task.id)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted hover:border-success hover:text-success"
                >
                  Refait
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-muted hover:text-danger text-sm"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add task */}
      {showAdd ? (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Nom de la tâche"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-muted text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 border border-dashed border-border rounded-xl text-muted hover:border-primary hover:text-primary text-sm"
        >
          + Ajouter une tâche
        </button>
      )}
    </div>
  );
}
