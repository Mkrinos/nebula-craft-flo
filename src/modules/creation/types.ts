export interface PreviewLayer {
  kind: 'color' | 'icon' | 'text' | 'image';
  value: string;
  label?: string;
  opacity?: number;
}

export interface JourneyChoice {
  id: string;
  label: string;
  emoji?: string;
  previewLayer?: PreviewLayer;
  /** Text fragment contributed to the assembled prompt */
  promptFragment?: string;
}

export type JourneyStepKind = 'choice' | 'freeText' | 'style' | 'claim';

export interface JourneyStep {
  id: string;
  hostLine: string;
  kind?: JourneyStepKind; // defaults to 'choice'
  choices?: JourneyChoice[];
  allowChildText?: boolean;
  optional?: boolean;
  placeholder?: string;
}

export interface JourneyDefinition {
  id: string;
  steps: JourneyStep[];
}

export interface CreationSpec {
  definitionId: string;
  /** Stable map of stepId -> choiceId (or free text value) */
  choices: Record<string, string>;
  /** Visible layers in committed order, one per choice */
  layers: PreviewLayer[];
  /** Free-text contribution from the optional text step */
  freeText?: string;
  /** Optional Styles selection (style preset id/key) */
  styleId?: string | null;
  /** Required child-given creation name */
  childGivenName: string;
}

export interface GenerateInput {
  spec: CreationSpec;
  /** Concatenated prompt assembled from choice fragments + freeText */
  prompt: string;
  /** Style passed through to the generator, if any */
  style?: string | null;
  /** Map of stepId -> child-facing choice label, for the authorship summary */
  labels?: Record<string, string>;
}

export interface GenerateResult {
  image: string;
  saved?: boolean;
  cached?: boolean;
  error?: string;
  /** HTTP-style status hint when the call was rejected by quota */
  limitReached?: boolean;
  /** Child-voice description of what they made, persisted into spec */
  authorshipSummary?: string;
}
