"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingOffice,
  ChartBar,
  Clock,
  FileText,
  Funnel,
  ListBullets,
  MagnifyingGlass,
  Plus,
  SquaresFour,
} from "@phosphor-icons/react";
import { Sidebar } from "@/components/Sidebar";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectWizard } from "@/components/ProjectWizard";
import { Progress } from "@/components/ui/progress";
import { useSeedData } from "@/lib/store/useSeedData";
import { PROJECT_PRIMARY_PHASES, ProjectPrimaryPhase, SOPProject, useStore } from "@/lib/store/useStore";
import { cn } from "@/lib/utils";
import { deriveProjectProgress, deriveProjectStatus, PHASE_COLOR_MAP, OVERLAY_COLOR_MAP } from "@/lib/store/deriveProjectStatus";

type DashboardFilter = "all" | ProjectPrimaryPhase;
type DashboardGroupBy = "none" | "phase" | "department" | "company";

interface ProjectListItemProps {
  project: SOPProject;
  onClick: () => void;
}

function ProjectListItem({ project, onClick }: ProjectListItemProps) {
  const { settings } = useStore();
  const derived = deriveProjectStatus(project);
  const progress = deriveProjectProgress(project, settings);
  const phaseColors = PHASE_COLOR_MAP[derived.primaryPhase];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-subtle rounded-xl p-4 transition-colors hover:bg-canvas"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <BuildingOffice size={16} weight="fill" />
            </div>
            <h3 className="text-sm font-bold text-text-primary truncate">{project.name}</h3>
          </div>
          <p className="mt-2 text-xs text-text-muted truncate">
            {project.company} • {project.department}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              phaseColors.bg,
              phaseColors.text
            )}
          >
            {derived.primaryPhase}
          </span>
          {derived.overlays.map((overlay) => {
            const colors = OVERLAY_COLOR_MAP[overlay];
            return (
              <span
                key={overlay}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  colors.bg,
                  colors.text
                )}
              >
                {overlay}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-xs font-bold text-brand-primary shrink-0">{progress}%</span>
      </div>
    </button>
  );
}

export default function ProjectsPage() {
  useSeedData();

  const router = useRouter();
  const {
    projects,
    settings,
    projectsDashboardState,
    updateProjectDashboardState,
    setProjectScrollTop,
    setCurrentProject,
  } = useStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = projectsDashboardState.scrollTop;
  }, [projectsDashboardState.scrollTop]);

  const departmentOptions = useMemo(
    () => [...new Set(projects.map((project) => project.department))].sort(),
    [projects]
  );

  const projectPhaseMap = useMemo(
    () => new Map(projects.map((p) => [p.id, deriveProjectStatus(p)])),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectsDashboardState.searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [project.name, project.company, project.department].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      const matchesPhase =
        projectsDashboardState.statusFilter === "all" ||
        projectPhaseMap.get(project.id)?.primaryPhase === projectsDashboardState.statusFilter;
      const matchesDepartment =
        projectsDashboardState.departmentFilter === "all" ||
        project.department === projectsDashboardState.departmentFilter;
      return matchesSearch && matchesPhase && matchesDepartment;
    });
  }, [projects, projectsDashboardState, projectPhaseMap]);

  const groupedProjects = useMemo(() => {
    if (projectsDashboardState.groupBy === "none") {
      return [{ label: "All Projects", projects: filteredProjects }];
    }

    if (projectsDashboardState.groupBy === "phase") {
      return PROJECT_PRIMARY_PHASES.map((phase) => ({
        label: phase,
        projects: filteredProjects.filter(
          (project) => projectPhaseMap.get(project.id)?.primaryPhase === phase
        ),
      })).filter((group) => group.projects.length > 0);
    }

    const map = new Map<string, SOPProject[]>();
    filteredProjects.forEach((project) => {
      const key =
        projectsDashboardState.groupBy === "department" ? project.department : project.company;
      map.set(key, [...(map.get(key) ?? []), project]);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, grouped]) => ({ label, projects: grouped }));
  }, [filteredProjects, projectsDashboardState.groupBy, projectPhaseMap]);

  const completeCount = projects.filter(
    (p) => projectPhaseMap.get(p.id)?.primaryPhase === "Complete"
  ).length;
  const completionRate =
    projects.length === 0 ? 0 : Math.round((completeCount / projects.length) * 100);
  const pendingPhases = projects.filter((p) => {
    const phase = projectPhaseMap.get(p.id)?.primaryPhase;
    return phase === "Analysis Validation" || phase === "Ready to Close";
  }).length;
  const estimatedTimeSaved = projects.reduce(
    (totalHours, project) => totalHours + Math.round((deriveProjectProgress(project, settings) / 100) * 18),
    0
  );
  const hasFilters =
    projectsDashboardState.searchQuery.trim().length > 0 ||
    projectsDashboardState.statusFilter !== "all" ||
    projectsDashboardState.departmentFilter !== "all";

  const updateDashboardState = (updates: Partial<typeof projectsDashboardState>) =>
    updateProjectDashboardState(updates);

  const openProject = (projectId: string) => {
    setCurrentProject(projectId);
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar onNewProject={() => setIsWizardOpen(true)} />
      <main
        className="flex-1 pl-[var(--sidebar-width,16rem)] h-screen overflow-auto custom-scrollbar transition-[padding] duration-200"
        ref={(node) => {
          scrollContainerRef.current = node;
        }}
        onScroll={(event) => setProjectScrollTop(event.currentTarget.scrollTop)}
      >
        <ProjectWizard
          open={isWizardOpen}
          onOpenChange={setIsWizardOpen}
          onProjectCreated={(projectId) => {
            setCurrentProject(projectId);
            router.push(`/projects/${projectId}/setup`);
          }}
        />

        <header className="h-20 border-b border-subtle glass sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Projects</h1>
            <span className="text-xs text-text-muted font-medium">
              {hasFilters
                ? `Showing ${filteredProjects.length} of ${projects.length} SOP projects.`
                : `You have ${projects.length} active SOP projects.`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors"
              />
              <input
                type="text"
                value={projectsDashboardState.searchQuery}
                onChange={(event) => updateDashboardState({ searchQuery: event.target.value })}
                placeholder="Search SOPs..."
                className="pl-10 pr-4 py-2 bg-surface border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all w-64 outline-none font-sans text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div className="relative">
              <Funnel
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <select
                value={projectsDashboardState.statusFilter}
                onChange={(event) =>
                  updateDashboardState({ statusFilter: event.target.value as DashboardFilter })
                }
                className="pl-10 pr-4 py-2 bg-surface border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all w-52 outline-none font-sans text-text-primary appearance-none"
              >
                <option value="all">All phases</option>
                {PROJECT_PRIMARY_PHASES.map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>

            <select
              value={projectsDashboardState.departmentFilter}
              onChange={(event) => updateDashboardState({ departmentFilter: event.target.value })}
              className="px-3 py-2 bg-surface border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all w-44 outline-none font-sans text-text-primary appearance-none"
            >
              <option value="all">All departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="bg-brand-primary text-white flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-primary/20"
            >
              <Plus size={18} weight="bold" />
              <span>New SOP</span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Active SOPs", value: filteredProjects.length, icon: FileText, color: "text-brand-primary" },
              { label: "Completion Rate", value: `${completionRate}%`, icon: ChartBar, color: "text-status-success" },
              { label: "Pending Validation", value: pendingPhases, icon: Clock, color: "text-status-premium" },
              { label: "Time Saved", value: `${estimatedTimeSaved}h`, icon: ChartBar, color: "text-brand-secondary" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface p-4 rounded-2xl border border-subtle flex items-center gap-4 shadow-sm"
              >
                <div className={cn("p-3 rounded-xl bg-canvas border border-subtle", stat.color)}>
                  <stat.icon size={24} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</span>
                  <span className="text-xl font-bold text-text-primary">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight">Active Projects</h2>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={projectsDashboardState.groupBy}
                  onChange={(event) =>
                    updateDashboardState({ groupBy: event.target.value as DashboardGroupBy })
                  }
                  className="px-3 py-2 bg-surface border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none font-sans text-text-primary appearance-none"
                >
                  <option value="none">Group by: No grouping</option>
                  <option value="phase">Group by: Phase</option>
                  <option value="department">Group by: Department</option>
                  <option value="company">Group by: Company</option>
                </select>

                <div className="flex items-center bg-surface border border-subtle rounded-lg p-1 gap-1">
                  <button
                    onClick={() => updateDashboardState({ viewMode: "grid" })}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors",
                      projectsDashboardState.viewMode === "grid"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <SquaresFour size={14} weight={projectsDashboardState.viewMode === "grid" ? "fill" : "regular"} />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => updateDashboardState({ viewMode: "list" })}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors",
                      projectsDashboardState.viewMode === "list"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <ListBullets size={14} weight={projectsDashboardState.viewMode === "list" ? "fill" : "regular"} />
                    <span>List</span>
                  </button>
                </div>

                <button
                  className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
                  onClick={() =>
                    updateDashboardState({
                      searchQuery: "",
                      statusFilter: "all",
                      departmentFilter: "all",
                    })
                  }
                >
                  {hasFilters ? "Clear Filters" : "View All Projects"}
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-surface border border-subtle rounded-2xl p-10 text-center">
                <h3 className="text-lg font-bold text-text-primary tracking-tight">
                  No SOPs match your filters
                </h3>
                <p className="mt-2 text-sm text-text-muted">
                  Try widening your search or clearing one of the active filters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedProjects.map((group) => (
                  <section key={group.label} className="space-y-3">
                    {projectsDashboardState.groupBy !== "none" && (
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                          {group.label}
                        </h3>
                        <span className="text-xs text-text-muted">{group.projects.length} projects</span>
                      </div>
                    )}

                    {projectsDashboardState.viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {group.projects.map((project) => (
                          <ProjectCard key={project.id} project={project} settings={settings} onClick={() => openProject(project.id)} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {group.projects.map((project) => (
                          <ProjectListItem key={project.id} project={project} onClick={() => openProject(project.id)} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
