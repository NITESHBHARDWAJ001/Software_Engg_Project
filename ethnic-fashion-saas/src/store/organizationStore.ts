import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '../types';

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
}

interface OrganizationActions {
  setCurrentOrganization: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  updateOrganization: (org: Partial<Organization>) => void;
  clearOrganization: () => void;
}

type OrganizationStore = OrganizationState & OrganizationActions;

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      currentOrganization: null,
      organizations: [],

      setCurrentOrganization: (org) => {
        set({ currentOrganization: org });
      },

      setOrganizations: (orgs) => {
        set({ organizations: orgs });
      },

      updateOrganization: (updatedOrg) => {
        set((state) => ({
          currentOrganization: state.currentOrganization
            ? { ...state.currentOrganization, ...updatedOrg }
            : null,
        }));
      },

      clearOrganization: () => {
        set({
          currentOrganization: null,
          organizations: [],
        });
      },
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);

// Selectors
export const selectCurrentOrganization = (state: OrganizationStore) =>
  state.currentOrganization;
export const selectOrganizations = (state: OrganizationStore) => state.organizations;

// Helper hooks
export function useCurrentOrganization() {
  return useOrganizationStore(selectCurrentOrganization);
}

export function useOrganizations() {
  return useOrganizationStore(selectOrganizations);
}
