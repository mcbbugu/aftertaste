export type FindingCategory = "fonts" | "palette" | "layout" | "copy" | "motion";

export type Finding = {
  category: FindingCategory;
  title: string;
  evidence: string[];
  deduction: number;
};

export type SampledStyle = {
  selector: string;
  fontFamily: string;
  color: string;
  background: string;
  borderRadius: string;
  padding: string;
  textAlign: string;
  gridTemplateColumns: string;
};

export type PageSnapshot = {
  url: string;
  title: string;
  headings: { tag: string; text: string }[];
  paragraphs: string[];
  buttons: string[];
  links: string[];
  bodyText: string;
  computedFonts: string[];
  declaredFonts: string[];
  googleFonts: string[];
  backgrounds: string[];
  colors: string[];
  radii: string[];
  sectionPaddings: string[];
  animations: string[];
  keyframes: string[];
  hasLucide: boolean;
  svgIconCount: number;
  featureCardCount: number;
  equalWidthCards: boolean;
  heroTextAlign: string;
  samples: SampledStyle[];
};

export type AuditResult = {
  url: string;
  score: number;
  label: string;
  summary: string;
  findings: Finding[];
  screenshotPath: string | null;
};
