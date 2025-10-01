import { Submission, Panel, Marker } from '../schemas';
import { getReferenceRange } from './ranges';

export type MarkerStatus = "CRITICAL_LOW" | "LOW" | "NORMAL" | "HIGH" | "CRITICAL_HIGH";
export type OverallSeverity = "OK" | "MILD" | "MODERATE" | "SEVERE";

export interface MarkerFinding {
  marker: string;
  value: number;
  unit: string;
  status: MarkerStatus;
  note: string;
  refLow?: number;
  refHigh?: number;
}

export interface PanelFinding {
  panelName: string;
  findings: MarkerFinding[];
  summary?: string;
}

export interface AnalysisResult {
  overallSeverity: OverallSeverity;
  summaryBullets: string[];
  panelFindings: PanelFinding[];
}

export function classify(value: number, refLow: number, refHigh: number, criticalLow?: number, criticalHigh?: number): MarkerStatus {
  // Check critical ranges first (>20% beyond bounds)
  if (criticalLow !== undefined && value <= criticalLow) {
    return "CRITICAL_LOW";
  }
  if (criticalHigh !== undefined && value >= criticalHigh) {
    return "CRITICAL_HIGH";
  }
  
  // Check normal ranges
  if (value < refLow) {
    return "LOW";
  }
  if (value > refHigh) {
    return "HIGH";
  }
  
  return "NORMAL";
}

function analyzeMarker(marker: Marker): MarkerFinding {
  const refRange = getReferenceRange(marker.name);
  
  const refLow = marker.refLow ?? refRange?.low ?? 0;
  const refHigh = marker.refHigh ?? refRange?.high ?? 999999;
  const criticalLow = refRange?.criticalLow;
  const criticalHigh = refRange?.criticalHigh;
  
  const status = classify(marker.value, refLow, refHigh, criticalLow, criticalHigh);
  
  let note = "";
  switch (status) {
    case "CRITICAL_LOW":
      note = `Critically low - significantly below reference range (${refLow}-${refHigh} ${marker.unit})`;
      break;
    case "LOW":
      note = `Below reference range (${refLow}-${refHigh} ${marker.unit})`;
      break;
    case "NORMAL":
      note = `Within normal range (${refLow}-${refHigh} ${marker.unit})`;
      break;
    case "HIGH":
      note = `Above reference range (${refLow}-${refHigh} ${marker.unit})`;
      break;
    case "CRITICAL_HIGH":
      note = `Critically high - significantly above reference range (${refLow}-${refHigh} ${marker.unit})`;
      break;
  }
  
  return {
    marker: marker.name,
    value: marker.value,
    unit: marker.unit,
    status,
    note,
    refLow,
    refHigh,
  };
}

function analyzePanel(panel: Panel): PanelFinding {
  const findings = panel.markers.map(analyzeMarker);
  let summary = "";
  
  // Panel-specific derived checks
  switch (panel.panelName) {
    case "CMP":
      summary = analyzeCMP(findings, panel.markers);
      break;
    case "A1C":
      summary = analyzeA1C(findings, panel.markers);
      break;
    case "LIPID":
      summary = analyzeLipid(findings, panel.markers);
      break;
    case "THYROID":
      summary = analyzeThyroid(findings, panel.markers);
      break;
    case "IRON":
      summary = analyzeIron(findings, panel.markers);
      break;
    case "VITD":
      summary = analyzeVitaminD(findings, panel.markers);
      break;
    case "CBC":
      summary = analyzeCBC(findings);
      break;
  }
  
  return {
    panelName: panel.panelName,
    findings,
    summary,
  };
}

function analyzeCMP(findings: MarkerFinding[], markers: Marker[]): string {
  const bun = markers.find(m => m.name === "BUN");
  const creatinine = markers.find(m => m.name === "Creatinine");
  
  if (bun && creatinine && creatinine.value > 0) {
    const ratio = bun.value / creatinine.value;
    if (ratio > 20) {
      return "Elevated BUN/Creatinine ratio may suggest dehydration or catabolic state.";
    }
  }
  
  const abnormals = findings.filter(f => f.status !== "NORMAL");
  if (abnormals.length === 0) {
    return "All metabolic markers within normal ranges.";
  }
  
  return `${abnormals.length} marker(s) outside normal range.`;
}

function analyzeA1C(findings: MarkerFinding[], markers: Marker[]): string {
  const a1c = markers.find(m => m.name === "A1c" || m.name === "Hemoglobin A1c");
  
  if (a1c) {
    if (a1c.value >= 6.5) {
      return "A1c level meets diabetes diagnostic criteria (≥6.5%). Consult healthcare provider for diagnosis.";
    } else if (a1c.value >= 5.7) {
      return "A1c level in prediabetes range (5.7-6.4%). Consider lifestyle modifications.";
    } else {
      return "A1c level within normal range (<5.7%).";
    }
  }
  
  return "A1c analysis complete.";
}

function analyzeLipid(findings: MarkerFinding[], markers: Marker[]): string {
  const ldl = markers.find(m => m.name === "LDL");
  const hdl = markers.find(m => m.name === "HDL");
  const trig = markers.find(m => m.name === "Triglycerides");
  
  const issues: string[] = [];
  
  if (ldl && ldl.value > 100) {
    issues.push("elevated LDL");
  }
  if (hdl && hdl.value < 50) {
    issues.push("low HDL");
  }
  if (trig && trig.value > 150) {
    issues.push("elevated triglycerides");
  }
  
  if (issues.length > 0) {
    return `Lipid profile shows ${issues.join(", ")}. Consider dietary and lifestyle modifications.`;
  }
  
  return "Lipid profile within optimal ranges.";
}

function analyzeThyroid(findings: MarkerFinding[], markers: Marker[]): string {
  const tsh = markers.find(m => m.name === "TSH");
  const ft4 = markers.find(m => m.name === "Free T4" || m.name === "FT4");
  
  if (tsh && ft4) {
    if (tsh.value > 4.0 && ft4.value < 0.8) {
      return "Pattern consistent with hypothyroid physiology (high TSH, low FT4).";
    } else if (tsh.value < 0.4 && ft4.value > 1.8) {
      return "Pattern consistent with hyperthyroid physiology (low TSH, high FT4).";
    } else if (tsh.value > 4.0) {
      return "Elevated TSH may suggest subclinical hypothyroidism.";
    } else if (tsh.value < 0.4) {
      return "Low TSH may suggest subclinical hyperthyroidism.";
    }
  }
  
  return "Thyroid markers reviewed.";
}

function analyzeIron(findings: MarkerFinding[], markers: Marker[]): string {
  const ferritin = markers.find(m => m.name === "Ferritin");
  const transferrinSat = markers.find(m => m.name === "Transferrin Saturation" || m.name === "Transferrin Sat");
  
  if (ferritin && ferritin.value < 30) {
    if (transferrinSat && transferrinSat.value < 20) {
      return "Pattern suggests iron deficiency (low ferritin and transferrin saturation).";
    }
    return "Low ferritin may indicate depleted iron stores.";
  }
  
  return "Iron panel reviewed.";
}

function analyzeVitaminD(findings: MarkerFinding[], markers: Marker[]): string {
  const vitD = markers.find(m => m.name === "Vitamin D 25-OH" || m.name === "Vitamin D");
  
  if (vitD) {
    if (vitD.value < 20) {
      return "Vitamin D deficiency detected. Supplementation may be beneficial.";
    } else if (vitD.value < 30) {
      return "Vitamin D level is insufficient. Consider supplementation.";
    } else {
      return "Vitamin D level is sufficient.";
    }
  }
  
  return "Vitamin D reviewed.";
}

function analyzeCBC(findings: MarkerFinding[]): string {
  const abnormals = findings.filter(f => f.status !== "NORMAL");
  
  if (abnormals.length === 0) {
    return "All blood cell counts within normal ranges.";
  }
  
  return `${abnormals.length} marker(s) outside normal range in complete blood count.`;
}

export function analyzeSubmission(submission: Submission): AnalysisResult {
  const panelFindings = submission.panels.map(analyzePanel);
  
  // Collect all abnormal findings
  const allFindings = panelFindings.flatMap(pf => pf.findings);
  const criticals = allFindings.filter(f => f.status.includes("CRITICAL"));
  const abnormals = allFindings.filter(f => f.status !== "NORMAL");
  
  // Determine overall severity
  let overallSeverity: OverallSeverity = "OK";
  if (criticals.length > 0) {
    overallSeverity = "SEVERE";
  } else if (abnormals.length >= 5) {
    overallSeverity = "MODERATE";
  } else if (abnormals.length > 0) {
    overallSeverity = "MILD";
  }
  
  // Generate comprehensive summary bullets
  const summaryBullets: string[] = [];
  
  // Add header with overall status
  if (abnormals.length === 0) {
    summaryBullets.push("✅ All lab markers are within normal reference ranges - excellent overall health indicators.");
  } else {
    summaryBullets.push(`📊 Lab Analysis Summary: ${abnormals.length} marker(s) outside normal range across ${panelFindings.length} panel(s).`);
  }
  
  // Add critical findings first with urgency
  if (criticals.length > 0) {
    summaryBullets.push(`⚠️ URGENT: ${criticals.length} critical value(s) detected requiring immediate clinical attention.`);
    criticals.forEach(c => {
      summaryBullets.push(`   • ${c.marker}: ${c.value} ${c.unit} (${c.status.replace('_', ' ')}) - ${c.note}`);
    });
  }
  
  // Add panel-specific summaries with context
  panelFindings.forEach(pf => {
    if (pf.summary) {
      summaryBullets.push(`🔬 ${pf.panelName}: ${pf.summary}`);
    }
  });
  
  // List high priority abnormals (non-critical)
  const highAbnormals = allFindings.filter(f => 
    (f.status === "HIGH" || f.status === "LOW") && !f.status.includes("CRITICAL")
  );
  
  if (highAbnormals.length > 0 && highAbnormals.length <= 5) {
    summaryBullets.push("📌 Key findings to discuss with your provider:");
    highAbnormals.forEach(a => {
      summaryBullets.push(`   • ${a.marker}: ${a.value} ${a.unit} (${a.status}) - ${a.note}`);
    });
  } else if (highAbnormals.length > 5) {
    summaryBullets.push(`📌 ${highAbnormals.length} markers outside normal range - see detailed findings below for complete review.`);
  }
  
  // Add specific recommendations based on findings
  const recommendations: string[] = [];
  
  if (criticals.length > 0) {
    recommendations.push("Contact your healthcare provider immediately to discuss critical values");
  }
  if (abnormals.length >= 5) {
    recommendations.push("Comprehensive review with your doctor recommended due to multiple abnormal markers");
  }
  if (abnormals.length > 0 && abnormals.length < 5) {
    recommendations.push("Schedule follow-up with your healthcare provider to discuss these findings");
  }
  
  // Add pattern-based recommendations
  const hasKidneyIssues = allFindings.some(f => 
    (f.marker === "BUN" || f.marker === "Creatinine") && f.status !== "NORMAL"
  );
  const hasLiverIssues = allFindings.some(f => 
    (f.marker === "ALT (SGPT)" || f.marker === "AST (SGOT)") && f.status !== "NORMAL"
  );
  const hasThyroidIssues = allFindings.some(f => 
    (f.marker === "TSH" || f.marker === "Free T4") && f.status !== "NORMAL"
  );
  
  if (hasKidneyIssues) {
    recommendations.push("Consider discussing kidney function markers with your provider");
  }
  if (hasLiverIssues) {
    recommendations.push("Liver enzyme levels may warrant further evaluation");
  }
  if (hasThyroidIssues) {
    recommendations.push("Thyroid function abnormalities detected - endocrinology consultation may be beneficial");
  }
  
  // Add recommendations to summary
  if (recommendations.length > 0) {
    summaryBullets.push("💡 Recommended next steps:");
    recommendations.forEach(rec => {
      summaryBullets.push(`   • ${rec}`);
    });
  }
  
  // Add positive reinforcement for normal results
  if (abnormals.length === 0) {
    summaryBullets.push("🎯 Continue maintaining your current healthy lifestyle and routine health monitoring.");
  }
  
  return {
    overallSeverity,
    summaryBullets,
    panelFindings,
  };
}

