/**
 * Zustand store for Procurement Case state management
 */

import { create } from 'zustand';

export const ProcurementStep = {
  IDLE: 'idle',
  UPLOADED: 'uploaded',
  VALIDATED: 'validated',
  CONVERTED: 'converted',
  SENT_TO_BUYER: 'sent_to_buyer',
  ENRICHED: 'enriched',
  RFQ_SENT: 'rfq_sent',
  QUOTE_RECEIVED: 'quote_received',
  ACCEPTED: 'accepted',
  WRITTEN_BACK: 'written_back',
} as const;

export type ProcurementStep = typeof ProcurementStep[keyof typeof ProcurementStep];

export interface ProcurementCase {
  id: string;
  step: ProcurementStep;
  ifcFile?: File;
  ifcPath?: string;
  ifcCsvData?: any[];
  validationResults?: any;
  catalogueXML?: string;
  enrichedData?: any;
  rfqData?: any;
  quoteData?: any;
  acceptanceData?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcurementStore {
  currentCase: ProcurementCase | null;
  selectedNodeId: string | null;
  setCurrentCase: (case_: ProcurementCase | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateStep: (step: ProcurementStep) => void;
  setIFCFile: (file: File, path: string) => void;
  setIFCCsvData: (data: any[]) => void;
  setValidationResults: (results: any) => void;
  setCatalogueXML: (xml: string) => void;
  setEnrichedData: (data: any) => void;
  setRFQData: (data: any) => void;
  setQuoteData: (data: any) => void;
  setAcceptanceData: (data: any) => void;
  reset: () => void;
}

export const useProcurementStore = create<ProcurementStore>((set) => ({
  currentCase: null,
  selectedNodeId: null,
  
  setCurrentCase: (case_) => set({ currentCase: case_ }),
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  
  updateStep: (step) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      step,
      updatedAt: new Date(),
    } : null,
  })),
  
  setIFCFile: (file, path) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      ifcFile: file,
      ifcPath: path,
      step: ProcurementStep.UPLOADED,
      updatedAt: new Date(),
    } : {
      id: `case_${Date.now()}`,
      step: ProcurementStep.UPLOADED,
      ifcFile: file,
      ifcPath: path,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })),
  
  setIFCCsvData: (data) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      ifcCsvData: data,
      updatedAt: new Date(),
    } : null,
  })),
  
  setValidationResults: (results) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      validationResults: results,
      step: ProcurementStep.VALIDATED,
      updatedAt: new Date(),
    } : null,
  })),
  
  setCatalogueXML: (xml) => set((state) => {
    if (!state.currentCase) return { currentCase: null };
    console.log('setCatalogueXML called, current step:', state.currentCase.step);
    const updated = {
      ...state.currentCase,
      catalogueXML: xml,
      step: ProcurementStep.CONVERTED,
      updatedAt: new Date(),
    };
    console.log('setCatalogueXML updated step to:', updated.step);
    return { currentCase: updated };
  }),
  
  setEnrichedData: (data) => set((state) => {
    if (!state.currentCase) return { currentCase: null };
    return {
      currentCase: {
        ...state.currentCase,
        enrichedData: data,
        step: ProcurementStep.ENRICHED,
        updatedAt: new Date(),
      },
    };
  }),
  
  setRFQData: (data) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      rfqData: data,
      step: ProcurementStep.RFQ_SENT,
      updatedAt: new Date(),
    } : null,
  })),
  
  setQuoteData: (data) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      quoteData: data,
      step: ProcurementStep.QUOTE_RECEIVED,
      updatedAt: new Date(),
    } : null,
  })),
  
  setAcceptanceData: (data) => set((state) => ({
    currentCase: state.currentCase ? {
      ...state.currentCase,
      acceptanceData: data,
      step: ProcurementStep.ACCEPTED,
      updatedAt: new Date(),
    } : null,
  })),
  
  reset: () => set({ currentCase: null }),
}));

