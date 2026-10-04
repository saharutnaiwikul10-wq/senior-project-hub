import { createActor } from "@/backend";
import type {
  CommentInput,
  EvaluationInput,
  FileInput,
  MilestoneInput,
  MilestoneStatus,
  ProjectFilter,
  ProjectId,
  ProjectInput,
  ProjectStatus,
  ProjectUpdate,
  SubTaskInput,
  Timestamp,
  UserRole,
} from "@/backend";
import type { AppRole } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  projects: (filter?: ProjectFilter) => ["projects", filter ?? {}] as const,
  myProjects: ["myProjects"] as const,
  project: (id: ProjectId) => ["project", id.toString()] as const,
  projectProgress: (id: ProjectId) =>
    ["projectProgress", id.toString()] as const,
  projectFiles: (id: ProjectId) => ["projectFiles", id.toString()] as const,
  projectComments: (id: ProjectId) =>
    ["projectComments", id.toString()] as const,
  milestones: (id: ProjectId) => ["milestones", id.toString()] as const,
  milestoneComments: (id: bigint) =>
    ["milestoneComments", id.toString()] as const,
  subTasks: (id: bigint) => ["subTasks", id.toString()] as const,
  evaluations: (id: ProjectId) => ["evaluations", id.toString()] as const,
  scoreSummary: (id: ProjectId) => ["scoreSummary", id.toString()] as const,
  studentDashboard: ["studentDashboard"] as const,
  advisorDashboard: ["advisorDashboard"] as const,
  adminStats: ["adminStats"] as const,
  upcomingDeadlines: ["upcomingDeadlines"] as const,
  userProfiles: ["userProfiles"] as const,
  userProfile: (principal: string) => ["userProfile", principal] as const,
};

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function useProjects(filter: ProjectFilter = {}) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.projects(filter),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyProjects() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.myProjects,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProject(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.project(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return null;
      return actor.getProject(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useProjectProgress(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.projectProgress(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return null;
      return actor.getProjectProgress(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useProjectFiles(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.projectFiles(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return actor.listProjectFiles(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useProjectComments(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.projectComments(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return actor.listProjectComments(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useMilestones(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.milestones(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return actor.listMilestones(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useMilestoneComments(milestoneId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.milestoneComments(milestoneId ?? 0n),
    queryFn: async () => {
      if (!actor || milestoneId === undefined) return [];
      return actor.listMilestoneComments(milestoneId);
    },
    enabled: !!actor && !isFetching && milestoneId !== undefined,
  });
}

export function useSubTasks(milestoneId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.subTasks(milestoneId ?? 0n),
    queryFn: async () => {
      if (!actor || milestoneId === undefined) return [];
      return actor.listSubTasks(milestoneId);
    },
    enabled: !!actor && !isFetching && milestoneId !== undefined,
  });
}

export function useEvaluations(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.evaluations(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return actor.listEvaluations(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useScoreSummary(projectId: ProjectId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.scoreSummary(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === undefined) return null;
      return actor.getScoreSummary(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== undefined,
  });
}

export function useStudentDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getStudentDashboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdvisorDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.advisorDashboard,
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdvisorDashboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdminStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpcomingDeadlines() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.upcomingDeadlines,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingDeadlines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfiles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.userProfiles,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile(principal: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.userProfile(principal ?? ""),
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal as never);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function useCreateProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProject(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.studentDashboard,
      });
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      input,
    }: { projectId: ProjectId; input: ProjectUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProject(projectId, input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project(variables.projectId),
      });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: ProjectId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProject(projectId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProjects });
    },
  });
}

export function useSetProjectStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      status,
    }: { projectId: ProjectId; status: ProjectStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProjectStatus(projectId, status);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project(variables.projectId),
      });
    },
  });
}

export function useCreateMilestone() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MilestoneInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createMilestone(input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.milestones(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectProgress(variables.projectId),
      });
    },
  });
}

export function useUpdateMilestone() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      name,
      dueDate,
      weight,
    }: {
      milestoneId: bigint;
      name: string;
      dueDate: Timestamp;
      weight: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateMilestone(milestoneId, name, dueDate, weight);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });
}

export function useDeleteMilestone() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestoneId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteMilestone(milestoneId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });
}

export function useSetMilestoneStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      status,
    }: { milestoneId: bigint; status: MilestoneStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setMilestoneStatus(milestoneId, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["milestones"] });
      void queryClient.invalidateQueries({ queryKey: ["projectProgress"] });
    },
  });
}

export function useCreateSubTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubTaskInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createSubTask(input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subTasks(variables.milestoneId),
      });
    },
  });
}

export function useSetSubTaskDone() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subTaskId,
      done,
    }: { subTaskId: bigint; done: boolean }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setSubTaskDone(subTaskId, done);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subTasks"] });
    },
  });
}

export function useDeleteSubTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subTaskId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteSubTask(subTaskId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subTasks"] });
    },
  });
}

export function useAddProjectFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FileInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addProjectFile(input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectFiles(variables.projectId),
      });
    },
  });
}

export function useDeleteProjectFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProjectFile(fileId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectFiles"] });
    },
  });
}

export function useSubmitEvaluation() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EvaluationInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.submitEvaluation(input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.evaluations(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.scoreSummary(variables.projectId),
      });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CommentInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addComment(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectComments"] });
      void queryClient.invalidateQueries({ queryKey: ["milestoneComments"] });
    },
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      department,
    }: { displayName: string; department: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveCallerUserProfile(displayName, department);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSetUserRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: string; role: AppRole }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setUserRole(user as never, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: string; role: UserRole }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.assignCallerUserRole(user as never, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}
