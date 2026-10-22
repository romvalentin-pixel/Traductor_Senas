import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TextField from '../src/components/TextField';
import { SettingsProvider } from '../src/context/SettingsContext';

function renderField(props: React.ComponentProps<typeof TextField>) {
  return render(
    <SettingsProvider>
      <TextField {...props} />
    </SettingsProvider>
  );
}

describe('TextField', () => {
  it('muestra la etiqueta, el valor y el error', async () => {
    const { getByText, getByDisplayValue } = await renderField({
      label: 'Email',
      value: 'ana@ejemplo.com',
      onChangeText: jest.fn(),
      error: 'Email inválido',
    });

    expect(getByText('Email')).toBeTruthy();
    expect(getByDisplayValue('ana@ejemplo.com')).toBeTruthy();
    expect(getByText('Email inválido')).toBeTruthy();
  });

  it('permite escribir y notifica el cambio', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await renderField({ label: 'Nombre', value: '', onChangeText });

    await fireEvent.changeText(getByLabelText('Nombre'), 'Ana');

    expect(onChangeText).toHaveBeenCalledWith('Ana');
  });

  it('alterna la visibilidad de la contraseña', async () => {
    const { getByLabelText } = await renderField({
      label: 'Contraseña',
      value: 'secreto',
      onChangeText: jest.fn(),
      secureTextEntry: true,
    });

    expect(getByLabelText('Contraseña').props.secureTextEntry).toBe(true);

    await fireEvent.press(getByLabelText('Mostrar contraseña'));

    expect(getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
  });
});
