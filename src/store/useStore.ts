import { create } from 'zustand';
import { BluetoothState, DeviceInfo } from '../services/bluetoothService';
import { SourceChunk } from '../services/ai/retrievalService';
import { Language, translations } from '../i18n/translations';

// Interfaces
export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
}

export interface HealthRecord {
  id: string;
  timestamp: string;
  hemoglobin: number;
  ferritin: number;
  status: 'Normal' | 'Low' | 'High' | 'Critical';
  summary: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  takenDays: { [dateStr: string]: boolean }; // maps YYYY-MM-DD to taken boolean
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: SourceChunk[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface AppState {
  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Authentication
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (name: string, email: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Device pairing
  deviceState: BluetoothState;
  pairedDevice: DeviceInfo | null;
  deviceError: string | null;
  setDeviceState: (state: BluetoothState, device?: DeviceInfo | null, error?: string | null) => void;

  // Health data
  testRecords: HealthRecord[];
  addTestRecord: (hemoglobin: number, ferritin: number) => HealthRecord;
  selectedRecord: HealthRecord | null;
  setSelectedRecord: (record: HealthRecord | null) => void;

  // Medication
  medications: Medication[];
  markMedicationTaken: (id: string, dateStr: string, taken: boolean) => void;
  getWeeklyAdherence: () => number;

  // AI Chat
  chatMessages: ChatMessage[];
  addChatMessage: (sender: 'user' | 'assistant', text: string, citations?: SourceChunk[]) => void;
  clearChat: () => void;

  // App settings
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  theme: 'light'; // Light mode only
}

// Utility to get past date strings
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Seed historical test data
const initialRecords: HealthRecord[] = [
  {
    id: 'rec-4',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), // 2 days ago (latest)
    hemoglobin: 14.2,
    ferritin: 85,
    status: 'Normal',
    summary: 'Optimal iron stores and oxygen capacity. Continue daily adherence.'
  },
  {
    id: 'rec-3',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleString(), // 30 days ago
    hemoglobin: 13.5,
    ferritin: 55,
    status: 'Normal',
    summary: 'Healthy blood levels. Good response to iron supplements.'
  },
  {
    id: 'rec-2',
    timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleString(), // 60 days ago
    hemoglobin: 12.1,
    ferritin: 28,
    status: 'Normal',
    summary: 'Hemoglobin recovering. Iron stores rising but still in low-normal range.'
  },
  {
    id: 'rec-1',
    timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleString(), // 90 days ago (oldest)
    hemoglobin: 11.2,
    ferritin: 12,
    status: 'Low',
    summary: 'Mild anemia detected. Ferritin levels indicate severely depleted iron stores.'
  }
];

// Seed medication checklist
const initialMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Iron (Ferrous Sulfate)',
    dosage: '325 mg (65 mg elemental iron)',
    time: '10:00 AM',
    frequency: 'Daily',
    takenDays: {
      [getPastDateStr(6)]: true,
      [getPastDateStr(5)]: true,
      [getPastDateStr(4)]: true,
      [getPastDateStr(3)]: true,
      [getPastDateStr(2)]: true,
      [getPastDateStr(1)]: true,
      [getPastDateStr(0)]: true
    }
  }
];

export const useStore = create<AppState>((set, get) => ({
  // Toasts
  toasts: [],
  addToast: (message, type) => {
    const id = `toast-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Authentication
  user: {
    name: 'Reemas Hamad',
    email: 'reemas.hamad@example.com',
    age: 26,
    gender: 'Female',
    phone: '+966 50 123 4567'
  },
  isAuthenticated: true, // Default to true for premium demo, can toggle to false on logout

  login: (name, email) => set({
    user: { name, email, age: 28, gender: 'Female', phone: '' },
    isAuthenticated: true
  }),

  signup: (name, email) => set({
    user: { name, email, age: 28, gender: 'Female', phone: '' },
    isAuthenticated: true
  }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    pairedDevice: null,
    deviceState: 'Disconnected'
  }),

  updateProfile: (profile) => set((state) => ({
    user: state.user ? { ...state.user, ...profile } : null
  })),

  // Device status
  deviceState: 'Disconnected',
  pairedDevice: null,
  deviceError: null,

  setDeviceState: (state, device = null, error = null) => set({
    deviceState: state,
    pairedDevice: device,
    deviceError: error
  }),

  // Health data
  testRecords: initialRecords,

  addTestRecord: (hemoglobin, ferritin) => {
    let status: 'Normal' | 'Low' | 'High' | 'Critical' = 'Normal';
    let summary = 'Optimal blood metrics observed.';

    if (hemoglobin < 10.0 || ferritin < 8) {
      status = 'Critical';
      summary = 'Critically low blood levels detected. Immediate clinical assessment recommended.';
    } else if (hemoglobin < 12.0 || ferritin < 15) {
      status = 'Low';
      summary = 'Iron levels or hemoglobin are below reference ranges, indicating iron depletion.';
    }

    const newRecord: HealthRecord = {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      hemoglobin,
      ferritin,
      status,
      summary
    };

    set((state) => ({
      testRecords: [newRecord, ...state.testRecords],
      selectedRecord: newRecord
    }));

    return newRecord;
  },

  selectedRecord: initialRecords[initialRecords.length - 1],
  setSelectedRecord: (record) => set({ selectedRecord: record }),

  // Medication
  medications: initialMedications,

  markMedicationTaken: (id, dateStr, taken) => set((state) => {
    const updated = state.medications.map(med => {
      if (med.id === id) {
        return {
          ...med,
          takenDays: {
            ...med.takenDays,
            [dateStr]: taken
          }
        };
      }
      return med;
    });
    return { medications: updated };
  }),

  getWeeklyAdherence: () => {
    const meds = get().medications;
    if (meds.length === 0) return 100;
    
    let totalScheduled = 0;
    let totalTaken = 0;
    
    // Check past 7 days (including today)
    for (let i = 0; i < 7; i++) {
      const dateStr = getPastDateStr(i);
      meds.forEach(med => {
        totalScheduled++;
        if (med.takenDays[dateStr] === true) {
          totalTaken++;
        }
      });
    }
    
    if (totalScheduled === 0) return 100;
    return Math.round((totalTaken / totalScheduled) * 100);
  },

  // AI Chat
  chatMessages: [
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your Hemafy AI Assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],

  addChatMessage: (sender, text, citations = []) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        id: `msg-${Date.now()}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations
      }
    ]
  })),

  clearChat: () => set({
    chatMessages: [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hello! I am your Hemafy AI Assistant. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  }),

  // App settings
  language: 'ar', // Default to Arabic or English
  setLanguage: (lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    set({ language: lang });
  },
  t: (key) => {
    const lang = get().language || 'ar';
    return translations[lang][key] || translations.en[key] || (key as string);
  },
  notificationsEnabled: true,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  theme: 'light'
}));
