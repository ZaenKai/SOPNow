"use client";

import { useEffect } from "react";
import { generateInitialEmployees, generateInitialProjects } from "@/lib/mockData";
import { useStore } from "@/lib/store/useStore";

export function useSeedData() {
  const { projects, employees, seedBulkData } = useStore();

  useEffect(() => {
    const needsProjects = projects.length === 0;
    const needsEmployees = employees.length === 0;
    if (needsProjects || needsEmployees) {
      seedBulkData(
        needsProjects ? generateInitialProjects() : [],
        needsEmployees ? generateInitialEmployees(12) : []
      );
    }
  }, [projects.length, employees.length, seedBulkData]);
}
