import { z } from "zod";

export const MarkerSchema = z.object({
  name: z.string(),                // e.g., "Hemoglobin"
  value: z.number(),
  unit: z.string(),                // e.g., "g/dL"
  refLow: z.number().optional(),   // optional overrides
  refHigh: z.number().optional(),
});

export const PanelSchema = z.object({
  panelName: z.enum(["CBC","CMP","LIPID","A1C","THYROID","VITD","IRON"]),
  markers: z.array(MarkerSchema).min(1),
});

export const SubmissionSchema = z.object({
  patientId: z.string().optional(),     // never stored
  collectedAt: z.string().optional(),   // ISO date
  panels: z.array(PanelSchema).min(1),
});

export type Submission = z.infer<typeof SubmissionSchema>;
export type Panel = z.infer<typeof PanelSchema>;
export type Marker = z.infer<typeof MarkerSchema>;

