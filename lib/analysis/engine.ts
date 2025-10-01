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

function getMarkerGuidance(markerName: string, status: MarkerStatus): string {
  const isLow = status === "LOW" || status === "CRITICAL_LOW";
  const isHigh = status === "HIGH" || status === "CRITICAL_HIGH";
  
  const guidance: Record<string, { low: string; high: string }> = {
    "Hemoglobin": {
      low: "Possible anemia, which may cause fatigue, weakness, and shortness of breath. May indicate iron deficiency, vitamin deficiency, or chronic disease.",
      high: "Possible dehydration, lung disease, or polycythemia. Can increase blood thickness and risk of clots."
    },
    "Hematocrit": {
      low: "Indicates reduced red blood cell volume, often associated with anemia or blood loss.",
      high: "May indicate dehydration, lung disease, or excessive red blood cell production."
    },
    "WBC": {
      low: "Weakened immune system, possible bone marrow issues, or medication side effects. Increased infection risk.",
      high: "Possible infection, inflammation, stress response, or bone marrow disorder. May indicate immune system activation."
    },
    "Platelets": {
      low: "Increased bleeding risk, possible bone marrow problems, or autoimmune conditions.",
      high: "Increased clotting risk, possible bone marrow disorder, or inflammatory condition."
    },
    "Glucose": {
      low: "Hypoglycemia - may cause dizziness, confusion, shakiness. Can be related to medication, missed meals, or metabolic issues.",
      high: "Hyperglycemia - possible diabetes or prediabetes. May indicate insulin resistance or pancreatic dysfunction."
    },
    "BUN": {
      low: "Possible liver disease, malnutrition, or overhydration.",
      high: "Possible kidney dysfunction, dehydration, high protein diet, or heart failure."
    },
    "Creatinine": {
      low: "Possible low muscle mass or liver disease.",
      high: "Possible kidney dysfunction or impaired kidney filtration. May indicate acute or chronic kidney disease."
    },
    "Sodium": {
      low: "Hyponatremia - may cause confusion, seizures, weakness. Can be from excess water intake, heart failure, or kidney issues.",
      high: "Hypernatremia - may cause thirst, confusion, seizures. Often indicates dehydration or hormonal imbalances."
    },
    "Potassium": {
      low: "Hypokalemia - can cause muscle weakness, cramps, heart rhythm problems. May be from diuretics, vomiting, or diarrhea.",
      high: "Hyperkalemia - can cause dangerous heart rhythm problems. May indicate kidney disease or medication effects."
    },
    "Calcium": {
      low: "May affect bone health, muscle function, and nerve signaling. Can indicate vitamin D deficiency or parathyroid issues.",
      high: "May indicate hyperparathyroidism, cancer, or excessive vitamin D. Can cause kidney stones and bone problems."
    },
    "AST (SGOT)": {
      low: "Generally not clinically significant.",
      high: "Possible liver damage, muscle injury, or heart problems. May indicate hepatitis, fatty liver, or medication effects."
    },
    "ALT (SGPT)": {
      low: "Generally not clinically significant.",
      high: "Possible liver damage or inflammation. More specific for liver issues than AST. May indicate fatty liver, hepatitis, or medication toxicity."
    },
    "Total Cholesterol": {
      low: "Generally considered positive, but very low levels may indicate malnutrition or liver disease.",
      high: "Increased cardiovascular disease risk. May indicate need for dietary changes, exercise, or medication."
    },
    "LDL": {
      low: "Generally considered protective against heart disease.",
      high: "Major risk factor for heart disease and stroke. LDL is the 'bad' cholesterol that builds up in arteries."
    },
    "HDL": {
      low: "Reduced cardiovascular protection. HDL is the 'good' cholesterol that removes bad cholesterol from arteries.",
      high: "Generally protective against heart disease. Higher HDL is typically beneficial."
    },
    "Triglycerides": {
      low: "Generally not concerning unless extremely low.",
      high: "Increased risk of heart disease and pancreatitis. Often associated with obesity, diabetes, or metabolic syndrome."
    },
    "A1c": {
      low: "Generally indicates good blood sugar control. Very low levels are rare.",
      high: "Indicates poor blood sugar control over the past 2-3 months. Levels ≥6.5% indicate diabetes; 5.7-6.4% indicate prediabetes."
    },
    "TSH": {
      low: "Possible hyperthyroidism (overactive thyroid). May cause weight loss, rapid heartbeat, anxiety, and heat intolerance.",
      high: "Possible hypothyroidism (underactive thyroid). May cause fatigue, weight gain, cold intolerance, and depression."
    },
    "Free T4": {
      low: "Possible hypothyroidism. May cause fatigue, weight gain, and slowed metabolism.",
      high: "Possible hyperthyroidism. May cause weight loss, anxiety, and rapid heartbeat."
    },
    "Vitamin D 25-OH": {
      low: "Vitamin D deficiency can affect bone health, immune function, and mood. May increase risk of osteoporosis and fractures.",
      high: "Rare; may indicate excessive supplementation. Very high levels can cause calcium buildup and kidney problems."
    },
    "Ferritin": {
      low: "Iron deficiency - may cause anemia, fatigue, and weakened immune function. Can indicate inadequate dietary iron or blood loss.",
      high: "May indicate iron overload, inflammation, or liver disease. Can also be elevated in chronic inflammatory conditions."
    }
  };
  
  const markerGuidance = guidance[markerName];
  if (!markerGuidance) {
    return "Consult with your healthcare provider for interpretation specific to your health history.";
  }
  
  return isLow ? markerGuidance.low : markerGuidance.high;
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
    summaryBullets.push("✅ EXCELLENT RESULTS: All lab markers are within normal reference ranges - excellent overall health indicators.");
    summaryBullets.push("");
    summaryBullets.push("🎯 What This Means:");
    summaryBullets.push("   • Your body's major organ systems (kidneys, liver, heart, thyroid, blood cells) are functioning optimally");
    summaryBullets.push("   • No immediate health concerns detected in these lab results");
    summaryBullets.push("   • Continue your current health maintenance routine");
    summaryBullets.push("");
  } else {
    summaryBullets.push(`📊 COMPREHENSIVE LAB ANALYSIS SUMMARY`);
    summaryBullets.push("");
    summaryBullets.push(`📈 Overview: ${abnormals.length} marker(s) outside normal range detected across ${panelFindings.length} panel(s)`);
    summaryBullets.push(`   • Severity Level: ${overallSeverity}`);
    summaryBullets.push(`   • Total Markers Analyzed: ${allFindings.length}`);
    summaryBullets.push(`   • Normal Results: ${allFindings.length - abnormals.length}`);
    summaryBullets.push(`   • Abnormal Results: ${abnormals.length}`);
    if (criticals.length > 0) {
      summaryBullets.push(`   • Critical Values: ${criticals.length} ⚠️`);
    }
    summaryBullets.push("");
  }
  
  // Add critical findings first with urgency and detailed explanation
  if (criticals.length > 0) {
    summaryBullets.push(`🚨 CRITICAL FINDINGS - IMMEDIATE ATTENTION REQUIRED`);
    summaryBullets.push("");
    summaryBullets.push(`${criticals.length} critical value(s) detected that are significantly outside the normal range.`);
    summaryBullets.push("These results require immediate clinical attention and should be discussed with your healthcare provider TODAY.");
    summaryBullets.push("");
    criticals.forEach((c, index) => {
      summaryBullets.push(`${index + 1}. ${c.marker}: ${c.value} ${c.unit}`);
      summaryBullets.push(`   Status: ${c.status.replace(/_/g, ' ')}`);
      summaryBullets.push(`   Reference Range: ${c.refLow}-${c.refHigh} ${c.unit}`);
      summaryBullets.push(`   Clinical Significance: ${c.note}`);
      summaryBullets.push(`   Action Required: Contact your healthcare provider immediately`);
      summaryBullets.push("");
    });
  }
  
  // Add detailed panel-specific analysis
  if (panelFindings.length > 0) {
    summaryBullets.push(`🔬 DETAILED PANEL-BY-PANEL ANALYSIS`);
    summaryBullets.push("");
    
    panelFindings.forEach((pf, panelIndex) => {
      const panelAbnormals = pf.findings.filter(f => f.status !== "NORMAL");
      const panelNormals = pf.findings.filter(f => f.status === "NORMAL");
      
      summaryBullets.push(`${panelIndex + 1}. ${pf.panelName} Panel (${pf.findings.length} markers tested)`);
      summaryBullets.push(`   ✓ Normal: ${panelNormals.length} | ⚠️ Abnormal: ${panelAbnormals.length}`);
      
      if (pf.summary) {
        summaryBullets.push(`   Clinical Interpretation: ${pf.summary}`);
      }
      
      if (panelAbnormals.length > 0) {
        summaryBullets.push(`   Abnormal Markers:`);
        panelAbnormals.forEach(a => {
          summaryBullets.push(`      • ${a.marker}: ${a.value} ${a.unit} [${a.status.replace(/_/g, ' ')}]`);
          summaryBullets.push(`        Range: ${a.refLow}-${a.refHigh} ${a.unit} | Note: ${a.note}`);
        });
      }
      summaryBullets.push("");
    });
  }
  
  // List ALL abnormals with detailed context
  const highAbnormals = allFindings.filter(f => 
    (f.status === "HIGH" || f.status === "LOW") && !f.status.includes("CRITICAL")
  );
  
  if (highAbnormals.length > 0) {
    summaryBullets.push(`📌 KEY FINDINGS TO DISCUSS WITH YOUR HEALTHCARE PROVIDER`);
    summaryBullets.push("");
    summaryBullets.push(`The following ${highAbnormals.length} marker(s) are outside the normal range and should be reviewed:`);
    summaryBullets.push("");
    
    highAbnormals.forEach((a, index) => {
      summaryBullets.push(`${index + 1}. ${a.marker}: ${a.value} ${a.unit} (${a.status.replace(/_/g, ' ')})`);
      summaryBullets.push(`   • Reference Range: ${a.refLow}-${a.refHigh} ${a.unit}`);
      summaryBullets.push(`   • Clinical Note: ${a.note}`);
      
      // Add specific guidance based on marker
      const guidance = getMarkerGuidance(a.marker, a.status);
      if (guidance) {
        summaryBullets.push(`   • What This May Indicate: ${guidance}`);
      }
      summaryBullets.push("");
    });
  }
  
  // Add specific recommendations based on findings
  const recommendations: string[] = [];
  const lifestyleRecommendations: string[] = [];
  const followUpTests: string[] = [];
  
  if (criticals.length > 0) {
    recommendations.push("🚨 URGENT: Contact your healthcare provider IMMEDIATELY to discuss critical values");
    recommendations.push("   Do not wait for a scheduled appointment - call today or seek emergency care if experiencing symptoms");
  }
  
  if (abnormals.length >= 5) {
    recommendations.push("Schedule a comprehensive review with your doctor due to multiple abnormal markers");
    recommendations.push("   Bring this report and your original lab results to your appointment");
  } else if (abnormals.length > 0) {
    recommendations.push("Schedule a follow-up appointment with your healthcare provider within 1-2 weeks");
    recommendations.push("   Prepare questions about the abnormal markers and potential next steps");
  }
  
  // Add pattern-based recommendations with detailed guidance
  const hasKidneyIssues = allFindings.some(f => 
    (f.marker === "BUN" || f.marker === "Creatinine" || f.marker === "eGFR") && f.status !== "NORMAL"
  );
  const hasLiverIssues = allFindings.some(f => 
    (f.marker === "ALT (SGPT)" || f.marker === "AST (SGOT)" || f.marker === "Bilirubin, Total" || f.marker === "Alkaline Phosphatase") && f.status !== "NORMAL"
  );
  const hasThyroidIssues = allFindings.some(f => 
    (f.marker === "TSH" || f.marker === "Free T4" || f.marker === "Free T3") && f.status !== "NORMAL"
  );
  const hasLipidIssues = allFindings.some(f => 
    (f.marker === "Total Cholesterol" || f.marker === "LDL" || f.marker === "HDL" || f.marker === "Triglycerides") && f.status !== "NORMAL"
  );
  const hasDiabeticIndicators = allFindings.some(f => 
    (f.marker === "Glucose" || f.marker === "A1c") && f.status !== "NORMAL"
  );
  const hasAnemiaIndicators = allFindings.some(f => 
    (f.marker === "Hemoglobin" || f.marker === "Hematocrit" || f.marker === "RBC") && f.status === "LOW"
  );
  
  if (hasKidneyIssues) {
    recommendations.push("Kidney function markers are abnormal - discuss with your provider");
    followUpTests.push("Consider: Urinalysis, 24-hour urine collection, kidney ultrasound");
    lifestyleRecommendations.push("Stay well-hydrated (unless advised otherwise by your doctor)");
    lifestyleRecommendations.push("Monitor blood pressure regularly");
    lifestyleRecommendations.push("Limit sodium intake and avoid NSAIDs (ibuprofen, naproxen) unless prescribed");
  }
  
  if (hasLiverIssues) {
    recommendations.push("Liver enzyme levels warrant further evaluation");
    followUpTests.push("Consider: Hepatitis panel, liver ultrasound, review of all medications and supplements");
    lifestyleRecommendations.push("Limit or avoid alcohol consumption");
    lifestyleRecommendations.push("Maintain healthy weight and exercise regularly");
    lifestyleRecommendations.push("Review all medications and supplements with your doctor");
  }
  
  if (hasThyroidIssues) {
    recommendations.push("Thyroid function abnormalities detected - endocrinology consultation may be beneficial");
    followUpTests.push("Consider: Complete thyroid panel (TSH, Free T4, Free T3, thyroid antibodies), thyroid ultrasound");
    lifestyleRecommendations.push("Monitor symptoms like fatigue, weight changes, temperature sensitivity, mood changes");
    lifestyleRecommendations.push("Ensure adequate iodine intake through diet");
  }
  
  if (hasLipidIssues) {
    recommendations.push("Lipid panel shows abnormalities - cardiovascular risk assessment recommended");
    followUpTests.push("Consider: Advanced lipid panel, hs-CRP (inflammation marker), coronary calcium score");
    lifestyleRecommendations.push("Adopt heart-healthy diet (Mediterranean or DASH diet)");
    lifestyleRecommendations.push("Increase physical activity to at least 150 minutes/week");
    lifestyleRecommendations.push("Achieve and maintain healthy weight (BMI 18.5-24.9)");
    lifestyleRecommendations.push("Consider omega-3 supplementation (discuss with your doctor)");
  }
  
  if (hasDiabeticIndicators) {
    recommendations.push("Blood sugar markers are abnormal - diabetes screening or management needed");
    followUpTests.push("Consider: Fasting glucose, oral glucose tolerance test, continuous glucose monitoring");
    lifestyleRecommendations.push("Monitor carbohydrate intake and focus on low glycemic index foods");
    lifestyleRecommendations.push("Engage in regular physical activity (especially after meals)");
    lifestyleRecommendations.push("Maintain healthy weight and monitor blood pressure");
    lifestyleRecommendations.push("Consider meeting with a registered dietitian for meal planning");
  }
  
  if (hasAnemiaIndicators) {
    recommendations.push("Low red blood cell markers detected - anemia workup needed");
    followUpTests.push("Consider: Iron studies (ferritin, TIBC, serum iron), vitamin B12, folate, reticulocyte count");
    lifestyleRecommendations.push("Increase iron-rich foods (red meat, spinach, legumes, fortified cereals)");
    lifestyleRecommendations.push("Pair iron-rich foods with vitamin C for better absorption");
    lifestyleRecommendations.push("Avoid taking calcium supplements with iron-rich meals");
  }
  
  // Add recommendations to summary
  if (recommendations.length > 0) {
    summaryBullets.push("💡 RECOMMENDED NEXT STEPS");
    summaryBullets.push("");
    summaryBullets.push("Immediate Actions:");
    recommendations.forEach(rec => {
      summaryBullets.push(`   ${rec}`);
    });
    summaryBullets.push("");
  }
  
  if (followUpTests.length > 0) {
    summaryBullets.push("Potential Follow-Up Tests to Discuss:");
    followUpTests.forEach(test => {
      summaryBullets.push(`   ${test}`);
    });
    summaryBullets.push("");
  }
  
  if (lifestyleRecommendations.length > 0) {
    summaryBullets.push("Lifestyle Modifications to Consider:");
    lifestyleRecommendations.forEach(lifestyle => {
      summaryBullets.push(`   ✓ ${lifestyle}`);
    });
    summaryBullets.push("");
  }
  
  // Add positive reinforcement for normal results
  if (abnormals.length === 0) {
    summaryBullets.push("🎯 MAINTENANCE RECOMMENDATIONS");
    summaryBullets.push("");
    summaryBullets.push("Your results are excellent! Continue your current healthy habits:");
    summaryBullets.push("   ✓ Maintain regular health monitoring (annual labs recommended)");
    summaryBullets.push("   ✓ Continue balanced diet rich in fruits, vegetables, whole grains, and lean proteins");
    summaryBullets.push("   ✓ Stay physically active (150+ minutes moderate exercise per week)");
    summaryBullets.push("   ✓ Maintain healthy weight and stay hydrated");
    summaryBullets.push("   ✓ Manage stress through sleep, relaxation, and social connections");
    summaryBullets.push("   ✓ Avoid smoking and limit alcohol consumption");
    summaryBullets.push("");
  }
  
  // Add final disclaimer
  summaryBullets.push("⚠️ IMPORTANT REMINDER");
  summaryBullets.push("");
  summaryBullets.push("This analysis is for educational purposes only and does not replace professional medical advice.");
  summaryBullets.push("Always consult with your healthcare provider to interpret these results in the context of:");
  summaryBullets.push("   • Your complete medical history and current symptoms");
  summaryBullets.push("   • Your medications, supplements, and lifestyle factors");
  summaryBullets.push("   • Your family history and risk factors");
  summaryBullets.push("   • Trends in your lab values over time");
  summaryBullets.push("");
  summaryBullets.push("Your doctor will provide personalized recommendations based on your unique situation.");
  
  return {
    overallSeverity,
    summaryBullets,
    panelFindings,
  };
}

