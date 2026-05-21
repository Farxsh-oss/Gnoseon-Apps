import { create } from 'zustand';
import { Contact } from '../types';

interface ContactsState {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  addContact: (contact: Contact) => void;
  removeContact: (contactId: string) => void;
  clearContacts: () => void;
}

export const useContactsStore = create<ContactsState>((set: any) => ({
  contacts: [],

  setContacts: (contacts: Contact[]) => set({ contacts }),

  updateContact: (contactId: string, updates: Partial<Contact>) =>
    set((state: ContactsState) => ({
      contacts: state.contacts.map(contact =>
        contact.id === contactId ? { ...contact, ...updates } : contact
      )
    })),

  addContact: (contact: Contact) =>
    set((state: ContactsState) => ({
      contacts: [...state.contacts, contact]
    })),

  removeContact: (contactId: string) =>
    set((state: ContactsState) => ({
      contacts: state.contacts.filter(contact => contact.id !== contactId)
    })),

  clearContacts: () => set({ contacts: [] }),
}));
