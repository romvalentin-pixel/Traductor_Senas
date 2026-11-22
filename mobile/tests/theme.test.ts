import { darkColors, lightColors, resolveColors } from '../src/constants/theme';

describe('resolución de tema', () => {
  it('usa colores claros en modo claro', () => {
    expect(resolveColors('light', 'dark')).toEqual(lightColors);
  });

  it('usa colores oscuros en modo oscuro', () => {
    expect(resolveColors('dark', 'light')).toEqual(darkColors);
  });

  it('sigue el esquema del sistema cuando el modo es system', () => {
    expect(resolveColors('system', 'dark')).toEqual(darkColors);
    expect(resolveColors('system', 'light')).toEqual(lightColors);
    expect(resolveColors('system', null)).toEqual(lightColors);
  });
});
