"use client"

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AppSettings, DerivedProjectStatus, SOPProject } from "@/lib/store/useStore";
import {
  BuildingOffice,
  Tag,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { deriveProjectProgress, deriveProjectStatus, PHASE_COLOR_MAP, OVERLAY_COLOR_MAP } from "@/lib/store/deriveProjectStatus";

interface ProjectCardProps {
  project: SOPProject;
  settings: AppSettings;
  onClick?: () => void;
}

export function ProjectCard({ project, settings, onClick }: ProjectCardProps) {
  const derived: DerivedProjectStatus = deriveProjectStatus(project);
  const progress = deriveProjectProgress(project, settings);
  const isComplete = derived.primaryPhase === "Complete";
  const phaseColors = PHASE_COLOR_MAP[derived.primaryPhase];

  return (
    <Card
      className="group hover:shadow-md transition-all cursor-pointer border border-subtle ring-0 glass overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
            <BuildingOffice size={20} weight="fill" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              phaseColors.bg,
              phaseColors.text
            )}>
              {isComplete ? <CheckCircle size={12} weight="fill" /> : <Clock size={12} weight="fill" />}
              {derived.primaryPhase}
            </div>
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
        <CardTitle className="text-lg font-bold tracking-tight mt-3 text-text-primary group-hover:text-brand-primary transition-colors">
          {project.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Tag size={14} />
            <span>{project.company} • {project.department}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <Calendar size={14} />
            <span>Last updated 2 days ago</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>Progress</span>
            <span className={cn(isComplete ? "text-status-success" : "text-brand-primary")}>
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className="h-1.5"
          />
        </div>
      </CardContent>

      <CardFooter className="pt-0 border-t border-subtle flex justify-between items-center py-3 bg-transparent">
        <span className="text-[10px] text-text-muted font-medium">
          {project.levels.L4.length} Procedures
        </span>
        <div className="flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
          <span>Manage</span>
          <ArrowRight size={12} weight="bold" />
        </div>
      </CardFooter>
    </Card>
  );
}
