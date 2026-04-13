"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useStore, Employee } from "@/lib/store/useStore";
import { generateInitialEmployees } from "@/lib/mockData";
import {
  Users,
  UserPlus,
  MagnifyingGlass,
  Funnel,
  Briefcase,
  Buildings,
  ClockCounterClockwise,
  SquaresFour,
  ListBullets,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type EmployeeFilter = "all" | Employee["status"];
type EmployeeGroupBy = "none" | "status" | "department" | "role";
type EmployeeViewMode = "grid" | "list";

const STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

const STATUS_GROUP_ORDER: Array<Employee["status"]> = ["active", "invited", "inactive"];

const EMPLOYEE_GROUP_BY_OPTIONS: Array<{ value: EmployeeGroupBy; label: string }> = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "department", label: "Department" },
  { value: "role", label: "Role" },
];

function formatLastActive(timestamp: number) {
  const diffInHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

function getStatusClassName(status: Employee["status"]) {
  if (status === "active") return "bg-status-success/10 text-status-success";
  if (status === "invited") return "bg-status-premium/10 text-status-premium";
  return "bg-canvas text-text-muted";
}

export default function EmployeeHubPage() {
  const { employees, addEmployee, updateEmployee } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<EmployeeGroupBy>("none");
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("grid");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (employees.length === 0) {
      generateInitialEmployees(12).forEach((employee) => addEmployee(employee));
    }
  }, [employees.length, addEmployee]);

  const departmentOptions = useMemo(
    () => [...new Set(employees.map((employee) => employee.department))].sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [employee.name, employee.email, employee.role, employee.department].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesDepartment =
        departmentFilter === "all" || employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  const groupedEmployees = useMemo(() => {
    if (groupBy === "none") {
      return [{ label: "All Members", members: filteredEmployees }];
    }

    if (groupBy === "status") {
      return STATUS_GROUP_ORDER.map((status) => ({
        label: STATUS_LABELS[status],
        members: filteredEmployees.filter((employee) => employee.status === status),
      })).filter((group) => group.members.length > 0);
    }

    const groups = new Map<string, Employee[]>();
    filteredEmployees.forEach((employee) => {
      const key = groupBy === "department" ? employee.department : employee.role;
      const currentGroup = groups.get(key) ?? [];
      currentGroup.push(employee);
      groups.set(key, currentGroup);
    });

    return Array.from(groups.entries())
      .sort(([labelA], [labelB]) => labelA.localeCompare(labelB))
      .map(([label, members]) => ({ label, members }));
  }, [filteredEmployees, groupBy]);

  const activeMembers = employees.filter((employee) => employee.status === "active").length;
  const pendingInvites = employees.filter((employee) => employee.status === "invited").length;
  const hasFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all" || departmentFilter !== "all";

  const inviteMember = () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) return;

    const [namePart] = normalizedEmail.split("@");
    const displayName =
      namePart
        ?.split(/[._-]/g)
        .filter(Boolean)
        .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
        .join(" ") || "New Member";

    addEmployee({
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36),
      name: displayName,
      email: normalizedEmail,
      department: departmentFilter === "all" ? "Operations" : departmentFilter,
      role: "Process Contributor",
      status: "invited",
      assignedProjects: 0,
      lastActiveAt: Date.now(),
    });
    setInviteEmail("");
  };

  const toggleEmployeeStatus = (employee: Employee) => {
    if (employee.status === "invited") {
      updateEmployee(employee.id, { status: "active" });
      return;
    }

    updateEmployee(employee.id, {
      status: employee.status === "active" ? "inactive" : "active",
    });
  };

  return (
    <div className="flex h-full min-h-screen bg-canvas">
      <Sidebar />

      <main className="flex-1 pl-[var(--sidebar-width,16rem)] h-screen overflow-auto custom-scrollbar transition-[padding] duration-200">
        <header className="h-20 border-b border-subtle glass sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Employee Hub</h1>
            <span className="text-xs text-text-muted font-medium">
              Manage members, roles, and SOP ownership across your workspace.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="Invite by email..."
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && inviteMember()}
              className="px-3 py-2 bg-surface border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all w-64 outline-none font-sans text-text-primary"
            />
            <button
              onClick={inviteMember}
              className="bg-brand-primary text-white flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-primary/20"
            >
              <UserPlus size={18} weight="bold" />
              <span>Invite</span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Members", value: employees.length, icon: Users, color: "text-brand-primary" },
              { label: "Active Members", value: activeMembers, icon: Briefcase, color: "text-status-success" },
              { label: "Pending Invites", value: pendingInvites, icon: UserPlus, color: "text-status-premium" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-surface p-4 rounded-2xl border border-subtle flex items-center gap-4 shadow-sm"
              >
                <div className={cn("p-3 rounded-xl bg-canvas border border-subtle", stat.color)}>
                  <stat.icon size={24} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-xl font-bold text-text-primary">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-subtle rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <MagnifyingGlass
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search members..."
                  className="pl-10 pr-4 py-2 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all w-64 outline-none font-sans text-text-primary"
                />
              </div>
              <div className="relative">
                <Funnel
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as EmployeeFilter)}
                  className="pl-10 pr-4 py-2 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none font-sans text-text-primary appearance-none"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="px-3 py-2 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none font-sans text-text-primary appearance-none"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <select
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value as EmployeeGroupBy)}
                className="px-3 py-2 bg-canvas border border-subtle rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none font-sans text-text-primary appearance-none"
              >
                {EMPLOYEE_GROUP_BY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Group by: {option.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-canvas border border-subtle rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors",
                    viewMode === "grid"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <SquaresFour size={14} weight={viewMode === "grid" ? "fill" : "regular"} />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors",
                    viewMode === "list"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <ListBullets size={14} weight={viewMode === "list" ? "fill" : "regular"} />
                  <span>List</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setDepartmentFilter("all");
              }}
              className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
            >
              {hasFilters ? "Clear Filters" : "All Members"}
            </button>
          </div>

          {filteredEmployees.length > 0 ? (
            <div className="space-y-6">
              {groupedEmployees.map((group) => (
                <section key={group.label} className="space-y-3">
                  {groupBy !== "none" && (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                        {group.label}
                      </h3>
                      <span className="text-xs text-text-muted">{group.members.length} members</span>
                    </div>
                  )}

                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {group.members.map((employee) => (
                        <div
                          key={employee.id}
                          className="bg-surface border border-subtle rounded-2xl p-5 space-y-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-bold text-text-primary">{employee.name}</h3>
                              <p className="text-sm text-text-muted">{employee.email}</p>
                            </div>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                getStatusClassName(employee.status)
                              )}
                            >
                              {STATUS_LABELS[employee.status]}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-text-muted">
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} />
                              <span>{employee.role}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Buildings size={14} />
                              <span>{employee.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockCounterClockwise size={14} />
                              <span>{formatLastActive(employee.lastActiveAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-subtle">
                            <span className="text-[11px] font-medium text-text-muted">
                              {employee.assignedProjects} assigned SOPs
                            </span>
                            <button
                              onClick={() => toggleEmployeeStatus(employee)}
                              className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
                            >
                              {employee.status === "active"
                                ? "Deactivate"
                                : employee.status === "invited"
                                  ? "Activate"
                                  : "Reactivate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface border border-subtle rounded-2xl divide-y divide-border-subtle">
                      {group.members.map((employee) => (
                        <div
                          key={employee.id}
                          className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-text-primary truncate">{employee.name}</h3>
                            <p className="text-xs text-text-muted truncate">{employee.email}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-text-muted">{employee.role}</span>
                            <span className="text-text-muted">{employee.department}</span>
                            <span className="text-text-muted">{employee.assignedProjects} SOPs</span>
                            <span className="text-text-muted">{formatLastActive(employee.lastActiveAt)}</span>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                getStatusClassName(employee.status)
                              )}
                            >
                              {STATUS_LABELS[employee.status]}
                            </span>
                            <button
                              onClick={() => toggleEmployeeStatus(employee)}
                              className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
                            >
                              {employee.status === "active"
                                ? "Deactivate"
                                : employee.status === "invited"
                                  ? "Activate"
                                  : "Reactivate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-subtle rounded-2xl p-10 text-center">
              <h3 className="text-lg font-bold text-text-primary tracking-tight">
                No members match your filters
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Adjust the search criteria or reset filters to see all members.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
