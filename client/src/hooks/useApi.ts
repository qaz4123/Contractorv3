import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, tasksService, analyticsService, quotesService, invoicesService, projectsService } from '../services';

// Leads hooks
export function useLeads(params?: any) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsService.getAll(params),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => leadsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useAnalyzeLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leadsService.analyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// Tasks hooks
export function useTasks(params?: any) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksService.getAll(params),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tasksService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
  });
}

// Projects hooks
export function useProjects(params?: any) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsService.getAll(params),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Quotes hooks
export function useQuotes(params?: any) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: () => quotesService.getAll(params),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

// Invoices hooks
export function useInvoices(params?: any) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesService.getAll(params),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoicesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
