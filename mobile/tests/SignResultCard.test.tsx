import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import SignResultCard from '../src/components/SignResultCard';
import { SettingsProvider } from '../src/context/SettingsContext';
import type { Prediction } from '../src/types/api';

const prediction: Prediction = {
  sign: 'BUENOS_DIAS',
  translated_text: 'Buenos días',
  confidence: 0.876,
  model: 'demo',
  processing_time_ms: 12.4,
};

function renderCard(overrides: Partial<React.ComponentProps<typeof SignResultCard>> = {}) {
  const onSpeak = jest.fn();
  const onSave = jest.fn();
  return render(
    <SettingsProvider>
      <SignResultCard prediction={prediction} onSpeak={onSpeak} onSave={onSave} {...overrides} />
    </SettingsProvider>
  ).then((utils) => ({ ...utils, onSpeak, onSave }));
}

describe('SignResultCard', () => {
  it('muestra la seña, la traducción y la confianza', async () => {
    const { getByText, getAllByText } = await renderCard();

    expect(getByText('BUENOS DIAS')).toBeTruthy();
    expect(getByText('Buenos días')).toBeTruthy();
    expect(getAllByText('88%').length).toBeGreaterThan(0);
    expect(getByText(/Modelo: demo/)).toBeTruthy();
  });

  it('dispara las acciones de escuchar y guardar', async () => {
    const { getByText, onSpeak, onSave } = await renderCard();

    await fireEvent.press(getByText('Escuchar'));
    await fireEvent.press(getByText('Guardar'));

    expect(onSpeak).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('advierte cuando la confianza es baja y respeta el estado guardado', async () => {
    const { getByText } = await renderCard({ lowConfidence: true, saved: true });

    expect(getByText(/Confianza baja/)).toBeTruthy();
    expect(getByText('Guardada')).toBeTruthy();
    expect(getByText('Escuchar')).toBeTruthy();
  });
});
