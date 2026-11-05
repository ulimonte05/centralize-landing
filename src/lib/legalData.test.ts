import { describe, expect, it } from 'vitest';
import contact from '../data/contact.json';

// Términos, privacidad, contacto y pie muestran estos datos: sin ellos no se publica.
describe('datos legales del vendedor', () => {
  it('están completos', () => {
    expect(contact.legal.razon_social).not.toBe('');
    expect(contact.legal.domicilio).not.toBe('');
    expect(contact.legal.cuit).toMatch(/^\d{2}-\d{8}-\d$/);
  });
});
