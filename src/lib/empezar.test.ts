import { describe, it, expect, vi } from 'vitest';
import { POST } from '../pages/api/empezar';

const form = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const ctx = (f: FormData) => ({ request: { formData: async () => f }, redirect: vi.fn((to: string, status: number) => ({ to, status })) }) as any;

describe('POST /api/empezar', () => {
  it('redirige a /contacto?enviado=1, no a /gracias', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const c = ctx(form({ nombre: 'Ana', inmobiliaria: 'X', email: 'a@b.co', prefijo: '54', whatsapp: '2994104866', plan: 'contacto' }));
    await POST(c);
    expect(c.redirect).toHaveBeenCalledWith('/contacto?enviado=1', 303);
  });
});
