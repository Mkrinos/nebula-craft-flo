import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  CreationSpec,
  GenerateInput,
  GenerateResult,
  JourneyDefinition,
  JourneyChoice,
} from './types';

export type GenerateFn = (input: GenerateInput) => Promise<GenerateResult>;

interface UseCreationJourneyOptions {
  definition: JourneyDefinition;
  generate: GenerateFn;
  onComplete?: (result: GenerateResult, spec: CreationSpec) => void;
}

const EMPTY_SPEC = (definitionId: string): CreationSpec => ({
  definitionId,
  choices: {},
  layers: [],
  freeText: '',
  styleId: null,
  childGivenName: '',
});

export function useCreationJourney({
  definition,
  generate,
  onComplete,
}: UseCreationJourneyOptions) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spec, setSpec] = useState<CreationSpec>(() => EMPTY_SPEC(definition.id));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = definition.steps;
  const currentStep = steps[stepIndex];
  const isClaimStep = currentStep?.kind === 'claim';
  const isLastStep = stepIndex === steps.length - 1;
  const canGoBack = stepIndex > 0 && !busy && !result;

  const reset = useCallback(() => {
    setStepIndex(0);
    setSpec(EMPTY_SPEC(definition.id));
    setResult(null);
    setError(null);
    setBusy(false);
  }, [definition.id]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setStepIndex((i) => Math.max(0, i - 1));
    setSpec((prev) => {
      const prevStep = steps[stepIndex - 1];
      if (!prevStep) return prev;
      const nextChoices = { ...prev.choices };
      delete nextChoices[prevStep.id];
      // Drop the last layer associated with the step we're going back to
      const droppedLayers = prev.layers.slice(0, -1);
      return { ...prev, choices: nextChoices, layers: droppedLayers };
    });
  }, [canGoBack, stepIndex, steps]);

  const advance = useCallback(() => {
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }, [steps.length]);

  const commitChoice = useCallback(
    (choice: JourneyChoice) => {
      if (!currentStep) return;
      setSpec((prev) => ({
        ...prev,
        choices: { ...prev.choices, [currentStep.id]: choice.id },
        layers: choice.previewLayer
          ? [...prev.layers, choice.previewLayer]
          : prev.layers,
      }));
      advance();
    },
    [currentStep, advance],
  );

  const setFreeText = useCallback(
    (value: string) => {
      setSpec((prev) => ({ ...prev, freeText: value }));
    },
    [],
  );

  const setStyle = useCallback((styleId: string | null) => {
    setSpec((prev) => ({ ...prev, styleId }));
  }, []);

  const setName = useCallback((name: string) => {
    setSpec((prev) => ({ ...prev, childGivenName: name }));
  }, []);

  const skipStep = useCallback(() => {
    if (!currentStep?.optional) return;
    advance();
  }, [currentStep, advance]);

  const assemblePrompt = useCallback((s: CreationSpec): string => {
    const fragments: string[] = [];
    for (const step of definition.steps) {
      const choiceId = s.choices[step.id];
      if (!choiceId) continue;
      const choice = step.choices?.find((c) => c.id === choiceId);
      if (choice?.promptFragment) fragments.push(choice.promptFragment);
      else if (choice?.label) fragments.push(choice.label);
    }
    if (s.freeText && s.freeText.trim()) fragments.push(s.freeText.trim());
    return fragments.join(', ');
  }, [definition]);

  const fireGenerate = useCallback(async () => {
    if (busy || result) return;
    if (!spec.childGivenName.trim()) {
      setError('Please name your creation first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const prompt = assemblePrompt(spec);
      const res = await generate({ spec, prompt, style: spec.styleId ?? null });
      if (res.error) {
        setError(res.error);
        setResult(res);
        return;
      }
      setResult(res);

      // Persist child_given_name, authored_by, spec to the most recent matching row
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (userId && res.saved) {
          const { data: rows } = await supabase
            .from('generated_images')
            .select('id, created_at')
            .eq('user_id', userId)
            .ilike('prompt', prompt.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(1);
          const rowId = rows?.[0]?.id;
          if (rowId) {
            await supabase
              .from('generated_images')
              .update({
                child_given_name: spec.childGivenName.trim(),
                authored_by: 'child',
                spec: JSON.parse(JSON.stringify(spec)),
              })
              .eq('id', rowId);
          }
        }
      } catch (persistErr) {
        console.warn('Spec persistence skipped:', persistErr);
      }

      onComplete?.(res, spec);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      setError(msg);
      setResult({ image: '', error: msg });
    } finally {
      setBusy(false);
    }
  }, [busy, result, spec, assemblePrompt, generate, onComplete]);

  const progress = useMemo(
    () => ({ current: stepIndex + 1, total: steps.length }),
    [stepIndex, steps.length],
  );

  return {
    steps,
    stepIndex,
    currentStep,
    isClaimStep,
    isLastStep,
    spec,
    busy,
    result,
    error,
    progress,
    canGoBack,
    commitChoice,
    setFreeText,
    setStyle,
    setName,
    skipStep,
    goBack,
    fireGenerate,
    reset,
    assemblePrompt,
  };
}
