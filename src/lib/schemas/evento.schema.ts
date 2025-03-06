import { z } from 'zod';

export const eventoSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  local: z.string().min(3, 'O local deve ter pelo menos 3 caracteres'),
  data: z.string().min(1, 'A data é obrigatória')
    .refine((data) => {
      const date = new Date(data);
      return !isNaN(date.getTime());
    }, 'Data inválida'),
  hora: z.string().min(1, 'A hora é obrigatória')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  capacidade: z.number().min(1, 'A capacidade deve ser maior que 0'),
  descricao: z.string().optional(),
});

export type EventoFormData = z.infer<typeof eventoSchema>; 